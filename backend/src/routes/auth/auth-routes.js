import express from "express";
import { checkAuth, deleteAccount, loginUser, logoutUser, otpSender, verifyOtp } from "../../controllers/auth/auth-controllers.js";
import isValidUser from "../../middlewares/auth/user-validator.js";
import isValidOtp from "../../middlewares/auth/otp-validator.js";
import canSendOtp from "../../middlewares/auth/can-send-otp.js";

const router = express.Router();

router.get("/me", isValidUser, checkAuth);
router.post("/login", loginUser);
router.get("/otp", isValidUser, canSendOtp, otpSender);
router.post("/verify", isValidUser, isValidOtp, verifyOtp);
router.get("/logout", isValidUser, logoutUser);
router.delete("/delete", isValidUser, deleteAccount);

export default router;