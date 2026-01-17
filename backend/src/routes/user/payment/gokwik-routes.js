import express from "express";
import { createGokwikSignature } from "../../../controllers/user/payment/gokwik-controllers.js";

// Middleware
// Using optionalAuth so both logged-in users and guests can use GoKwik
import { optionalAuth } from "../../../middlewares/global/auth/user-validator.js"; 

const router = express.Router();

// ================= GOKWIK PAYMENT ROUTES =================

// Route to generate the checksum/signature required to open the GoKwik modal
// POST /api/v1/gokwik/sign-request
router.post("/sign-request", optionalAuth, createGokwikSignature);

export default router;