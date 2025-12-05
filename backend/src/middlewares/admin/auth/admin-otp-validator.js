import adminModel from "../../../models/admin-model.js";

const isAdminValidOtp = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    // Get user
    const admin = await adminModel.findById(req.user);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    // If already verified
    if (admin.isVerified) {
      return res.status(200).json({ message: "Already verified!" });
    }

    // OTP should exist
    if (!admin.verificationCode) {
      return res.status(400).json({
        message: "Please request a new OTP.",
      });
    }

    // Match OTP
    if (parseInt(code) !== admin.verificationCode) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    // Check OTP expiration (2 minutes)
    const OTP_VALIDITY_MINUTES = 2;
    const minutesPassed =
      (Date.now() - new Date(admin.verificationCodeTime).getTime()) / 1000 / 60;

    if (minutesPassed > OTP_VALIDITY_MINUTES) {
      return res.status(410).json({
        message: "OTP expired!",
      });
    }

    req.admin = admin;
    next();

  } catch (err) {
    console.error("Admin OTP Validation Error:", err);
    res.status(500).json({ message: "Server error validating OTP." });
  }
};

export default isAdminValidOtp;
