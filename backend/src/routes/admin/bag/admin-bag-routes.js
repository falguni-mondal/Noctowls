import express from "express";
import { getAllBags, deleteBag } from "../../../controllers/admin/bag/admin-bag-controllers.js";

// Middleware
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ================= ADMIN BAG ROUTES =================

// Get all active bags
router.get("/all", isValidUser, isAdmin, getAllBags);

// Delete a specific bag
router.delete("/:bagId", isValidUser, isAdmin, deleteBag);

export default router;