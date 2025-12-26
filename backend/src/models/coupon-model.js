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

    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
      default: 'fixed',
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    applyType: {
      type: String,
      enum: ['each-product', 'each-order'],
      required: true,
      default: 'each-product',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startsAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    usageLimitType: {
      type: String,
      enum: ['once-per-user', 'multiple-per-user', 'max-total'],
      required: true,
      default: 'once-per-user',
    },

    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxTotalUsage: {
      type: Number,
      default: null,
      min: 1,
    },

    totalUsedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Separate tracking for users and guests
    userUsageHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          default: null,
        },
        deviceId: {
          type: String,
          default: null,
        },
        usageCount: {
          type: Number,
          default: 1,
          min: 1,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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

    applicableCategories: {
      type: [String],
      default: [],
    },

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
couponSchema.index({ "userUsageHistory.user": 1 });
couponSchema.index({ "userUsageHistory.deviceId": 1 });
couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

// ---------- Validation ----------
// Ensure each entry has EITHER user OR deviceId (not both, not neither)
couponSchema.path('userUsageHistory').validate(function(entries) {
  return entries.every(entry => {
    const hasUser = !!entry.user;
    const hasDevice = !!entry.deviceId;
    // Must have exactly one (XOR)
    return hasUser !== hasDevice;
  });
}, 'Each usage entry must have either user OR deviceId, not both or neither');

// ---------- Virtual: Is Expired ----------
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiresAt || new Date() < this.startsAt;
});

// ---------- Virtual: Is Total Usage Limit Reached ----------
couponSchema.virtual("isTotalUsageLimitReached").get(function () {
  if (this.usageLimitType !== 'max-total') return false;
  if (!this.maxTotalUsage) return false;
  return this.totalUsedCount >= this.maxTotalUsage;
});

// ---------- Virtual: Remaining Total Uses ----------
couponSchema.virtual("remainingTotalUses").get(function () {
  if (this.usageLimitType !== 'max-total') return null;
  if (!this.maxTotalUsage) return null;
  return Math.max(0, this.maxTotalUsage - this.totalUsedCount);
});

// ---------- Instance Methods ----------

// Basic validation (without user context)
couponSchema.methods.validateBasic = function () {
  if (!this.isActive) {
    throw new Error("This coupon is not active");
  }

  const now = new Date();
  if (now < this.startsAt) {
    throw new Error("This coupon is not yet valid");
  }

  if (now > this.expiresAt) {
    throw new Error("This coupon has expired");
  }

  if (this.usageLimitType === 'max-total' && this.maxTotalUsage) {
    if (this.totalUsedCount >= this.maxTotalUsage) {
      throw new Error("This coupon has reached its maximum usage limit");
    }
  }

  return true;
};

// Validate for user OR guest (exactly one required)
couponSchema.methods.validateForUser = function (userId, deviceId = null) {
  // Basic validation first
  this.validateBasic();

  // Must have exactly one identifier
  if (!userId && !deviceId) {
    throw new Error("User authentication or device identification required");
  }

  if (userId && deviceId) {
    throw new Error("Cannot use both userId and deviceId - use only one");
  }

  // Find usage entry based on identifier type
  let usageEntry;
  
  if (userId) {
    // Logged-in user - find by userId only
    usageEntry = this.userUsageHistory.find(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    );
  } else {
    // Guest - find by deviceId only
    usageEntry = this.userUsageHistory.find(
      (entry) => entry.deviceId === deviceId
    );
  }

  // Check usage limits
  if (this.usageLimitType === 'once-per-user') {
    if (usageEntry) {
      throw new Error("You have already used this coupon");
    }
  } else if (this.usageLimitType === 'multiple-per-user') {
    if (usageEntry && usageEntry.usageCount >= this.perUserLimit) {
      throw new Error(
        `You have reached the maximum usage limit (${this.perUserLimit} times) for this coupon`
      );
    }
  }

  return true;
};

