import express from "express";
import {
  checkReviewEligibility,
  createReview,
  getProductReviews,
  getRecentReviews,
  updateReview,
} from "../../../controllers/user/review/review-controllers.js";

import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// ================= USER / PUBLIC ROUTES =================

router.get("/product/:productId", getProductReviews); // Returns ALL
router.get("/product/:productId/recent", getRecentReviews); // Returns 5

router.get("/eligibility/:productId", optionalAuth, checkReviewEligibility);
router.post("/:productId", optionalAuth, createReview);
router.put("/:reviewId", optionalAuth, updateReview);

export default router;