import mongoose from "mongoose";

// ---------- Free Gift Schema ---------- (Keep as is)
const freeGiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: {
      type: String,
      default:
        "https://ik.imagekit.io/noctowls/Gifts/gift.png?updatedAt=1766128110166",
    },
    category: { type: String, default: "" },
    originalPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

// ---------- Shipping Address Schema ---------- (Keep as is)
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
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
    address: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
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
  },
  { _id: false }
);

// ---------- Order Item Schema ---------- (Keep as is)
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      value: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      skuCode: {
        type: String,
        required: true,
      },
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Auto-calculate itemTotal before validation
orderItemSchema.pre("validate", function () {
  if (this.price && this.quantity) {
    this.itemTotal = this.price * this.quantity;
  }
});

// ---------- Payment Schema ---------- (Keep as is)
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["COD", "ONLINE"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    amountPaidOnline: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaidOnDelivery: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Coupon Schema ---------- (Keep as is)
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: null,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: null,
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    applyType: {
      type: String,
      enum: ["each-product", "each-order"],
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    minItemsRequired: {
      type: Number,
      default: 0,
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// ---------- Tracking Schema ---------- (Keep as is)
const trackingSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      default: null,
    },
    courierService: {
      type: String,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    actualDelivery: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Cancellation Schema ---------- (Keep as is)
const cancellationSchema = new mongoose.Schema(
  {
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "guest", "admin"],
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "not-applicable"],
      default: "not-applicable",
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ---------- Invoice Schema ---------- (Keep as is)
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    invoiceUrl: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Main Order Schema ----------
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
      index: true,
    },
    guestInfo: {
      email: { type: String, default: null },
      name: { type: String, default: null },
      phone: { type: String, default: null },
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    freeGifts: {
      eligible: { type: Boolean, default: false },
      highestTier: { type: Number, default: 0 },
      totalTiers: { type: Number, default: 0 },
      gifts: {
        type: [freeGiftSchema],
        default: [],
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    payment: {
      type: paymentSchema,
      required: true,
    },
    coupon: {
      type: couponSchema,
      default: () => ({}),
    },
    pricing: {
      productsSubtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      couponDiscount: {
        type: Number,
        default: 0,
        min: 0,
      },
      subtotalAfterCoupon: {
        type: Number,
        required: true,
        min: 0,
      },
      codFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      shippingCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      finalTotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },
    statusTimestamps: {
      pending: { type: Date, default: Date.now },
      confirmed: { type: Date, default: null },
      processing: { type: Date, default: null },
      packed: { type: Date, default: null },
      shipped: { type: Date, default: null },
      outForDelivery: { type: Date, default: null },
      delivered: { type: Date, default: null },
      cancelled: { type: Date, default: null },
      returned: { type: Date, default: null },
    },
    tracking: {
      type: trackingSchema,
      default: () => ({}),
    },
    cancellation: {
      type: cancellationSchema,
      default: () => ({}),
    },
    invoice: {
      type: invoiceSchema,
      default: () => ({}),
    },
    notes: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Validation ----------
orderSchema.pre("validate", function () {
  // Either user or deviceId must be present (not both, not neither)
  if (!this.user && !this.deviceId) {
    throw new Error("Either user or deviceId must be provided");
  }

  // ✅ FIX: Validate guest info phone matches shipping phone
  if (this.deviceId && !this.user) {
    if (!this.guestInfo.email) {
      throw new Error("Guest email is required for guest orders");
    }
    
    // ✅ NEW: Ensure guest phone matches shipping phone
    if (this.guestInfo.phone && this.shippingAddress.phone) {
      if (this.guestInfo.phone !== this.shippingAddress.phone) {
        console.warn('Guest info phone differs from shipping phone - using shipping phone');
        this.guestInfo.phone = this.shippingAddress.phone;
      }
    } else if (!this.guestInfo.phone && this.shippingAddress.phone) {
      this.guestInfo.phone = this.shippingAddress.phone;
    }
  }
});

// ---------- Indexes ---------- (Keep all as is)
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 }, { sparse: true });
orderSchema.index({ deviceId: 1, createdAt: -1 }, { sparse: true });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ "payment.razorpayOrderId": 1 });
orderSchema.index({ "payment.razorpayPaymentId": 1 });
orderSchema.index({ "coupon.code": 1 });
orderSchema.index({ "guestInfo.email": 1 }, { sparse: true });
orderSchema.index({ createdAt: -1 });

// ---------- Pre-save Hooks ---------- (Keep all as is)

// Auto-generate order number (FALLBACK ONLY - should not be used)
orderSchema.pre("save", async function () {
  try {
    // Only generate if orderNumber is somehow missing (shouldn't happen)
    if (this.isNew && !this.orderNumber) {
      console.warn('⚠️ Order number not provided! Generating fallback...');
      
      const date = new Date();
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      
      // Fallback format: ORD-timestamp-random
      this.orderNumber = `ORD-${timestamp}-${random}`;
      
      console.log('⚠️ Fallback order number:', this.orderNumber);
    }
  } catch (error) {
    console.error('❌ Error in order pre-save hook:', error);
  }
});

// Auto-calculate pricing totals
orderSchema.pre("save", function () {
  this.pricing.productsSubtotal = this.items.reduce(
    (sum, item) => sum + item.itemTotal,
    0
  );

  this.pricing.subtotalAfterCoupon =
    this.pricing.productsSubtotal - this.pricing.couponDiscount;

  this.pricing.finalTotal =
    this.pricing.subtotalAfterCoupon +
    this.pricing.codFee +
    this.pricing.shippingCharges +
    this.pricing.tax;
});

// Update status timestamps
orderSchema.pre("save", function () {
  if (this.isModified("orderStatus")) {
    const statusKey = this.orderStatus.replace(/-/g, "");
    const camelCaseKey =
      statusKey === "outfordelivery" ? "outForDelivery" : statusKey;

    if (this.statusTimestamps[camelCaseKey] === null) {
      this.statusTimestamps[camelCaseKey] = new Date();
    }
  }
});

// ---------- Instance Methods ----------

// Update order status
orderSchema.methods.updateStatus = function (newStatus) {
  this.orderStatus = newStatus;
  return this.save();
};

// Mark payment as completed
orderSchema.methods.completePayment = function (paymentDetails) {
  this.payment.status = "completed";
  this.payment.razorpayPaymentId = paymentDetails.razorpayPaymentId;
  this.payment.razorpaySignature = paymentDetails.razorpaySignature;
  this.payment.paidAt = new Date();

  if (this.orderStatus === "pending") {
    this.orderStatus = "confirmed";
  }

  return this.save();
};

// ✅ FIXED: Cancel order with proper coupon handling
orderSchema.methods.cancelOrder = function (cancelledBy, reason) {
  this.orderStatus = "cancelled";
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.reason = reason;

  // Calculate refund amount
  if (this.payment.status === "completed") {
    this.cancellation.refundStatus = "pending";

    if (this.payment.method === "ONLINE") {
      // Full refund for online payment
      this.cancellation.refundAmount = this.payment.amountPaidOnline;
    } else if (this.payment.method === "COD") {
      // Refund COD fee (₹50) only
      this.cancellation.refundAmount = this.pricing.codFee;
    }
  } else {
    this.cancellation.refundStatus = "not-applicable";
  }

  return this.save();
};

// Update tracking information
orderSchema.methods.updateTracking = function (trackingData) {
  this.tracking = { ...this.tracking, ...trackingData };
  return this.save();
};

// Generate invoice number
orderSchema.methods.generateInvoiceNumber = function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const invoiceNum = `INV-${year}-${month}-${this.orderNumber.split("-")[2]}`;

  this.invoice.invoiceNumber = invoiceNum;
  this.invoice.generatedAt = new Date();

  return this.save();
};

