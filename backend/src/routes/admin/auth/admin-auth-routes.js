import express from "express";
import { adminLogin, checkAdmin, adminOtpSender, adminLogout, adminOtpVerifier } from "../../../controllers/admin/auth/admin-auth-controller.js";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isLoginValid from "../../../middlewares/admin/auth/admin-login-validator.js";
import canAdminSendOtp from "../../../middlewares/admin/auth/admin-can-send-otp.js";
import isAdminValidOtp from "../../../middlewares/admin/auth/admin-otp-validator.js";

const router = express.Router();

router.get("/admin", isValidUser, checkAdmin);
router.post("/login", isValidUser, isLoginValid, adminLogin);
router.get("/otp", isValidUser, canAdminSendOtp, adminOtpSender);
router.post("/verify", isValidUser, isAdminValidOtp, adminOtpVerifier);
router.get("/logout", isValidUser, adminLogout);

export default router;