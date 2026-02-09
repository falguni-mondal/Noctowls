import Review from "../../../models/review-model.js";
import Order from "../../../models/order-model.js";
// ✅ CHANGED: Imported processAndUploadImage from the new utility file
import { processAndUploadImage, cleanupUploadedImages } from "../../../utils/imageUtils.js";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import { updateProductRating } from "../../../utils/helpers/rating-helper.js";

export const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

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
        message: "You can update your review.",
      });
    }

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
        message: "Verified purchase required.",
      });
    }

    return res.status(200).json({
      canReview: true,
      hasReviewed: false,
      message: "Eligible to review.",
    });
  } catch (error) {
    console.error("Eligibility Check Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createReview = async (req, res) => {
  // Track uploaded images for rollback in case of DB error
  let uploadedImagesRecord = [];

  try {
    const { productId } = req.params;
    const { rating, comment, userName, userEmail } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const files = req.files;

    const purchaseQuery = { "items.product": productId, orderStatus: "delivered" };
    if (userId) purchaseQuery.user = userId;
    else purchaseQuery.deviceId = deviceId;

    const hasPurchased = await Order.exists(purchaseQuery);
    if (!hasPurchased) {
      return res.status(403).json({ success: false, message: "Purchase verification failed." });
    }

    let reviewImages = [];
    if (files && files.length > 0) {
      const filesToUpload = files.slice(0, 5);
      
      // ✅ CHANGED: Use Promise.all with processAndUploadImage
      const uploadPromises = filesToUpload.map((file) =>
        processAndUploadImage(file, `reviews/${productId}`)
      );
      
      const results = await Promise.all(uploadPromises);
      
      // Track successes for potential rollback
      uploadedImagesRecord = [...results];

      reviewImages = results.map((res) => ({ url: res.url, imageId: res.imageId }));
    }

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

    await updateProductRating(productId);

    return res.status(201).json({
      success: true,
      message: "Review submitted for approval.",
      review: newReview,
    });
  } catch (error) {
    // ✅ ADDED: Rollback logic (Cleanup images if DB save fails)
    if (uploadedImagesRecord.length > 0) {
      await cleanupUploadedImages(uploadedImagesRecord);
    }

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Review already exists." });
    }
    console.error("Create Review Error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit review." });
  }
};

// --- Returns ALL reviews (No pagination/limit) ---
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sortBy } = req.query;

    const query = { product: productId, status: "accepted" };

    let sortOptions = { createdAt: -1 }; 

    switch (sortBy) {
      case "Highest Ratings": sortOptions = { rating: -1, createdAt: -1 }; break;
      case "Lowest Ratings": sortOptions = { rating: 1, createdAt: -1 }; break;
      case "Newest": sortOptions = { createdAt: -1 }; break;
      case "Oldest": sortOptions = { createdAt: 1 }; break;
      case "Photo priority": case "Featured": default: sortOptions = { createdAt: -1 }; break;
    }

    // Return ALL reviews
    const reviews = await Review.find(query)
      .sort(sortOptions)
      .select("-userEmail -deviceId");

    const stats = await Review.getProductRatingStats(productId);

    return res.status(200).json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Get All Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load reviews." });
  }
};

// --- Returns Top 5 Recent Reviews ---
export const getRecentReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sortBy } = req.query; 

    const query = { product: productId, status: "accepted" };

    let sortOptions = { createdAt: -1 }; 
    // We allow sorting even on the recent list
    switch (sortBy) {
        case "Highest Ratings": sortOptions = { rating: -1, createdAt: -1 }; break;
        case "Lowest Ratings": sortOptions = { rating: 1, createdAt: -1 }; break;
        case "Newest": sortOptions = { createdAt: -1 }; break;
        case "Oldest": sortOptions = { createdAt: 1 }; break;
        default: sortOptions = { createdAt: -1 }; break;
    }

    const reviews = await Review.find(query)
      .sort(sortOptions)
      .limit(5) // Strict Limit
      .select("-userEmail -deviceId");

    const stats = await Review.getProductRatingStats(productId);

    return res.status(200).json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Get Recent Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load reviews." });
  }
}

export const updateReview = async (req, res) => {
  // Track newly uploaded images for rollback
  let uploadedImagesRecord = [];

  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const rawExisting = req.body.existingImages;

    let keptImages = [];
    if (rawExisting) {
      try {
        const strData = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;
        const parsed = JSON.parse(strData);
        if (Array.isArray(parsed)) keptImages = parsed.filter((img) => img && img.url && img.imageId);
      } catch (e) { keptImages = []; }
    }

    const newFiles = req.files || [];
    if (keptImages.length + newFiles.length > 5) {
      return res.status(400).json({ success: false, message: "Image limit exceeded." });
    }

    const query = { _id: reviewId };
    if (userId) query.user = userId;
    else query.deviceId = deviceId;

    const review = await Review.findOne(query);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    const imagesToDelete = review.images.filter(
      (dbImg) => !keptImages.some((kept) => kept.imageId === dbImg.imageId)
    );

    if (imagesToDelete.length > 0) {
      Promise.allSettled(imagesToDelete.map((img) => deleteWithRetry(img.imageId)));
    }

    let newUploadedImages = [];
    if (newFiles.length > 0) {
      // ✅ CHANGED: Use Promise.all with processAndUploadImage
      const uploadPromises = newFiles.map((file) => 
        processAndUploadImage(file, `reviews/${review.product}`)
      );
      
      const results = await Promise.all(uploadPromises);
      
      // Track for rollback
      uploadedImagesRecord = [...results];
      
      newUploadedImages = results.map((res) => ({ url: res.url, imageId: res.imageId }));
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    review.images = [...keptImages, ...newUploadedImages];
    review.status = "pending"; 

    await review.save();
    await updateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully!",
      review: review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);

    // ✅ ADDED: Rollback new images if update fails
    if (uploadedImagesRecord.length > 0) {
      await cleanupUploadedImages(uploadedImagesRecord);
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};