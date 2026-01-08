import Review from "../../../models/review-model.js";
import { updateProductRating } from "../../../utils/helpers/rating-helper.js";

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
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });

    // Recalculate Product Rating
    await updateProductRating(review.product);

    return res
      .status(200)
      .json({ success: true, message: `Review ${status}`, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
