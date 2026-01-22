import Review from "../../../models/review-model.js";
import { updateProductRating } from "../../../utils/helpers/rating-helper.js";
import imagekit from "../../../configs/imagekit.js"; // Import ImageKit instance

export const getAllReviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const reviews = await Review.find(query)
      .populate("product", "name images category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);

    return res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Number(page),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    ).populate("product", "name images category");

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Trigger Product Rating Recalculation
    await updateProductRating(review.product._id || review.product);

    return res.status(200).json({
      success: true,
      message: `Review marked as ${status}`,
      review
    });

  } catch (error) {
    console.error("Review Status Update Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // 1. Delete images from ImageKit
    if (review.images && review.images.length > 0) {
      const imageIds = review.images.map((img) => img.imageId).filter(Boolean);

      if (imageIds.length > 0) {
        try {
          await imagekit.bulkDeleteFiles(imageIds);
        } catch (ikError) {
          console.error("Failed to delete images from ImageKit:", ikError);
          // Continue execution to delete the review even if image deletion fails partially
        }
      }
    }

    // 2. Delete Review from DB
    await Review.findByIdAndDelete(reviewId);

    // 3. Recalculate Product Rating
    await updateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      reviewId // Return ID to update frontend state
    });

  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};