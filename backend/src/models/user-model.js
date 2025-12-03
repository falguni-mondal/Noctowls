import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    address: {
      type: String,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cart",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("user", userSchema);
