import Review from "../../../models/review-model.js";
// Uncomment the line below if you decide to re-enable purchase verification later
// import Order from "../../../models/order-model.js";
import {
  cleanupUploadedImages,
  isValidImageKitAsset,
} from "../../../utils/imageUtils.js";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import { updateProductRating } from "../../../utils/helpers/rating-helper.js";

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

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
  const rawImages = parseJsonArray(req.body?.images);

  try {
    const { productId } = req.params;
    const { rating, comment, userName, userEmail } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    if (rawImages.length > 5) {
      await cleanupUploadedImages(rawImages);
      return res
        .status(400)
        .json({ success: false, message: "Maximum 5 images allowed." });
    }

    const invalidImg = rawImages.some((img) => !isValidImageKitAsset(img));
    if (invalidImg) {
      await cleanupUploadedImages(rawImages);
      return res
        .status(400)
        .json({ success: false, message: "Invalid image upload data." });
    }

    const reviewImages = rawImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
    }));

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
    // Rollback pre-uploaded images if DB save fails
    if (rawImages.length > 0) {
      await cleanupUploadedImages(rawImages);
    }

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Review already exists." });
    }
    console.error("Create Review Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit review." });
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
      case "Highest Ratings":
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case "Lowest Ratings":
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case "Newest":
        sortOptions = { createdAt: -1 };
        break;
      case "Oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "Photo priority":
      case "Featured":
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

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
    return res
      .status(500)
      .json({ success: false, message: "Failed to load reviews." });
  }
};

// --- Returns Top 5 Recent Reviews ---
export const getRecentReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sortBy } = req.query;

    const query = { product: productId, status: "accepted" };

    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case "Highest Ratings":
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case "Lowest Ratings":
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case "Newest":
        sortOptions = { createdAt: -1 };
        break;
      case "Oldest":
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const reviews = await Review.find(query)
      .sort(sortOptions)
      .limit(5)
      .select("-userEmail -deviceId");

    const stats = await Review.getProductRatingStats(productId);

    return res.status(200).json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Get Recent Reviews Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load reviews." });
  }
};

export const updateReview = async (req, res) => {
  const rawNewImages = parseJsonArray(req.body?.newImages || req.body?.images);

  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const keptImages = parseJsonArray(req.body?.existingImages).filter((img) =>
      isValidImageKitAsset(img)
    );

    if (rawNewImages.some((img) => !isValidImageKitAsset(img))) {
      await cleanupUploadedImages(rawNewImages);
      return res
        .status(400)
        .json({ success: false, message: "Invalid new image upload data." });
    }

    if (keptImages.length + rawNewImages.length > 5) {
      await cleanupUploadedImages(rawNewImages);
      return res
        .status(400)
        .json({ success: false, message: "Image limit exceeded." });
    }

    const query = { _id: reviewId };
    if (userId) query.user = userId;
    else query.deviceId = deviceId;

    const review = await Review.findOne(query);
    if (!review) {
      await cleanupUploadedImages(rawNewImages);
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    const imagesToDelete = review.images.filter(
      (dbImg) => !keptImages.some((kept) => kept.imageId === dbImg.imageId)
    );

    const newUploadedImages = rawNewImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
    }));

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    review.images = [...keptImages, ...newUploadedImages];
    review.status = "pending";

    await review.save();

    if (imagesToDelete.length > 0) {
      Promise.allSettled(
        imagesToDelete.map((img) => deleteWithRetry(img.imageId))
      );
    }

    await updateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully!",
      review: review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);

    if (rawNewImages.length > 0) {
      await cleanupUploadedImages(rawNewImages);
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};
