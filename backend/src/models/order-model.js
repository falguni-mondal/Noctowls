import mongoose from "mongoose";

// ---------- Shipping Address Schema ----------
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

// ---------- Order Item Schema ----------
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    // Snapshot data (in case product is deleted later)
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      required: true,
    },
    sizeLabel: {
      type: String,
      required: true,
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
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Auto-calculate total before validation
orderItemSchema.pre("validate", function () {
  if (this.price && this.quantity) {
    this.total = this.price * this.quantity;
  }
});

// ---------- Payment Schema ----------
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["COD", "Card", "UPI", "Wallet", "NetBanking"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Tracking Schema ----------
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

// ---------- Cancellation Schema ----------
const cancellationSchema = new mongoose.Schema(
  {
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "admin"],
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
      enum: ["pending", "processing", "completed", "failed"],
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Invoice Schema ----------
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
    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    // Order Number (Auto-generated)
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Order Items
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

    // Shipping Address
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Payment Details
    payment: {
      type: paymentSchema,
      required: true,
    },

    // Pricing Breakdown
    pricing: {
      itemsTotal: {
        type: Number,
        required: true,
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
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // Order Status
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

    // Status Timestamps
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

    // Tracking Information
    tracking: {
      type: trackingSchema,
      default: () => ({}),
    },

    // Cancellation/Return Information
    cancellation: {
      type: cancellationSchema,
      default: () => ({}),
    },

    // Invoice Information
    invoice: {
      type: invoiceSchema,
      default: () => ({}),
    },

    // Notes (Admin/Internal)
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ "payment.razorpayOrderId": 1 });
orderSchema.index({ createdAt: -1 });

// ---------- Pre-save Hooks ----------

// Auto-generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Generate order number: ORD-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

    // Find last order of the day
    const lastOrder = await this.constructor
      .findOne({
        orderNumber: new RegExp(`^ORD-${dateStr}`),
      })
      .sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(5, "0")}`;
  }
  next();
});

// Auto-calculate pricing totals
orderSchema.pre("save", function (next) {
  // Calculate items total
  this.pricing.itemsTotal = this.items.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // Calculate final total
  this.pricing.totalAmount =
    this.pricing.itemsTotal +
    this.pricing.shippingCharges +
    this.pricing.tax -
    this.pricing.discount;

  next();
});

// Update status timestamps
orderSchema.pre("save", function (next) {
  if (this.isModified("orderStatus")) {
    const statusKey = this.orderStatus.replace(/-/g, "");
    const camelCaseKey =
      statusKey === "outfordelivery" ? "outForDelivery" : statusKey;

    if (this.statusTimestamps[camelCaseKey] === null) {
      this.statusTimestamps[camelCaseKey] = new Date();
    }
  }
  next();
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
  this.payment.transactionId = paymentDetails.transactionId;
  this.payment.razorpayPaymentId = paymentDetails.razorpayPaymentId;
  this.payment.razorpaySignature = paymentDetails.razorpaySignature;
  this.payment.paidAt = new Date();
  return this.save();
};

// Cancel order
orderSchema.methods.cancelOrder = function (cancelledBy, reason) {
  this.orderStatus = "cancelled";
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.reason = reason;

  // If paid, initiate refund
  if (this.payment.status === "completed") {
    this.cancellation.refundStatus = "pending";
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

  // INV-2024-03-00123
  const invoiceNum = `INV-${year}-${month}-${this.orderNumber.split("-")[2]}`;

  this.invoice.invoiceNumber = invoiceNum;
  this.invoice.generatedAt = new Date();

  return this.save();
};

// ---------- Static Methods ----------

// Get user's orders
orderSchema.statics.getUserOrders = function (userId, options = {}) {
  const { page = 1, limit = 10, status } = options;

  const query = { user: userId };
  if (status) query.orderStatus = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();
};

// Get order statistics
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
        totalRevenue: { $sum: "$pricing.totalAmount" },
        avgOrderValue: { $avg: "$pricing.totalAmount" },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] },
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
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  };
};

// ---------- Virtuals ----------

// Check if order can be cancelled
orderSchema.virtual("canBeCancelled").get(function () {
  return (
    !this.cancellation.isCancelled &&
    ["pending", "confirmed", "processing"].includes(this.orderStatus)
  );
});

// Check if order can be returned
orderSchema.virtual("canBeReturned").get(function () {
  if (this.orderStatus !== "delivered") return false;

  // Can return within 7 days of delivery
  const deliveryDate = this.statusTimestamps.delivered;
  if (!deliveryDate) return false;

  const daysSinceDelivery =
    (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceDelivery <= 7;
});

export default mongoose.model("order", orderSchema);