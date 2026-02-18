import jwt from "jsonwebtoken";
import tokenizer from "../../../utils/tokenizer.js";
import sessionModel from "../../../models/session-model.js";
import cookieOptions from "../../../utils/cookie-options.js";
import { randomUUID } from "crypto";

const accessSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

// [!code ++] Helper to handle Optional Auth Failures (Fallback to Guest)
const handleOptionalFallback = (req, res, next) => {
  // Clear the invalid auth cookies so the browser stops sending them
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  
  // Set user to null so the controller knows to use 'deviceId'
  req.user = null; 
  return next();
};

// [!code change] Added 'isOptional' parameter
const refreshTokenSetup = async (req, res, next, refreshToken, isOptional = false) => {
  if (!refreshToken) {
    // [!code ++] Fallback if optional
    if (isOptional) return handleOptionalFallback(req, res, next);
    return res.status(401).json({
      message: "Session Expired!",
    });
  }
  try {
    //finding REFRESH TOKEN in DB
    const refreshTokenData = jwt.verify(refreshToken, refreshSecret);
    const refreshSession = await sessionModel.findById(refreshTokenData.jti);

    // checking for Invalid SESSION in DB
    if (!refreshSession || refreshSession?.expiry_at <= new Date()) {
      // [!code ++] Fallback if optional
      if (isOptional) return handleOptionalFallback(req, res, next);

      return res.status(401).json({
        message: "Session Expired!",
      });
    }

    //matching DEVICE ID
    const reqDeviceId = req.cookies.device_id;

    if (!reqDeviceId || reqDeviceId !== refreshSession.device_id) {
      console.warn({
        event: "suspicious_token_use",
        expectedDevice: refreshSession.device_id,
        gotDevice: reqDeviceId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        userId: refreshSession.user,
        timestamp: new Date().toISOString(),
      });
      await sessionModel.updateMany(
        { user: refreshSession.user },
        { expiry_at: new Date() }
      );

      res
        .clearCookie("accessToken", {
          ...cookieOptions,
        })
        .clearCookie("refreshToken", {
          ...cookieOptions,
        })
        .clearCookie("device_id");

      // [!code ++] Fallback if optional
      if (isOptional) { req.user = null; return next(); }

      return res.status(401).json({
        message: "Session Expired!",
      });
    }

    //matching DEVICE IP ADDRESS
    if (req.ip !== refreshSession.ip_address) {
      console.warn({
        event: "suspicious_token_use",
        device_id: reqDeviceId,
        expectedIp: refreshSession.ip_address,
        gotIp: req.ip,
        userAgent: req.headers["user-agent"],
        userId: refreshSession.user,
        timestamp: new Date().toISOString(),
      });
      await sessionModel.updateMany(
        { user: refreshSession.user },
        { expiry_at: new Date() }
      );

      res
        .clearCookie("accessToken", {
          ...cookieOptions,
        })
        .clearCookie("refreshToken", {
          ...cookieOptions,
        })
        .clearCookie("device_id");

      // [!code ++] Fallback if optional
      if (isOptional) { req.user = null; return next(); }

      return res.status(401).json({
        message: "Session Expired!",
      });
    }

    //matching USER ROLE
    if (refreshTokenData.role !== refreshSession.role) {
      console.warn({
        event: "suspicious_token_use",
        device_id: reqDeviceId,
        expectedIp: refreshSession.ip_address,
        gotIp: req.ip,
        userAgent: req.headers["user-agent"],
        userId: refreshSession.user,
        timestamp: new Date().toISOString(),
      });
      await sessionModel.updateMany(
        { user: refreshSession.user },
        { expiry_at: new Date() }
      );

      res
        .clearCookie("accessToken", {
          ...cookieOptions,
        })
        .clearCookie("refreshToken", {
          ...cookieOptions,
        })
        .clearCookie("device_id");

      // [!code ++] Fallback if optional
      if (isOptional) { req.user = null; return next(); }

      return res.status(401).json({
        message: "Session Expired!",
      });
    }

    // Store old session data BEFORE deleting it
    const oldUser = refreshSession.user;
    const oldRole = refreshSession.role;
    const oldExpiry = refreshSession.expiry_at;
    const oldDeviceId = refreshSession.device_id;

    // Delete old session first
    await sessionModel.findByIdAndDelete(refreshTokenData.jti);

    // Create fresh session
    const newSession = await sessionModel.create({
      user: oldUser,
      role: oldRole,
      expiry_at: oldExpiry,
      device_id: oldDeviceId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    const newRefreshToken = jwt.sign(
      {
        sub: newSession.user,
        jti: newSession._id.toString(),
        role: oldRole,
      },
      refreshSecret,
      {
        expiresIn: Math.floor((oldExpiry.getTime() - Date.now()) / 1000),
      }
    );

    const newAccessToken = tokenizer.createAccessToken(
      newSession.user,
      newSession.role
    );

    // Setting up fresh Cookies
    res
      .cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: oldExpiry.getTime() - Date.now(),
      })
      .cookie("device_id", newSession?.device_id, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days in milliseconds
      });

    req.user = newSession?.user.toString();
    next();
  } catch (refreshTokenErr) {
    console.error(refreshTokenErr.message);
    
    // [!code ++] Fallback if optional (Catch block)
    if (isOptional) return handleOptionalFallback(req, res, next);

    return res.status(401).json({
      message: "Session Expired!",
    });
  }
};

const isValidUser = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
    // Strict auth: default isOptional=false
    return await refreshTokenSetup(req, res, next, refreshToken);
  } else {
    try {
      const accessTokenData = jwt.verify(accessToken, accessSecret);
      req.user = accessTokenData.sub;
      return next();
    } catch (accessTokenErr) {
      console.error(
        "User Validation Error (auth mid): ",
        accessTokenErr.message
      );
      return await refreshTokenSetup(req, res, next, refreshToken);
    }
  }
};

export const optionalAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  const reqDeviceId = req.cookies.device_id;
  

  // If no tokens at all, continue as guest
  if (!accessToken && !refreshToken) {
    req.user = null;
    if(!reqDeviceId){
      const deviceId = randomUUID();
      res.cookie("device_id", deviceId, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      req.cookies.device_id = deviceId;
    }
    return next();
  }

  // If access token exists, try to verify it
  if (!accessToken) {
    // [!code change] Pass 'true' for isOptional
    return await refreshTokenSetup(req, res, next, refreshToken, true);
  } else {
    try {
      const accessTokenData = jwt.verify(accessToken, accessSecret);
      req.user = accessTokenData.sub;
      return next();
    } catch (accessTokenErr) {
      console.error(
        "User Validation Error (auth mid): ",
        accessTokenErr.message
      );
      // [!code change] Pass 'true' for isOptional
      return await refreshTokenSetup(req, res, next, refreshToken, true);
    }
  }
};

export default isValidUser;