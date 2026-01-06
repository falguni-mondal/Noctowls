import express from "express";
import {
  getAllAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} from "../../../controllers/admin/orders/adminOrderControllers.js";

// ✅ Import your specific middlewares
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; // Adjust path if necessary based on your folder structure

const router = express.Router();

// ==================== ADMIN ORDER ROUTES ====================
// Base Route: /api/v1/admin/orders

// 1. Order Statistics
// ⚠️ MUST be placed before /:orderId to prevent "stats" being treated as an ID
router.get("/stats", isValidUser, isAdmin, getOrderStats);

// 2. Get All Orders (with Pagination/Search)
router.get("/", isValidUser, isAdmin, getAllAdminOrders);

// 3. Single Order Operations
router
  .route("/:orderId")
  .get(isValidUser, isAdmin, getAdminOrderById)      // View Order Details
  .put(isValidUser, isAdmin, updateOrderStatus)      // Update Status (Shipped/Delivered etc)
  .delete(isValidUser, isAdmin, deleteOrder);        // Delete Order (Cancelled only)

export default router;