import Review from "../../../models/review-model.js";
import Order from "../../../models/order-model.js";
import { uploadImageInWorker } from "../../../utils/imageWorker.js";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import { updateProductRating } from "../../../utils/helpers/rating-helper.js";

export const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    // A. Check for Existing Review
    const existingReview = await Review.existingReview(
      productId,
      userId,
      deviceId
    );

    if (existingReview) {
      return res.status(200).json({
        canReview: true,
        hasReviewed: true,
        review: existingReview,
        message:
          "You have already reviewed this product. You can update your review.",
      });
    }

    // B. Check for Verified Purchase (Must be DELIVERED)
    const query = {
      "items.product": productId,
      orderStatus: "delivered",
    };

    if (userId) query.user = userId;
    else query.deviceId = deviceId;

    const hasPurchased = await Order.exists(query);

    if (!hasPurchased) {
      return res.status(200).json({
        canReview: false,
        message:
          "You can only review products you have purchased and received.",
      });
    }

    return res.status(200).json({
      canReview: true,
      hasReviewed: false,
      message: "You are eligible to review this product.",
    });
  } catch (error) {
    console.error("Eligibility Check Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, userName, userEmail } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const files = req.files;

    // 1. Security Check
    const purchaseQuery = {
      "items.product": productId,
      orderStatus: "delivered",
    };
    if (userId) purchaseQuery.user = userId;
    else purchaseQuery.deviceId = deviceId;

    const hasPurchased = await Order.exists(purchaseQuery);
    if (!hasPurchased) {
      return res
        .status(403)
        .json({ success: false, message: "Purchase verification failed." });
    }

    // 2. Process Images
    let reviewImages = [];
    if (files && files.length > 0) {
      const filesToUpload = files.slice(0, 5);
      const uploadPromises = filesToUpload.map((file) =>
        uploadImageInWorker(file, `reviews/${productId}`)
      );
      const results = await Promise.all(uploadPromises);
      reviewImages = results.map((res) => ({
        url: res.url,
        imageId: res.imageId,
      }));
    }

    // 3. Save Review
    const newReview = await Review.create({
      product: productId,
      user: userId || undefined,
      deviceId: userId ? undefined : deviceId,
      userName,
      userEmail,
      rating: Number(rating),
      comment,
      images: reviewImages,
      status: "pending",
    });

    // Recalculate Rating
    await updateProductRating(productId);

    return res.status(201).json({
      success: true,
      message: "Review submitted! It will be visible after approval.",
      review: newReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }
    console.error("Create Review Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit review." });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const query = { product: productId, status: "accepted" };

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-userEmail -deviceId"); // Hide sensitive data

    const stats = await Review.getProductRatingStats(productId);

    return res.status(200).json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load reviews." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const rawExisting = req.body.existingImages;

    // --- PARSE EXISTING IMAGES ---
    let keptImages = [];
    if (rawExisting) {
      try {
        const strData = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;
        const parsed = JSON.parse(strData);
        if (Array.isArray(parsed)) {
          keptImages = parsed.filter((img) => img && img.url && img.imageId);
        }
      } catch (e) {
        console.error("Update Review JSON Parse Error:", e.message);
        keptImages = [];
      }
    }

    // --- HANDLE NEW FILES ---
    const newFiles = req.files || [];
    if (keptImages.length + newFiles.length > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Total images cannot exceed 5." });
    }

    // --- FETCH REVIEW ---
    const query = { _id: reviewId };
    if (userId) query.user = userId;
    else query.deviceId = deviceId;

    const review = await Review.findOne(query);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // --- DELETE REMOVED IMAGES ---
    const imagesToDelete = review.images.filter(
      (dbImg) => !keptImages.some((kept) => kept.imageId === dbImg.imageId)
    );

    if (imagesToDelete.length > 0) {
      Promise.allSettled(
        imagesToDelete.map((img) => deleteWithRetry(img.imageId))
      ).catch((err) => console.error("Deletion Error:", err));
    }

    // --- UPLOAD NEW IMAGES ---
    let newUploadedImages = [];
    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map((file) =>
        uploadImageInWorker(file, `reviews/${review.product}`)
      );
      const results = await Promise.all(uploadPromises);
      newUploadedImages = results.map((res) => ({
        url: res.url,
        imageId: res.imageId,
      }));
    }

    // --- SAVE UPDATE ---
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;

    review.images = [...keptImages, ...newUploadedImages];
    
    // IMPORTANT: Status goes back to pending on edit
    review.status = "pending"; 

    await review.save();

    // Recalculate Rating IMMEDIATELY
    // Since this review is now "pending", it should be REMOVED from the average calculation.
    // This function must run to update the Product model.
    await updateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully!",
      review: review,
    });
  } catch (error) {
    console.error("Error Review Update:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};