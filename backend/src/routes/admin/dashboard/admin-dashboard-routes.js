import express from "express";
import { getDashboardStats } from "../../../controllers/admin/dashboard/admin-dashboard-controllers.js";

// Middleware
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ================= ADMIN DASHBOARD ROUTES =================

// Get all dashboard analytics
router.get("/stats", isValidUser, isAdmin, getDashboardStats);

export default router;