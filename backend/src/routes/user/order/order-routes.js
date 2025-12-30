import express from "express";
import {
  createOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  cancelOrder,
  trackGuestOrder,
  cancelGuestOrder,
  validateCouponForCheckout,
  getOrderSummary,
  downloadInvoice,
} from "../../../controllers/user/order/order-controllers.js";
import {
  validateCreateOrder,
  validateVerifyPayment,
  validateOrderId,
  validateCancelOrder,
  validateCouponCode,
  validateGetOrders,
  validateGuestOrderTracking,
  validateGuestOrderCancellation,
} from "../../../middlewares/user/order/order-validator.js";

import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Track guest order by order number + email
router.post("/track", validateGuestOrderTracking, trackGuestOrder);

// Cancel guest order by order number + email
router.post("/track/cancel", validateGuestOrderCancellation, cancelGuestOrder);

// ==================== AUTHENTICATED/GUEST ROUTES (OPTIONAL AUTH) ====================

// All routes below support both authenticated users and guests
router.use(optionalAuth);

// Get order summary for checkout page
router.get("/summary", getOrderSummary);

// Validate coupon for checkout
router.post("/coupon/validate", validateCouponCode, validateCouponForCheckout);

// Create new order
router.post("/create", validateCreateOrder, createOrder);

// Verify Razorpay payment
router.post("/verify-payment", validateVerifyPayment, verifyPayment);

// Get all orders (user's or guest's based on auth/deviceId)
router.get("/", validateGetOrders, getOrders);

// Get single order by ID
router.get("/:orderId", validateOrderId, getOrderById);

// Cancel order
router.post("/:orderId/cancel", validateCancelOrder, cancelOrder);

// Download invoice
router.get("/:orderId/invoice", validateOrderId, downloadInvoice);

export default router;