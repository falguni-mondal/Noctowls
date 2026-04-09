import express from "express";
import {
  getAllAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  manageReturnRequest,
  shipOrder,
  ordersExporter,
} from "../../../controllers/admin/orders/adminOrderControllers.js";

// Import middlewares
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ==================== ADMIN ORDER ROUTES ====================
// Base Route: /api/v1/admin/orders

// 1. Order Statistics
// ⚠️ MUST be placed before /:orderId to prevent "stats" being treated as an ID
router.get("/stats", isValidUser, isAdmin, getOrderStats);

// 2. Get All Orders (with Pagination/Search)
router.get("/", isValidUser, isAdmin, getAllAdminOrders);

//  Export Orders (Must be before /:orderId)
router.get("/export", isValidUser, isAdmin, ordersExporter);

// 3. Single Order Operations
router
  .route("/:orderId")
  .get(isValidUser, isAdmin, getAdminOrderById)      // View Order Details
  .put(isValidUser, isAdmin, updateOrderStatus)      // Update Status (Shipped/Delivered etc)
  .delete(isValidUser, isAdmin, deleteOrder);        // Delete Order (Cancelled only)

// 4. Specific Action Routes
// Route for Manual Shipping (Trigger Delhivery Sync)
router.post("/:orderId/ship", isValidUser, isAdmin, shipOrder);

// Route for Managing Returns (Approve/Reject)
router.put("/:orderId/return", isValidUser, isAdmin, manageReturnRequest);

export default router;