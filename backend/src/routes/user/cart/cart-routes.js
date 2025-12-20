import express from "express";

import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  validateCoupon,
  clearCart,
  validateCart,
  getFreeGiftsTiers,
  getCartSummary,
} from "../../../controllers/user/cart/cart-controllers.js";

import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get("/free-gifts-tiers", getFreeGiftsTiers);

// ==================== GUEST + LOGGED-IN USER ROUTES ====================
router.get("/", optionalAuth, getCart);
router.get("/summary", optionalAuth, getCartSummary);
router.post("/add", optionalAuth, addToCart);
router.put("/item/:itemId", optionalAuth, updateCartItemQuantity);
router.delete("/item/:itemId", optionalAuth, removeCartItem);
router.post("/validate", optionalAuth, validateCart);
router.delete("/clear", optionalAuth, clearCart);
router.post("/coupon/validate", optionalAuth, validateCoupon);
router.post("/coupon/apply", optionalAuth, applyCoupon);
router.delete("/coupon/remove", optionalAuth, removeCoupon);

export default router;