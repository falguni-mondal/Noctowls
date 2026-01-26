import express from "express";
import { getAllWishlists, deleteWishlist } from "../../../controllers/admin/wishlist/admin-wishlist-controllers.js";

// Middleware
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ================= ADMIN WISHLIST ROUTES =================

// Get all active wishlists
router.get("/all", isValidUser, isAdmin, getAllWishlists);

// Delete a specific wishlist
router.delete("/:wishlistId", isValidUser, isAdmin, deleteWishlist);

export default router;