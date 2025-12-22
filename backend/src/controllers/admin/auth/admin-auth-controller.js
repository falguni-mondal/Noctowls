import cookieOptions from "../../../utils/cookie-options.js";
import tokenizer from "../../../utils/tokenizer.js";
import {sendEmail} from "../../../configs/nodemailer.js";
import {generateOTP} from "../../../utils/otp-generator.js";
import adminDataTrimmer from "../../../utils/admin-data-trimmer.js";
import adminModel from "../../../models/admin-model.js";
import jwt from "jsonwebtoken";

const checkAdmin = async (req, res) => {
  try {
    const adminId = req.user;

    if (!adminId) {
      return res.status(200).json(null);
    }

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res.status(200).json(null);
    }

    return res.status(200).json(adminDataTrimmer(admin));
  } catch (err) {
    console.error("checkAuth Error:", err);
    return res.status(500).json({ message: "Server error checking auth." });
  }
};

const adminLogin = async (req, res) => {
  try {
    let admin = req.admin;

    let nextResendAt;
    const previousTime = admin.verificationCodeTime;

    // If OTP already sent before
    if (previousTime) {
      const secondsPassed =
        (Date.now() - new Date(previousTime).getTime()) / 1000;

      if (secondsPassed < 60) {
        nextResendAt = new Date(previousTime).getTime() + 60 * 1000;
      } else {
        // Generate new OTP
        const otp = generateOTP();

        admin.verificationCode = otp;
        admin.verificationCodeTime = new Date();
        await admin.save();

        nextResendAt = Date.now() + 60 * 1000;

        const emailSent = await sendEmail({
          to: process.env.ADMIN_MAIL, // <-- fixed
          subject: "Admin OTP Verification Code",
          html: `
            <h2>Admin Login Verification</h2>
            <p style="font-size: 22px; font-weight: bold;">${otp}</p>
            <p>This OTP is valid for 2 minutes.</p>
          `,
        });

        if (!emailSent) {
          return res
            .status(500)
            .json({ message: "Failed to send verification code." });
        }
      }
    } else {
      // First-time OTP send
      const otp = generateOTP();

      admin.verificationCode = otp;
      admin.verificationCodeTime = new Date();
      await admin.save();

      nextResendAt = Date.now() + 60 * 1000;

      const emailSent = await sendEmail({
        to: process.env.ADMIN_MAIL, // <-- send to fixed admin email
        subject: "Admin OTP Verification Code",
        html: `
          <h2>Admin Login Verification</h2>
          <p style="font-size: 22px; font-weight: bold;">${otp}</p>
          <p>This OTP is valid for 2 minutes.</p>
        `,
      });

      if (!emailSent) {
        return res
          .status(500)
          .json({ message: "Failed to send verification code." });
      }
    }

    // Generate tokens after password login
    const accessToken = tokenizer.createAccessToken(admin._id, admin.role);

    const refreshToken = await tokenizer.createRefreshToken(
      admin._id,
      req,
      admin.role
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
        admin: adminDataTrimmer(admin),
        nextResendAt,
      });
  } catch (err) {
    console.error("Admin login error:", err.message);
    return res.status(400).json({ message: "Failed to login admin!" });
  }
};

const adminOtpSender = async (req, res) => {
  try {
    const admin = req.admin;

    const otp = generateOTP();

    admin.verificationCode = otp;
    admin.verificationCodeTime = new Date();
    await admin.save();

    const nextResendAt = Date.now() + 60 * 1000;

    const emailSent = await sendEmail({
      to: process.env.ADMIN_MAIL,
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
    console.error("Admin OTP Sender Error:", error);
    res.status(500).json({ message: "Server error sending OTP." });
  }
};

const adminOtpVerifier = async (req, res) => {
  try {
    const admin = req.admin;

    admin.isVerified = true;
    admin.verificationCode = null;
    admin.verificationCodeTime = null;

    await admin.save();

    return res.status(200).json(adminDataTrimmer(admin));
  } catch (err) {
    console.error("Admin Verify OTP Error:", err);
    res.status(500).json({ message: "Server error verifying code" });
  }
};

const adminLogout = async (req, res) => {
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
        console.warn("Admin Logout: invalid refresh token");
      }
    }

    const admin = await adminModel.findById(req.user);
    admin.isVerified = false;
    admin.verificationCode = null;
    admin.verificationCodeTime = null;
    await admin.save();

    // Clear cookies
    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)

    return res.status(200).json({ message: "Logged out!." });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    return res.status(500).json({ message: "Failed to logout." });
  }
};

export{
  checkAdmin,
  adminLogin,
  adminOtpSender,
  adminOtpVerifier,
  adminLogout
}