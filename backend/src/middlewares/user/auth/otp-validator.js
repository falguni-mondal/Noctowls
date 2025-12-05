import userModel from "../../../models/user-model.js";

const isValidOtp = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    // Get user
    const user = await userModel.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // If already verified
    if (user.isVerified) {
      return res.status(200).json({ message: "Already verified!" });
    }

    // OTP should exist
    if (!user.verificationCode) {
      return res.status(400).json({
        message: "Please request a new OTP.",
      });
    }

    // Match OTP
    if (parseInt(code) !== user.verificationCode) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    // Check OTP expiration (2 minutes)
    const OTP_VALIDITY_MINUTES = 2;
    const minutesPassed =
      (Date.now() - new Date(user.verificationCodeTime).getTime()) / 1000 / 60;

    if (minutesPassed > OTP_VALIDITY_MINUTES) {
      return res.status(410).json({
        message: "OTP expired!",
      });
    }

    req.currentUser = user;
    next();

  } catch (err) {
    console.error("OTP Validation Error:", err);
    res.status(500).json({ message: "Server error validating OTP." });
  }
};

export default isValidOtp;
