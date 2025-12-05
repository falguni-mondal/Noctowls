import adminModel from "../../../models/admin-model.js";

const canAdminSendOtp = async (req, res, next) => {
  try {
    const admin = await adminModel.findById(req.user);

    // Admin must exist before sending OTP
    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    // If already verified, no need to resend OTP
    if (admin.isVerified) {
      return res.status(200).json({ message: "Already verified!" });
    }

    // Check previous OTP send time
    if (admin.verificationCodeTime) {
      const secondsPassed =
        (Date.now() - new Date(admin.verificationCodeTime).getTime()) / 1000;

      if (secondsPassed < 60) {
        const wait = Math.ceil(60 - secondsPassed);
        return res.status(429).json({
          message: `Please wait ${wait} seconds before requesting a new OTP.`,
          remaining: Math.ceil(60 - secondsPassed),
        });
      }
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("canAdminSendOtp Error:", error);
    res.status(500).json({ message: "Server error validating OTP resend." });
  }
};

export default canAdminSendOtp;
