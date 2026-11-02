import express from "express";
import {
  getUploadAuth,
  cleanupOrphanedImages,
} from "../../../controllers/user/imagekit/imagekit-controllers.js";
import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// Generate 1 or N one-time upload signature tokens for concurrent frontend uploads
router.get("/auth", optionalAuth, getUploadAuth);

// Rollback orphaned files if a multi-file upload batch fails midway on the client
router.post("/cleanup", optionalAuth, cleanupOrphanedImages);

export default router;