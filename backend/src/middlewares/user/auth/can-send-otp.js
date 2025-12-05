import userModel from "../../../models/user-model.js";

const canSendOtp = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user);

    // User must exist before sending OTP
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // If already verified, no need to resend OTP
    if (user.isVerified) {
      return res.status(200).json({ message: "User is already verified!" });
    }

    // Check previous OTP send time
    if (user.verificationCodeTime) {
      const secondsPassed =
        (Date.now() - new Date(user.verificationCodeTime).getTime()) / 1000;

      if (secondsPassed < 60) {
        const wait = Math.ceil(60 - secondsPassed);
        return res.status(429).json({
          message: `Please wait ${wait} seconds before requesting a new OTP.`,
          remaining: Math.ceil(60 - secondsPassed),
        });
      }
    }

    req.currentUser = user;
    next();

  } catch (error) {
    console.error("canSendOtp Error:", error);
    res.status(500).json({ message: "Server error validating OTP resend." });
  }
};

export default canSendOtp;
