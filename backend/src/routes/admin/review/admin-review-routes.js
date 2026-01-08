import express from "express";
import { 
    getAllReviews, 
    updateReviewStatus 
} from "../../../controllers/admin/review/admin-review-controller.js";

// Middleware
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ================= ADMIN ROUTES =================

router.get("/all", isValidUser, isAdmin, getAllReviews);
router.patch("/:reviewId/status", isValidUser, isAdmin, updateReviewStatus);

export default router;