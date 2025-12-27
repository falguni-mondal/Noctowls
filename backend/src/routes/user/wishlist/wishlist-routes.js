// routes/user/wishlistRoutes.js
import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  checkProductInWishlist,
  clearWishlist,
  getWishlistCount,
  moveToCart,
} from "../../../controllers/user/wishlist/wishlist-controllers.js";
import isValidUser  from "../../../middlewares/global/auth/user-validator.js";
import {
  validateAddToWishlist,
  validateToggleWishlist,
  validateRemoveFromWishlist,
  validateCheckProduct,
  validateMoveToCart,
} from "../../../middlewares/user/wishlist/wishlist-validators.js";

const router = express.Router();

// ==================== PROTECTED ROUTES (Require Authentication) ====================

// All wishlist routes require authentication
router.use(isValidUser);

// Get wishlist
router.get("/", getWishlist);

// Get wishlist items count
router.get("/count", getWishlistCount);

// Check if product is in wishlist
router.get(
  "/check/:productId",
  validateCheckProduct,
  checkProductInWishlist
);

// Add to wishlist
router.post("/add", validateAddToWishlist, addToWishlist);

// Toggle wishlist (add if not exists, remove if exists)
router.post("/toggle", validateToggleWishlist, toggleWishlist);

// Remove from wishlist
router.delete(
  "/remove/:productId",
  validateRemoveFromWishlist,
  removeFromWishlist
);

// Clear wishlist
router.delete("/clear", clearWishlist);

// Move item to cart
router.post("/move-to-cart", validateMoveToCart, moveToCart);

export default router;