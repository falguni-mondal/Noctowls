import Review from "../models/review-model.js";
import Product from "../models/product-model.js";

/**
 * Update product rating cache after review changes
 * @param {ObjectId} productId - Product ID
 */
export const updateProductRating = async (productId) => {
  try {
    // Get fresh rating stats from reviews
    const stats = await Review.getProductRatingStats(productId);

    // Update product document
    await Product.findByIdAndUpdate(
      productId,
      { rating: stats },
      { new: true }
    );

    return stats;
  } catch (error) {
    console.error("Error updating product rating:", error);
    throw error;
  }
};

/**
 * Recalculate ratings for multiple products (batch update)
 * @param {Array<ObjectId>} productIds - Array of product IDs
 */
export const batchUpdateProductRatings = async (productIds) => {
  const updates = productIds.map((productId) => updateProductRating(productId));
  return Promise.all(updates);
};