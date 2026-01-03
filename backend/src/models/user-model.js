import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      },
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
    role: {
      type: String,
      default: "user",
    },
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function(v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: 'Phone must be 10 digits'
      }
    },
    address: {
      type: String,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
  },
  { timestamps: true }
);

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ wishlist: 1 });

// Virtuals for admin check
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Methods for OTP validation
userSchema.methods.isOTPValid = function() {
  if (!this.verificationCode || !this.verificationCodeTime) {
    return false;
  }
  
  const expiryTime = 10 * 60 * 1000; // 10 minutes
  const now = Date.now();
  const codeTime = this.verificationCodeTime.getTime();
  
  return (now - codeTime) < expiryTime;
};

userSchema.methods.clearOTP = async function() {
  this.verificationCode = null;
  this.verificationCodeTime = null;
  return this.save();
};

// Check permissions
userSchema.methods.canUseCart = function() {
  return this.role !== 'admin';
};

userSchema.methods.canUseWishlist = function() {
  return this.role !== 'admin';
};

export default mongoose.model("user", userSchema);
