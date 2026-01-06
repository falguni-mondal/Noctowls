import userModel from "../../../models/user-model.js";

const isValidOtp = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    const user = await userModel.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // CHECK 1: Is user locked out?
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
       const waitMinutes = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
       return res.status(429).json({ 
         message: `Account locked due to too many failed attempts. Try again in ${waitMinutes} minutes.` 
       });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Already verified!" });
    }

    if (!user.verificationCode) {
      return res.status(400).json({
        message: "Please request a new OTP.",
      });
    }

    // CHECK 2: Validate OTP
    if (parseInt(code) !== user.verificationCode) {
      // Increment failed attempts
      user.failedOtpAttempts = (user.failedOtpAttempts || 0) + 1;
      
      // Lock account if attempts > 5
      if (user.failedOtpAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lock
        user.failedOtpAttempts = 0; // Reset counter so they have fresh attempts after lockout
        user.verificationCode = null; // Invalidate the current OTP
        await user.save();
        
        return res.status(429).json({
          message: "Too many failed attempts. Account locked for 15 minutes."
        });
      }

      await user.save();
      const remainingAttempts = 5 - user.failedOtpAttempts;
      
      return res.status(400).json({ 
        message: `Invalid OTP! ${remainingAttempts} attempts remaining.` 
      });
    }

    // Check Expiration
    const OTP_VALIDITY_MINUTES = 2;
    const minutesPassed =
      (Date.now() - new Date(user.verificationCodeTime).getTime()) / 1000 / 60;

    if (minutesPassed > OTP_VALIDITY_MINUTES) {
      return res.status(410).json({
        message: "OTP expired!",
      });
    }

    // SUCCESS: Reset all security counters
    user.failedOtpAttempts = 0;
    user.lockoutUntil = null;
    // Note: We don't save here because the controller (verifyOtp) or next middleware will handle the 'isVerified=true' save
    // But to be safe ensuring the counter resets persist immediately:
    await user.save();

    req.currentUser = user;
    next();

  } catch (err) {
    console.error("OTP Validation Error:", err);
    res.status(500).json({ message: "Server error validating OTP." });
  }
};

export default isValidOtp;