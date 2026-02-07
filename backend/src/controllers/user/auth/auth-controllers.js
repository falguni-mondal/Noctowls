import userModel from "../../../models/user-model.js";
import { generateOTP } from "../../../utils/otp-generator.js";
import { sendEmail } from "../../../configs/nodemailer.js";
import tokenizer from "../../../utils/tokenizer.js";
import cookieOptions from "../../../utils/cookie-options.js";
import userDataTrimmer from "../../../utils/helpers/user-data-trimmer.js";
import sessionModel from "../../../models/session-model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // 

const checkAuth = async (req, res) => {
  try {
    const userId = req.user;

    if (!userId) {
      return res.status(200).json(null);
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(200).json(null);
    }

    return res.status(200).json(userDataTrimmer(user));
  } catch (err) {
    console.error("checkAuth Error:", err);
    return res.status(500).json({ message: "Server error checking auth." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({ email });
    }

    // CHECK 1: Is the user currently locked out?
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil(
        (user.lockoutUntil - new Date()) / 1000 / 60
      );
      return res.status(429).json({
        message: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`,
      });
    }

    // ============================================================
    // REQUIREMENT 1 & 2: Single Session & Verification Reset
    // ============================================================
    
    // A. Reset verification status (User must verify OTP again)
    user.isVerified = false;
    
    // B. Delete ALL existing sessions for this user (Force Single Session)
    await sessionModel.deleteMany({ user: user._id });

    // C. Create NEW Session (Explicit Logic)
    const deviceId = req.cookies.device_id || crypto.randomUUID();
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days expiry

    const newSession = await sessionModel.create({
      user: user._id,
      role: user.role,
      expiry_at: expiryDate,
      device_id: deviceId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    // ============================================================

    let nextResendAt;
    const previousTime = user.verificationCodeTime;

    // OTP LOGIC (Sending Code)
    if (previousTime) {
      const secondsPassed =
        (Date.now() - new Date(previousTime).getTime()) / 1000;

      if (secondsPassed < 60) {
        await user.save();
        nextResendAt = new Date(previousTime).getTime() + 60 * 1000;
      } else {
        const otp = generateOTP();
        user.verificationCode = otp;
        user.verificationCodeTime = new Date();
        await user.save();

        nextResendAt = Date.now() + 60 * 1000;

        const emailSent = await sendEmail({
          to: email,
          subject: "Your Verification Code",
          html: `
            <h2>Use this code to login to Noctowls</h2>
            <p style="font-size: 22px; font-weight: bold;">${otp}</p>
            <p>This code is valid for 2 minutes.</p>
          `,
        });

        if (!emailSent) {
          return res.status(500).json({ message: "Failed to send verification code." });
        }
      }
    } else {
      const otp = generateOTP();
      user.verificationCode = otp;
      user.verificationCodeTime = new Date();
      user.failedOtpAttempts = 0;
      user.lockoutUntil = null;
      await user.save();

      nextResendAt = Date.now() + 60 * 1000;

      const emailSent = await sendEmail({
        to: email,
        subject: "Your Verification Code",
        html: `
          <h2>Use this code to login to Noctowls</h2>
          <p style="font-size: 22px; font-weight: bold;">${otp}</p>
          <p>This code is valid for 2 minutes.</p>
        `,
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification code." });
      }
    }

    // Generate JWTs
    const accessToken = tokenizer.createAccessToken(user._id, user.role);
    
    // Manual Refresh Token Creation using the session we just created
    const refreshToken = jwt.sign(
        { 
            id: user._id, 
            role: user.role, 
            jti: newSession._id // Link token to the DB Session ID
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("device_id", deviceId, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: userDataTrimmer(user),
        nextResendAt,
      });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({
      message: "Failed to login!",
    });
  }
};

const otpSender = async (req, res) => {
  try {
    const user = req.currentUser;

    const otp = generateOTP();

    user.verificationCode = otp;
    user.verificationCodeTime = new Date();
    await user.save();

    const nextResendAt = Date.now() + 60 * 1000;

    const emailSent = await sendEmail({
      to: user.email,
      subject: "Your Verification Code",
      html: `
        <h2>Your New Verification Code</h2>
        <p style="font-size: 22px; font-weight: bold;">${otp}</p>
        <p>This code will expire in 2 minutes.</p>
      `,
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP." });
    }

    return res.status(200).json({
      message: "OTP sent successfully!",
      nextResendAt,
    });
  } catch (error) {
    console.error("OTP Sender Error:", error);
    res.status(500).json({ message: "Server error sending OTP." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const user = req.currentUser;

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeTime = null;

    await user.save();

    return res.status(200).json(userDataTrimmer(user));
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error verifying code" });
  }
};

const logoutUser = async (req, res) => {
  try {
    // REQUIREMENT 3: Reset Status & Delete ALL Sessions
    
    // Attempt to identify user from request or token
    let userId = req.user; 

    // If req.user is missing (e.g. middleware failed), try decoding token manually
    if (!userId && req.cookies.accessToken) {
        const decoded = jwt.decode(req.cookies.accessToken);
        if (decoded) userId = decoded.id;
    }

    if (userId) {
        // 1. Delete ALL sessions for this user
        await sessionModel.deleteMany({ user: userId });

        // 2. Reset Verification Status
        const user = await userModel.findById(userId);
        if (user) {
            user.isVerified = false;
            user.verificationCode = null;
            user.verificationCodeTime = null;
            await user.save();
        }
    }

    // Clear cookies regardless of DB success
    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .clearCookie("device_id", cookieOptions);

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Failed to logout." });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user;

    await sessionModel.deleteMany({ user: userId });

    await userModel.findByIdAndDelete(userId);

    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .clearCookie("device_id", cookieOptions);

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Account Delete Error:", error);
    return res.status(500).json({ message: "Failed to delete account." });
  }
};

export {
  loginUser,
  otpSender,
  verifyOtp,
  logoutUser,
  deleteAccount,
  checkAuth,
};