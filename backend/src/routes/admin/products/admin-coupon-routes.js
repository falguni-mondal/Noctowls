import express from "express";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js";
import {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponId,
} from "../../../middlewares/admin/products/coupon/coupon-validator.js";
import {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  getCouponById,
  getCouponStats,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  cleanupExpiredCoupons,
  getCouponDashboardStats,
  getCouponUsage,
  validateCouponForUser,
} from "../../../controllers/admin/products/adminCouponControllers.js";

const router = express.Router();

// All routes are admin-protected
router.use(isValidUser, isAdmin);

// ==================== SPECIFIC ROUTES FIRST ====================

// Dashboard stats
router.get("/dashboard-stats", getCouponDashboardStats);

// Get active coupons only
router.get("/active", getActiveCoupons);

// Cleanup expired coupons (manual trigger)
router.post("/cleanup", cleanupExpiredCoupons);

// Get coupon usage (supports both userId and deviceId via query params)
// GET /api/admin/coupons/usage?userId=123abc
// GET /api/admin/coupons/usage?deviceId=uuid-here
router.get("/usage", getCouponUsage);

// Validate coupon for user/guest (supports both via query params)
// GET /api/admin/coupons/validate/SAVE50?userId=123abc
// GET /api/admin/coupons/validate/SAVE50?deviceId=uuid-here
router.get("/validate/:code", validateCouponForUser);

// ==================== GENERAL ROUTES ====================

// Get all coupons (with filters, pagination, search)
router.get("/", getAllCoupons);

// Create new coupon
router.post("/", validateCreateCoupon, createCoupon);

// ==================== DYNAMIC ID ROUTES LAST ====================

// Get coupon statistics
router.get("/:id/stats", validateCouponId, getCouponStats);

// Get coupon by ID
router.get("/:id", validateCouponId, getCouponById);

// Update coupon
router.put("/:id", validateUpdateCoupon, updateCoupon);

// Delete coupon
router.delete("/:id", validateCouponId, deleteCoupon);

// Toggle coupon status (activate/deactivate)
router.patch("/:id/toggle", validateCouponId, toggleCouponStatus);

export default router;