// Get payment summary
orderSchema.methods.getPaymentSummary = function () {
  return {
    method: this.payment.method,
    productsSubtotal: this.pricing.productsSubtotal,
    couponDiscount: this.pricing.couponDiscount,
    subtotalAfterCoupon: this.pricing.subtotalAfterCoupon,
    codFee: this.pricing.codFee,
    finalTotal: this.pricing.finalTotal,
    paidOnline: this.payment.amountPaidOnline,
    paidOnDelivery: this.payment.amountPaidOnDelivery,
    breakdown:
      this.payment.method === "COD"
        ? `₹${this.pricing.codFee} paid online (COD fee), ₹${this.payment.amountPaidOnDelivery} to be paid on delivery`
        : `₹${this.payment.amountPaidOnline} paid online`,
  };
};

// Get coupon details summary
orderSchema.methods.getCouponSummary = function () {
  if (!this.coupon.code) {
    return null;
  }

  return {
    code: this.coupon.code,
    type: this.coupon.discountType,
    value: this.coupon.discountValue,
    applyType: this.coupon.applyType,
    discountAmount: this.coupon.discountAmount,
    description:
      this.coupon.applyType === "each-product"
        ? this.coupon.discountType === "percentage"
          ? `${this.coupon.discountValue}% off on each product`
          : `₹${this.coupon.discountValue} off on each product`
        : this.coupon.discountType === "percentage"
        ? `${this.coupon.discountValue}% off on entire order`
        : `₹${this.coupon.discountValue} off on order`,
  };
};

// ✅ NEW: Check if order can be modified
orderSchema.methods.canBeModified = function () {
  return ["pending", "confirmed"].includes(this.orderStatus) && 
         !this.cancellation.isCancelled;
};

// ---------- Static Methods ---------- (Keep all as is)