// Validate against cart
couponSchema.methods.validateForCart = function (cart, userId = null, deviceId = null) {
  // Basic validation
  this.validateBasic();

  // User-specific validation
  this.validateForUser(userId, deviceId);

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

// Increment usage (separate tracking)
couponSchema.methods.incrementUsageForUser = async function (userId, deviceId = null) {
  // Must have exactly one identifier
  if (!userId && !deviceId) {
    throw new Error("User ID or device ID required to track coupon usage");
  }

  if (userId && deviceId) {
    throw new Error("Cannot use both userId and deviceId - use only one");
  }

  // Increment total usage count
  this.totalUsedCount += 1;

  // Find existing usage entry
  let usageIndex = -1;

  if (userId) {
    // Find user entry
    usageIndex = this.userUsageHistory.findIndex(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    );
  } else {
    // Find guest entry
    usageIndex = this.userUsageHistory.findIndex(
      (entry) => entry.deviceId === deviceId
    );
  }

  if (usageIndex > -1) {
    // Update existing entry
    this.userUsageHistory[usageIndex].usageCount += 1;
    this.userUsageHistory[usageIndex].lastUsedAt = new Date();
  } else {
    // Create new entry (ONLY one field will be set)
    this.userUsageHistory.push({
      user: userId || null,
      deviceId: deviceId || null,
      usageCount: 1,
      lastUsedAt: new Date(),
    });
  }

  return this.save();
};

// Decrement usage (for order cancellations)
couponSchema.methods.decrementUsageForUser = async function (userId, deviceId = null) {
  // Must have exactly one identifier
  if (!userId && !deviceId) {
    throw new Error("User ID or device ID required to track coupon usage");
  }

  if (userId && deviceId) {
    throw new Error("Cannot use both userId and deviceId - use only one");
  }

  // Decrement total usage count
  if (this.totalUsedCount > 0) {
    this.totalUsedCount -= 1;
  }

  // Find usage entry
  let usageIndex = -1;

  if (userId) {
    usageIndex = this.userUsageHistory.findIndex(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    );
  } else {
    usageIndex = this.userUsageHistory.findIndex(
      (entry) => entry.deviceId === deviceId
    );
  }

  if (usageIndex > -1) {
    if (this.userUsageHistory[usageIndex].usageCount > 1) {
      this.userUsageHistory[usageIndex].usageCount -= 1;
    } else {
      // Remove entry if count becomes 0
      this.userUsageHistory.splice(usageIndex, 1);
    }
  }

  return this.save();
};

// Get remaining uses
couponSchema.methods.getUserRemainingUses = function (userId, deviceId = null) {
  if (!userId && !deviceId) return null;

  // Find usage entry
  let usageEntry;
  
  if (userId) {
    usageEntry = this.userUsageHistory.find(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    );
  } else {
    usageEntry = this.userUsageHistory.find(
      (entry) => entry.deviceId === deviceId
    );
  }

  if (this.usageLimitType === 'once-per-user') {
    return usageEntry ? 0 : 1;
  } else if (this.usageLimitType === 'multiple-per-user') {
    const usedCount = usageEntry ? usageEntry.usageCount : 0;
    return Math.max(0, this.perUserLimit - usedCount);
  } else {
    // max-total: return total remaining
    return this.remainingTotalUses;
  }
};

// Deactivate coupon
couponSchema.methods.deactivate = async function () {
  this._manualStatusChange = true;
  this.isActive = false;
  return this.save();
};

// Activate coupon
couponSchema.methods.activate = async function () {
  const now = new Date();
  
  if (this.expiresAt && now > this.expiresAt) {
    throw new Error("Cannot activate an expired coupon. Please update the expiry date first.");
  }
  
  if (this.usageLimitType === 'max-total' && this.maxTotalUsage) {
    if (this.totalUsedCount >= this.maxTotalUsage) {
      throw new Error("Cannot activate a coupon that has reached its usage limit. Please increase the usage limit first.");
    }
  }
  
  this._manualStatusChange = true;
  this.isActive = true;
  return this.save();
};

// ---------- Static Methods ----------

// Find valid coupon by code
couponSchema.statics.findValidCoupon = async function (code) {
  const now = new Date();
  
  const coupon = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  });

  if (!coupon) {
    return null;
  }

  if (coupon.usageLimitType === 'max-total' && coupon.maxTotalUsage) {
    if (coupon.totalUsedCount >= coupon.maxTotalUsage) {
      return null;
    }
  }

  return coupon;
};

