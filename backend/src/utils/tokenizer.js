import jwt from "jsonwebtoken";
import sessionModel from "../models/session-model.js";
import { randomUUID } from "crypto";

const accessSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

const tokenizer = {
  createAccessToken: (id, role) => {
    return jwt.sign({ sub: id, role }, accessSecret, { expiresIn: "15m" });
  },
  createRefreshToken: async (id, req, role) => {
    const expMs = 7 * 24 * 60 * 60 * 1000;
    const expiryAt = new Date(Date.now() + expMs);
    const device_id = req.cookies.device_id || randomUUID();
    try {
      const session = await sessionModel.create({
        user: id,
        role,
        expiry_at: expiryAt,
        device_id: device_id,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
      const token = jwt.sign({ sub: id, jti: session._id.toString(), role }, refreshSecret, {expiresIn: expMs / 1000});
      return {token, device_id};
    } catch (err) {
      throw err;
    }
  },
};

export default tokenizer;
