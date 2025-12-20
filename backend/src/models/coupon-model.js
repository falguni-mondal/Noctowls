import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    description: {
      type: String,
      default: "Get discount on your purchase",
      maxlength: 200,
    },

    discountPerItem: {
      type: Number,
      required: true,
      default: 50, // ₹50 per item (quantity)
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null, // null means no expiry
    },

    usageLimit: {
      type: Number,
      default: null, // null means unlimited usage
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Minimum purchase requirements (optional)
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    minItemsRequired: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Applicable categories (optional - empty array means all categories)
    applicableCategories: {
      type: [String],
      default: [],
    },

    // Admin who created this coupon
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });
couponSchema.index({ createdAt: -1 });

// ---------- Virtual: Is Expired ----------
couponSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// ---------- Virtual: Is Usage Limit Reached ----------
couponSchema.virtual("isUsageLimitReached").get(function () {
  if (!this.usageLimit) return false;
  return this.usedCount >= this.usageLimit;
});

// ---------- Virtual: Remaining Uses ----------
couponSchema.virtual("remainingUses").get(function () {
  if (!this.usageLimit) return null; // Unlimited
  return Math.max(0, this.usageLimit - this.usedCount);
});

// ---------- Instance Methods ----------

// Validate coupon
couponSchema.methods.validate = function () {
  if (!this.isActive) {
    throw new Error("This coupon is not active");
  }

  if (this.expiresAt && new Date() > this.expiresAt) {
    throw new Error("This coupon has expired");
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    throw new Error("This coupon has reached its usage limit");
  }

  return true;
};

// Validate against cart
couponSchema.methods.validateForCart = function (cart) {
  // Basic validation
  this.validate();

  // Check minimum purchase amount
  if (this.minPurchaseAmount > 0 && cart.summary.subtotal < this.minPurchaseAmount) {
    throw new Error(
      `Minimum purchase of ₹${this.minPurchaseAmount} required to use this coupon`
    );
  }

  // Check minimum items required
  if (this.minItemsRequired > 0 && cart.summary.totalQuantity < this.minItemsRequired) {
    throw new Error(
      `Minimum ${this.minItemsRequired} items required to use this coupon`
    );
  }

  // Check category restrictions
  if (this.applicableCategories.length > 0) {
    const hasApplicableItem = cart.items.some(
      (item) =>
        !item.isFreeGift &&
        this.applicableCategories.includes(item.category)
    );

    if (!hasApplicableItem) {
      throw new Error(
        `This coupon is only applicable for: ${this.applicableCategories.join(", ")}`
      );
    }
  }

  return true;
};

// Increment usage count
couponSchema.methods.incrementUsage = async function () {
  this.usedCount += 1;
  return this.save();
};

// Decrement usage count (for cancellations)
couponSchema.methods.decrementUsage = async function () {
  if (this.usedCount > 0) {
    this.usedCount -= 1;
    return this.save();
  }
  return this;
};

// Deactivate coupon
couponSchema.methods.deactivate = async function () {
  this.isActive = false;
  return this.save();
};

// Activate coupon
couponSchema.methods.activate = async function () {
  this.isActive = true;
  return this.save();
};

// ---------- Static Methods ----------

// Find valid coupon by code
couponSchema.statics.findValidCoupon = async function (code) {
  const coupon = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  if (!coupon) {
    return null;
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return null;
  }

  return coupon;
};

// Find active coupons
couponSchema.statics.findActiveCoupons = async function () {
  return this.find({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).sort({ createdAt: -1 });
};

// Find expired coupons (for cleanup)
couponSchema.statics.findExpiredCoupons = async function () {
  return this.find({
    expiresAt: { $ne: null, $lt: new Date() },
  });
};

// Find coupons reaching usage limit
couponSchema.statics.findCouponsReachingLimit = async function (threshold = 0.9) {
  return this.find({
    usageLimit: { $ne: null },
    $expr: {
      $gte: ["$usedCount", { $multiply: ["$usageLimit", threshold] }],
    },
  });
};

// Get coupon statistics
couponSchema.statics.getCouponStats = async function (couponId) {
  const coupon = await this.findById(couponId);
  
  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const usagePercentage = coupon.usageLimit
    ? (coupon.usedCount / coupon.usageLimit) * 100
    : null;

  return {
    code: coupon.code,
    totalUses: coupon.usedCount,
    remainingUses: coupon.remainingUses,
    usagePercentage,
    isActive: coupon.isActive,
    isExpired: coupon.isExpired,
    daysUntilExpiry: coupon.expiresAt
      ? Math.ceil((coupon.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };
};

// Cleanup expired coupons (run as cron job)
couponSchema.statics.cleanupExpiredCoupons = async function () {
  const result = await this.updateMany(
    {
      isActive: true,
      expiresAt: { $ne: null, $lt: new Date() },
    },
    {
      $set: { isActive: false },
    }
  );

  return {
    deactivated: result.modifiedCount,
  };
};

// ---------- Pre-save Middleware ----------
couponSchema.pre("save", function () {
  // Auto-uppercase code
  if (this.isModified("code")) {
    this.code = this.code.toUpperCase().trim();
  }

  // Auto-deactivate if expired
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isActive = false;
  }

  // Auto-deactivate if usage limit reached
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    this.isActive = false;
  }
});

export default mongoose.model("coupon", couponSchema);