// Find valid coupon for user OR guest
couponSchema.statics.findValidCouponForUser = async function (code, userId = null, deviceId = null) {
  const coupon = await this.findValidCoupon(code);
  
  if (!coupon) {
    return null;
  }

  try {
    coupon.validateForUser(userId, deviceId);
    return coupon;
  } catch (error) {
    return null;
  }
};

// Get coupon statistics with guest/user breakdown
couponSchema.statics.getCouponStats = async function (couponId) {
  const coupon = await this.findById(couponId);
  
  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const now = new Date();
  
  // Separate user and guest statistics
  const userEntries = coupon.userUsageHistory.filter(entry => entry.user);
  const guestEntries = coupon.userUsageHistory.filter(entry => entry.deviceId);
  
  const totalUsers = userEntries.length;
  const totalGuests = guestEntries.length;
  
  const userUsageCount = userEntries.reduce((sum, entry) => sum + entry.usageCount, 0);
  const guestUsageCount = guestEntries.reduce((sum, entry) => sum + entry.usageCount, 0);
  
  let usagePercentage = null;
  if (coupon.usageLimitType === 'max-total' && coupon.maxTotalUsage) {
    usagePercentage = (coupon.totalUsedCount / coupon.maxTotalUsage) * 100;
  }

  return {
    code: coupon.code,
    usageLimitType: coupon.usageLimitType,
    totalUses: coupon.totalUsedCount,
    
    // Breakdown
    users: {
      count: totalUsers,
      totalUsage: userUsageCount,
    },
    guests: {
      count: totalGuests,
      totalUsage: guestUsageCount,
    },
    
    remainingUses: coupon.remainingTotalUses,
    usagePercentage,
    isActive: coupon.isActive,
    isExpired: coupon.isExpired,
    daysUntilExpiry: Math.ceil((coupon.expiresAt - now) / (1000 * 60 * 60 * 24)),
    daysUntilStart: coupon.startsAt > now 
      ? Math.ceil((coupon.startsAt - now) / (1000 * 60 * 60 * 24))
      : 0,
  };
};

// ---------- Pre-save Middleware ----------
couponSchema.pre("save", function () {
  if (this.isModified("code")) {
    this.code = this.code.toUpperCase().trim();
  }

  if (this._manualStatusChange) {
    delete this._manualStatusChange;
    return;
  }

  const now = new Date();

  if (this.expiresAt && now > this.expiresAt) {
    this.isActive = false;
  }

  if (this.usageLimitType === 'max-total' && this.maxTotalUsage) {
    if (this.totalUsedCount >= this.maxTotalUsage) {
      this.isActive = false;
    }
  }

  if (this.isModified('expiresAt') || this.isModified('startsAt')) {
    const wasExpired = this._wasExpired;
    
    if (wasExpired && this.expiresAt > now) {
      if (this.usageLimitType !== 'max-total' || !this.maxTotalUsage || this.totalUsedCount < this.maxTotalUsage) {
        this.isActive = true;
      }
    }
  }
});

couponSchema.pre("save", function () {
  if (this.isModified('expiresAt') || this.isModified('startsAt')) {
    const now = new Date();
    if (!this.isNew) {
      this._wasExpired = this.expiresAt && now > this.expiresAt;
    }
  }
});

// Find active coupons
couponSchema.statics.findActiveCoupons = async function () {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });
};

// Cleanup expired coupons
couponSchema.statics.cleanupExpiredCoupons = async function () {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      isActive: true,
      expiresAt: { $lte: now },
    },
    {
      $set: { isActive: false },
    }
  );

  return {
    deactivated: result.modifiedCount,
  };
};

export default mongoose.model("coupon", couponSchema);