import express from "express";
import { trackMetaEvent } from "../../../controllers/user/meta/meta-controllers.js";
import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// First-party CAPI relay endpoint (ad-blocker proof)
router.post("/event", optionalAuth, trackMetaEvent);

export default router;