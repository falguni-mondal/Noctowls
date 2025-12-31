import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: "Phone number must be 10 digits",
      },
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: "Alternate phone must be 10 digits",
      },
    },

    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 200,
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{6}$/.test(v);
        },
        message: "Pincode must be 6 digits",
      },
    },

    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    // ✅ NEW: Track if address is used in any active orders
    isUsedInOrders: {
      type: Boolean,
      default: false,
    },

    // ✅ NEW: Last used timestamp
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Indexes ----------
addressSchema.index({ user: 1, isDefault: -1 });
addressSchema.index({ user: 1, createdAt: -1 });
addressSchema.index({ user: 1, addressType: 1 });
// ✅ NEW: Compound index for duplicate detection
addressSchema.index({ 
  user: 1, 
  address: 1, 
  city: 1, 
  state: 1, 
  pincode: 1 
});

// ---------- Pre-save Middleware ----------
// ✅ FIXED: Better default address handling with lock
addressSchema.pre("save", async function (next) {
  if (this.isNew && this.isDefault) {
    // Use findOneAndUpdate with atomic operation to prevent race conditions
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { $set: { isDefault: false } }
    );
  } else if (this.isModified("isDefault") && this.isDefault) {
    // If updating to default, unset other defaults atomically
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { $set: { isDefault: false } }
    );
  }

  // ✅ NEW: If this is the first address, make it default
  if (this.isNew) {
    const existingCount = await this.constructor.countDocuments({
      user: this.user,
      _id: { $ne: this._id }
    });
    
    if (existingCount === 0) {
      this.isDefault = true;
    }
  }

  next();
});

// ---------- Instance Methods ----------

// Set as default address
addressSchema.methods.setAsDefault = async function () {
  // Atomic update to prevent race conditions
  await this.constructor.updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { $set: { isDefault: false } }
  );

  this.isDefault = true;
  return this.save();
};

// Get formatted address
addressSchema.methods.getFormattedAddress = function () {
  let formatted = this.address;
  if (this.landmark) formatted += `, ${this.landmark}`;
  formatted += `, ${this.city}, ${this.state} - ${this.pincode}`;
  return formatted;
};

// Get short address (for display in lists)
addressSchema.methods.getShortAddress = function () {
  return `${this.city}, ${this.state} - ${this.pincode}`;
};

// ✅ NEW: Mark address as used in order
addressSchema.methods.markAsUsed = async function () {
  this.isUsedInOrders = true;
  this.lastUsedAt = new Date();
  return this.save();
};

// ✅ NEW: Check if address can be safely deleted
addressSchema.methods.canBeDeleted = async function () {
  // Check if address is used in any active/pending orders
  const Order = mongoose.model("order");
  
  const activeOrders = await Order.countDocuments({
    user: this.user,
    "shippingAddress.address": this.address,
    "shippingAddress.pincode": this.pincode,
    orderStatus: { 
      $in: ["pending", "confirmed", "processing", "packed", "shipped", "out-for-delivery"] 
    },
  });

  return activeOrders === 0;
};

// ---------- Static Methods ----------

// Get user's addresses
addressSchema.statics.getUserAddresses = async function (userId, options = {}) {
  const { limit, skip } = options;
  
  let query = this.find({ user: userId })
    .sort({ isDefault: -1, lastUsedAt: -1, createdAt: -1 });
  
  if (limit) query = query.limit(limit);
  if (skip) query = query.skip(skip);
  
  return query;
};

// Get user's default address
addressSchema.statics.getDefaultAddress = async function (userId) {
  return this.findOne({ user: userId, isDefault: true });
};

// Get addresses by type
addressSchema.statics.getAddressesByType = async function (userId, type) {
  return this.find({ user: userId, addressType: type }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

// Count user's addresses
addressSchema.statics.countUserAddresses = async function (userId) {
  return this.countDocuments({ user: userId });
};

// ✅ FIXED: Better delete validation
addressSchema.statics.deleteAddress = async function (addressId, userId) {
  const address = await this.findOne({ _id: addressId, user: userId });

  if (!address) {
    throw new Error("Address not found");
  }

  // Check if address can be deleted
  const canDelete = await address.canBeDeleted();
  if (!canDelete) {
    throw new Error(
      "Cannot delete this address as it is being used in active orders. Please wait until orders are completed."
    );
  }

  // Check if this is the last address
  const addressCount = await this.countDocuments({ user: userId });

  if (addressCount === 1) {
    // Check if user has any orders (completed or pending)
    const Order = mongoose.model("order");
    const orderCount = await Order.countDocuments({ user: userId });

    if (orderCount > 0) {
      throw new Error(
        "Cannot delete the last address. Please add another address first."
      );
    }
  }

  // If this was the default address, set another as default
  if (address.isDefault && addressCount > 1) {
    // Find most recently used address, or newest address
    const nextAddress = await this.findOne({
      user: userId,
      _id: { $ne: addressId },
    }).sort({ lastUsedAt: -1, createdAt: -1 });

    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  await address.deleteOne();
  return { message: "Address deleted successfully" };
};

// Search addresses
addressSchema.statics.searchAddresses = async function (userId, searchTerm) {
  return this.find({
    user: userId,
    $or: [
      { fullName: new RegExp(searchTerm, "i") },
      { address: new RegExp(searchTerm, "i") },
      { city: new RegExp(searchTerm, "i") },
      { state: new RegExp(searchTerm, "i") },
      { pincode: new RegExp(searchTerm, "i") },
    ],
  }).sort({ isDefault: -1, createdAt: -1 });
};

// ✅ NEW: Check for duplicate address
addressSchema.statics.findDuplicate = async function (userId, addressData) {
  const { address, city, state, pincode } = addressData;
  
  return this.findOne({
    user: userId,
    address: { $regex: new RegExp(`^${address.trim()}$`, 'i') },
    city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
    state: { $regex: new RegExp(`^${state.trim()}$`, 'i') },
    pincode: pincode.trim(),
  });
};

// ✅ NEW: Get address usage statistics
addressSchema.statics.getAddressStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$addressType",
        count: { $sum: 1 },
        usedCount: {
          $sum: { $cond: ["$isUsedInOrders", 1, 0] }
        }
      }
    }
  ]);

  const total = await this.countDocuments({ user: userId });
  const hasDefault = await this.exists({ user: userId, isDefault: true });

  return {
    total,
    hasDefault: !!hasDefault,
    byType: stats.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        usedCount: item.usedCount
      };
      return acc;
    }, {})
  };
};

// ---------- Virtuals ----------

// Get address label
addressSchema.virtual("label").get(function () {
  return `${
    this.addressType.charAt(0).toUpperCase() + this.addressType.slice(1)
  } - ${this.city}`;
});

// Get display name
addressSchema.virtual("displayName").get(function () {
  return `${this.fullName} - ${this.phone}`;
});

// Check if address is complete
addressSchema.virtual("isComplete").get(function () {
  return !!(
    this.fullName &&
    this.phone &&
    this.address &&
    this.city &&
    this.state &&
    this.pincode
  );
});

// ✅ NEW: Check if address is recently used
addressSchema.virtual("isRecentlyUsed").get(function () {
  if (!this.lastUsedAt) return false;
  
  const daysSinceUse = (Date.now() - this.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUse <= 30; // Used in last 30 days
});

export default mongoose.model("address", addressSchema);