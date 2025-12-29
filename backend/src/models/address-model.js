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

// ---------- Pre-save Middleware ----------
// Ensure only one default address per user
addressSchema.pre("save", async function (next) {
  if (this.isNew && this.isDefault) {
    // If this is a new default address, unset other defaults
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  } else if (this.isModified("isDefault") && this.isDefault) {
    // If updating to default, unset other defaults
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }

  next();
});

// ---------- Instance Methods ----------

// Set as default address
addressSchema.methods.setAsDefault = async function () {
  // Unset all other default addresses for this user
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

// ---------- Static Methods ----------

// Get user's addresses
addressSchema.statics.getUserAddresses = async function (userId) {
  return this.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
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

// Delete address with validation
addressSchema.statics.deleteAddress = async function (addressId, userId) {
  const address = await this.findOne({ _id: addressId, user: userId });

  if (!address) {
    throw new Error("Address not found");
  }

  // Check if this is the last address
  const addressCount = await this.countDocuments({ user: userId });

  if (addressCount === 1) {
    // Check if user has any orders
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
    const nextAddress = await this.findOne({
      user: userId,
      _id: { $ne: addressId },
    }).sort({ createdAt: -1 });

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

export default mongoose.model("address", addressSchema);