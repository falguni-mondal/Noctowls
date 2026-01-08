import express from "express";
import { 
    checkReviewEligibility, 
    createReview, 
    getProductReviews, 
    updateReview 
} from "../../../controllers/user/review/review-controllers.js";

// Middleware
import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js"; 
import upload from "../../../configs/multer.js"; 

const router = express.Router();

// ================= USER / PUBLIC ROUTES =================

router.get("/product/:productId", getProductReviews);
router.get("/eligibility/:productId", optionalAuth, checkReviewEligibility);
router.post(
    "/:productId", 
    optionalAuth, 
    upload.array("images", 5),
    createReview
);
router.put("/:reviewId", optionalAuth, updateReview);

export default router;