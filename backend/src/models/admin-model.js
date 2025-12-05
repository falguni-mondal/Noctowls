import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCodeTime: {
      type: Date,
      default: null,
    },
    verificationCode: {
      type: Number,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("admin", adminSchema);