orderSchema.statics.getOrders = function (identifier, options = {}) {
  const { userId, deviceId } = identifier;
  const { page = 1, limit = 10, status } = options;

  const query = {};

  if (userId) {
    query.user = userId;
  } else if (deviceId) {
    query.deviceId = deviceId;
  } else {
    throw new Error("Either userId or deviceId required");
  }

  if (status) query.orderStatus = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();
};

orderSchema.statics.getUserOrders = function (userId, options = {}) {
  return this.getOrders({ userId }, options);
};

orderSchema.statics.getGuestOrders = function (deviceId, options = {}) {
  return this.getOrders({ deviceId }, options);
};

orderSchema.statics.getOrderByNumber = async function (
  orderNumber,
  identifier
) {
  const { userId, deviceId } = identifier;

  const query = { orderNumber };

  if (userId) {
    query.user = userId;
  } else if (deviceId) {
    query.deviceId = deviceId;
  } else {
    throw new Error("Either userId or deviceId required");
  }

  return this.findOne(query);
};

orderSchema.statics.convertGuestOrdersToUser = async function (
  deviceId,
  userId
) {
  const result = await this.updateMany(
    { deviceId: deviceId, user: null },
    {
      $set: { user: userId },
      $unset: { deviceId: "", guestInfo: "" },
    }
  );

  return {
    convertedOrders: result.modifiedCount,
  };
};

orderSchema.statics.getOrderStats = async function (dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.finalTotal" },
        avgOrderValue: { $avg: "$pricing.finalTotal" },
        totalCouponDiscounts: { $sum: "$pricing.couponDiscount" },
        codOrders: {
          $sum: { $cond: [{ $eq: ["$payment.method", "COD"] }, 1, 0] },
        },
        onlineOrders: {
          $sum: { $cond: [{ $eq: ["$payment.method", "ONLINE"] }, 1, 0] },
        },
        guestOrders: {
          $sum: { $cond: [{ $eq: ["$user", null] }, 1, 0] },
        },
        userOrders: {
          $sum: { $cond: [{ $ne: ["$user", null] }, 1, 0] },
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] },
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "confirmed"] }, 1, 0] },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalCouponDiscounts: 0,
    codOrders: 0,
    onlineOrders: 0,
    guestOrders: 0,
    userOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  };
};

orderSchema.statics.getOrdersByCoupon = async function (couponCode) {
  return this.find({
    "coupon.code": couponCode.toUpperCase(),
  })
    .sort({ createdAt: -1 })
    .select(
      "orderNumber user deviceId pricing.couponDiscount pricing.finalTotal createdAt orderStatus"
    )
    .lean();
};

orderSchema.statics.searchOrders = async function (searchTerm, options = {}) {
  const { page = 1, limit = 20 } = options;

  const query = {
    $or: [
      { orderNumber: new RegExp(searchTerm, "i") },
      { "guestInfo.email": new RegExp(searchTerm, "i") },
      { "shippingAddress.phone": new RegExp(searchTerm, "i") },
      { "shippingAddress.fullName": new RegExp(searchTerm, "i") },
    ],
  };

  const orders = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("user", "name email")
    .lean();

  const total = await this.countDocuments(query);

  return {
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      limit,
    },
  };
};

// ---------- Virtuals ---------- (Keep all as is)

orderSchema.virtual("isGuestOrder").get(function () {
  return !!this.deviceId && !this.user;
});

orderSchema.virtual("customerId").get(function () {
  return this.user || this.deviceId;
});

orderSchema.virtual("customerType").get(function () {
  return this.user ? "registered" : "guest";
});

orderSchema.virtual("canBeCancelled").get(function () {
  return (
    !this.cancellation.isCancelled &&
    ["pending", "confirmed", "processing"].includes(this.orderStatus)
  );
});

orderSchema.virtual("canBeReturned").get(function () {
  if (this.orderStatus !== "delivered") return false;

  const deliveryDate = this.statusTimestamps.delivered;
  if (!deliveryDate) return false;

  const daysSinceDelivery =
    (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceDelivery <= 7;
});

orderSchema.virtual("freeGiftsDescription").get(function () {
  if (!this.freeGifts.eligible || this.freeGifts.gifts.length === 0) {
    return "No free gifts";
  }

  const giftsText = this.freeGifts.gifts
    .map((gift) => `${gift.quantity} ${gift.name}`)
    .join(", ");

  return `🎁 ${giftsText}`;
});

orderSchema.virtual("customerEmail").get(function () {
  if (this.user && this.user.email) {
    return this.user.email;
  }
  return this.guestInfo.email;
});

orderSchema.virtual("customerName").get(function () {
  if (this.user && this.user.name) {
    return this.user.name;
  }
  return this.guestInfo.name || this.shippingAddress.fullName;
});

export default mongoose.model("order", orderSchema);