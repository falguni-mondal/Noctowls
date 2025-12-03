import userModel from "../models/user-model.js";
import { generateOTP } from "../../utils/otp-generator.js";
import { sendEmail } from "../utils/email.js";
import tokenizer from "../utils/tokenizer.js";

const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({ email });
    }

    if (user.verificationCodeTime) {
      const secondsPassed = (Date.now() - new Date(user.verificationCodeTime).getTime()) / 1000;

      if (secondsPassed < 30) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(30 - secondsPassed)} seconds before requesting a new code.`,
        });
      }
    }

    const otp = generateOTP();

    // Save OTP + time in DB
    user.verificationCode = otp;
    user.verificationCodeTime = new Date();
    await user.save();

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

    // Create tokens
    const accessToken = tokenizer.createAccessToken(user._id, user.role);

    const refreshToken = await tokenizer.createRefreshToken(user._id, req, user.role);

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
      .json(userDataTrimmer(user));

  } catch (err) {
    console.error(err.message);
    res.status(400).json({
      message: "Failed to send verification code!",
    });
  }
};

export { loginUser };
