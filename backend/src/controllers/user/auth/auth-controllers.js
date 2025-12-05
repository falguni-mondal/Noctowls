import userModel from "../../../models/user-model.js";
import { generateOTP } from "../../../utils/otp-generator.js";
import { sendEmail } from "../../../configs/nodemailer.js";
import tokenizer from "../../../utils/tokenizer.js";
import cookieOptions from "../../../utils/cookie-options.js";
import userDataTrimmer from "../../../utils/user-data-trimmer.js";
import sessionModel from "../../../models/session-model.js";
import jwt from "jsonwebtoken";

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

    let nextResendAt;

    const previousTime = user.verificationCodeTime;

    // CASE: OTP ALREADY SENT BEFORE
    if (previousTime) {
      const secondsPassed = (Date.now() - new Date(previousTime).getTime()) / 1000;
      if (secondsPassed < 60) {
        nextResendAt = new Date(previousTime).getTime() + 60 * 1000;
      } else {
        const otp = generateOTP();

        user.verificationCode = otp;
        user.verificationCodeTime = new Date();
        await user.save();

        nextResendAt = Date.now() + 60 * 1000;

        // Send OTP email
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
          return res
            .status(500)
            .json({ message: "Failed to send verification code." });
        }
      }
    } else {
      // First time login: generate OTP
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
        return res
          .status(500)
          .json({ message: "Failed to send verification code." });
      }
    }

    // Generate tokens (login is always allowed)
    const accessToken = tokenizer.createAccessToken(user._id, user.role);
    const refreshToken = await tokenizer.createRefreshToken(
      user._id,
      req,
      user.role
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken?.token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("device_id", refreshToken?.device_id, {
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
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        await sessionModel.findByIdAndDelete(payload.jti);
      } catch (err) {
        console.warn("User Logout: invalid refresh token");
        console.warn(err.message);
      }
    }

    const user = await userModel.findById(req.user);
    user.isVerified = false;
    user.verificationCode = null;
    user.verificationCodeTime = null;
    await user.save();

    // Clear cookies
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
