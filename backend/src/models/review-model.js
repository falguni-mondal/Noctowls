import mongoose from "mongoose";

// ---------- Review Image Schema ----------
const reviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    imageId: { type: String, required: true },
  },
  { _id: false }
);

// ---------- Review Schema ----------
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },

    images: {
      type: [reviewImageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: "Maximum 5 images allowed per review",
      },
    },

    status:{
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected"]
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ rating: -1 });

// ---------- Static Method: Get Product Rating Stats ----------
reviewSchema.statics.getProductRatingStats = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: "accepted",
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const result = stats[0];
  return {
    average: Math.round(result.averageRating * 10) / 10,
    count: result.totalReviews,
    distribution: {
      1: result.rating1,
      2: result.rating2,
      3: result.rating3,
      4: result.rating4,
      5: result.rating5,
    },
  };
};

// ---------- Static Method: Check if User Can Review ----------
reviewSchema.statics.canUserReview = async function (userId, productId) {
  const existingReview = await this.findOne({
    user: userId,
    product: productId,
  });
  return !existingReview;
};

export default mongoose.model("review", reviewSchema);