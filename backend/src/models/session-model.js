import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    role: {
      type: String,
      required: true,
      default: "user"
    },
    expiry_at: {
      type: Date,
      required: true,
    },
    ip_address: {
      type: String,
      required: true,
    },
    device_id: {
      type: String,
      required: true,
    },
    user_agent: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: "issued_at", updatedAt: true } }
);

export default mongoose.model("session", sessionSchema);
