import mongoose from "mongoose";

// ---------- Free Gift Schema ----------
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

    // ---------- GST Fields (Per Item) ----------
    gstRate: {
      type: Number,
      required: true,
      min: 0,
    },
    hsnCode: {
      type: String,
      required: true,
      trim: true,
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxType: {
      type: String,
      enum: ["cgst_sgst", "igst"],
      required: true,
    },
    priceWithGST: {
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
    // Ensure priceWithGST matches itemTotal if not explicitly set differently
    if (!this.priceWithGST) {
      this.priceWithGST = this.itemTotal;
    }
  }
});

// ---------- Payment Schema ----------
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
      enum: ["pending", "completed", "failed", "delivered", "refunded"],
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

// ---------- Coupon Schema ----------
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

// ---------- NEW: Return Timeline Schema (Simple) ----------
const returnTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true }, // e.g. "Return Requested"
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" }, // Optional details
  },
  { _id: false }
);

// ---------- NEW: Return Request Schema (Simple) ----------
const returnSchema = new mongoose.Schema(
  {
    isReturnActive: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["refund", "exchange"],
      default: null,
    },
    status: {
      type: String,
      enum: [
        "none",
        "requested", // User requested
        "approved",  // Admin approved
        "rejected",  // Admin rejected
        "completed", // Money refunded or exchange item sent
      ],
      default: "none",
    },
    reason: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
    },
    // The timeline array for frontend tracking
    timeline: {
      type: [returnTimelineSchema],
      default: [],
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
    
    // ---------- GST Summary Fields (Order Level) ----------
    sellerState: {
      type: String,
      default: "West Bengal",
      trim: true,
    },
    totalGST: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCGST: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSGST: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIGST: {
      type: Number,
      default: 0,
      min: 0,
    },
    subTotal: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Taxable Value (Total before tax)",
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Total Payable Value (including tax)",
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
    // ---------- NEW FIELD: Return Info (Simple) ----------
    returnInfo: {
      type: returnSchema,
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

  // Enhanced guest validation with better phone handling
  if (this.deviceId && !this.user) {
    // Validate required guest fields
    if (!this.guestInfo.email) {
      throw new Error("Guest email is required for guest orders");
    }

    // Ensure guest name is present (use shipping name as fallback)
    if (!this.guestInfo.name) {
      this.guestInfo.name = this.shippingAddress.fullName;
    }

    // Phone synchronization: Always use shipping phone as source of truth
    if (!this.guestInfo.phone) {
      // If guest phone is missing, use shipping phone
      this.guestInfo.phone = this.shippingAddress.phone;
    } else if (this.guestInfo.phone !== this.shippingAddress.phone) {
      // If phones differ, log warning and use shipping phone
      console.warn(
        `⚠️ Guest phone (${this.guestInfo.phone}) differs from shipping phone (${this.shippingAddress.phone}) - using shipping phone`
      );
      this.guestInfo.phone = this.shippingAddress.phone;
    }

    // Validate phone format after synchronization
    if (!/^[0-9]{10}$/.test(this.guestInfo.phone)) {
      throw new Error("Guest phone must be 10 digits");
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guestInfo.email)) {
      throw new Error("Invalid guest email format");
    }
  }

  // Validate that user orders don't have deviceId
  if (this.user && this.deviceId) {
    console.warn("⚠️ Order has both user and deviceId - removing deviceId");
    this.deviceId = null;
  }

  // Validate payment amounts
  if (this.payment.method === "COD") {
    // COD: amountPaidOnline should be codFee only
    if (this.payment.amountPaidOnline > this.pricing.codFee + 1) {
      // +1 for rounding tolerance
      console.warn(
        `⚠️ COD amountPaidOnline (${this.payment.amountPaidOnline}) exceeds codFee (${this.pricing.codFee})`
      );
    }

    // Calculate amount to be paid on delivery
    const expectedCODAmount =
      this.pricing.finalTotal - this.payment.amountPaidOnline;
    if (Math.abs(this.payment.amountPaidOnDelivery - expectedCODAmount) > 1) {
      console.warn(
        `⚠️ Adjusting COD delivery amount from ${this.payment.amountPaidOnDelivery} to ${expectedCODAmount}`
      );
      this.payment.amountPaidOnDelivery = expectedCODAmount;
    }
  } else if (this.payment.method === "ONLINE") {
    // ONLINE: amountPaidOnline should equal finalTotal
    if (Math.abs(this.payment.amountPaidOnline - this.pricing.finalTotal) > 1) {
      console.warn(
        `⚠️ Online payment amount (${this.payment.amountPaidOnline}) differs from finalTotal (${this.pricing.finalTotal})`
      );
    }

    // Ensure amountPaidOnDelivery is 0 for online payments
    if (this.payment.amountPaidOnDelivery !== 0) {
      console.warn("⚠️ Online payment should have 0 amountPaidOnDelivery");
      this.payment.amountPaidOnDelivery = 0;
    }
  }
});

// ---------- Indexes ----------
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
orderSchema.index({ user: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ deviceId: 1, orderStatus: 1, createdAt: -1 });

// ---------- Pre-save Hooks ----------

// 1. GST Calculation & State Logic Hook (NEW)
orderSchema.pre("save", function () {
  // Only calculate if items or shipping address changed, or on creation
  if (!this.isModified("items") && !this.isModified("shippingAddress")) {
    return;
  }

  try {
    const sellerState = (this.sellerState || "West Bengal").trim().toLowerCase();
    const customerState = (this.shippingAddress.state || "")
      .trim()
      .toLowerCase();

    // Determine Intra-state (Same State) or Inter-state (Different State)
    const isIntraState = sellerState === customerState;

    let orderTotalGST = 0;
    let orderTotalCGST = 0;
    let orderTotalSGST = 0;
    let orderTotalIGST = 0;
    let orderSubTotal = 0;

    // Process each item
    this.items.forEach((item) => {
      const gstAmt = item.gstAmount || 0;

      // Split tax based on state
      if (isIntraState) {
        item.taxType = "cgst_sgst";
        item.cgstAmount = gstAmt / 2;
        item.sgstAmount = gstAmt / 2;
        item.igstAmount = 0;
      } else {
        item.taxType = "igst";
        item.cgstAmount = 0;
        item.sgstAmount = 0;
        item.igstAmount = gstAmt;
      }

      // Calculate base price (Taxable Value) for this item
      // priceWithGST includes tax, so base = total - tax
      const basePrice = (item.priceWithGST || item.itemTotal) - gstAmt;

      // Accumulate Order Totals
      orderSubTotal += basePrice;
      orderTotalGST += gstAmt;
      orderTotalCGST += item.cgstAmount;
      orderTotalSGST += item.sgstAmount;
      orderTotalIGST += item.igstAmount;
    });

    // Update Root Order Fields
    this.subTotal = orderSubTotal;
    this.totalGST = orderTotalGST;
    this.totalCGST = orderTotalCGST;
    this.totalSGST = orderTotalSGST;
    this.totalIGST = orderTotalIGST;
    this.grandTotal = this.subTotal + this.totalGST;

    if (!this.pricing) this.pricing = {};
    // Sync with existing pricing object for backward compatibility
    this.pricing.tax = this.totalGST;
  } catch (error) {
    console.error("Error in GST Calculation Hook:", error);
  }
});

// 2. Auto-generate order number (FALLBACK ONLY)
orderSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.orderNumber) {
      console.warn("⚠️ Order number not provided! Generating fallback...");
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.orderNumber = `ORD-${timestamp}-${random}`;
    }
  } catch (error) {
    console.error("❌ Error in order pre-save hook:", error);
  }
});

// 3. Auto-calculate pricing totals (Existing)
orderSchema.pre("save", function () {
  if (!this.pricing) this.pricing = {};

  this.pricing.productsSubtotal = this.items.reduce(
    (sum, item) => sum + item.itemTotal,
    0
  );

  const discount = this.pricing.couponDiscount || 0;
  this.pricing.subtotalAfterCoupon = this.pricing.productsSubtotal - discount;

  this.pricing.finalTotal =
    this.pricing.subtotalAfterCoupon +
    (this.pricing.codFee || 0) +
    (this.pricing.shippingCharges || 0) +
    (this.pricing.tax || 0);
});

// 4. Update status timestamps
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

// Enhanced cancel order with proper coupon tracking
orderSchema.methods.cancelOrder = async function (cancelledBy, reason) {
  this.orderStatus = "cancelled";
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.reason = reason;

  // Calculate refund amount
  if (this.payment.status === "completed") {
    this.cancellation.refundStatus = "pending";

    if (this.payment.method === "ONLINE") {
      this.cancellation.refundAmount = this.payment.amountPaidOnline;
    } else if (this.payment.method === "COD") {
      // COD fee is refundable ONLY if order is NOT YET shipped
      const nonRefundableStatuses = [
        "shipped",
        "out-for-delivery",
        "delivered",
        "returned",
      ];
      
      if (nonRefundableStatuses.includes(this.orderStatus)) {
        // If order is already shipped, COD fee is forfeited
        this.cancellation.refundAmount = 0;
      } else {
        // If not shipped, refund the fee (since they paid it online)
        this.cancellation.refundAmount = this.pricing.codFee;
      }
    }
  } else {
    this.cancellation.refundStatus = "not-applicable";
  }

  const couponData = this.coupon.code
    ? {
        code: this.coupon.code,
        userId: this.user || null,
        deviceId: this.deviceId || null,
      }
    : null;

  await this.save();

  return {
    order: this,
    couponToRevert: couponData,
  };
};

// Update tracking information
orderSchema.methods.updateTracking = function (trackingData) {
  this.tracking = { ...this.tracking, ...trackingData };
  return this.save();
};

// Method to generate unique Invoice Number
orderSchema.methods.generateInvoiceNumber = async function () {
  if (this.invoice && this.invoice.invoiceNumber) return;

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}-${month}`;

  const lastInvoiceOrder = await this.constructor
    .findOne({
      "invoice.invoiceNumber": { $regex: `^${prefix}` },
    })
    .sort({ "invoice.invoiceNumber": -1 })
    .select("invoice.invoiceNumber");

  let sequence = 1;

  if (
    lastInvoiceOrder &&
    lastInvoiceOrder.invoice &&
    lastInvoiceOrder.invoice.invoiceNumber
  ) {
    const parts = lastInvoiceOrder.invoice.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  this.invoice = {
    ...this.invoice,
    invoiceNumber: `${prefix}-${String(sequence).padStart(5, "0")}`,
    generatedAt: new Date(),
  };

  await this.save();
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

// Check if order can be modified
orderSchema.methods.canBeModified = function () {
  return (
    ["pending", "confirmed"].includes(this.orderStatus) &&
    !this.cancellation.isCancelled
  );
};

// Add method to check if order can be cancelled
orderSchema.methods.canBeCancelledByUser = function () {
  return (
    !this.cancellation.isCancelled &&
    ["pending", "confirmed", "processing"].includes(this.orderStatus) &&
    this.payment.status !== "refunded"
  );
};

// Add method to get customer identifier
orderSchema.methods.getCustomerIdentifier = function () {
  return {
    userId: this.user || null,
    deviceId: this.deviceId || null,
    email: this.user ? null : this.guestInfo.email,
    isGuest: !this.user,
  };
};

// ---------- Static Methods ----------

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

  return (
    stats[0] || {
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
    }
  );
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

orderSchema.statics.findOrdersByEmail = async function (email) {
  return this.find({
    "guestInfo.email": { $regex: new RegExp(`^${email}$`, "i") },
  })
    .sort({ createdAt: -1 })
    .select(
      "orderNumber orderStatus createdAt pricing.finalTotal payment.method shippingAddress"
    )
    .lean();
};

orderSchema.statics.existsByOrderNumber = async function (orderNumber) {
  return this.exists({ orderNumber });
};

// ---------- Virtuals ----------

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
  return this.canBeCancelledByUser();
});

// ---------- MODIFIED: canBeReturned Virtual ----------
orderSchema.virtual("canBeReturned").get(function () {
  // 1. Must be delivered
  if (this.orderStatus !== "delivered") return false;

  // 2. Must not have an active or completed return
  if (this.returnInfo && this.returnInfo.status !== "none") return false;

  // 3. Must be within 7 days
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

orderSchema.virtual("daysSinceOrdered").get(function () {
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
});

orderSchema.virtual("estimatedDeliveryDate").get(function () {
  if (this.tracking.estimatedDelivery) {
    return this.tracking.estimatedDelivery;
  }

  if (
    this.orderStatus === "shipped" ||
    this.orderStatus === "out-for-delivery"
  ) {
    const shippedDate = this.statusTimestamps.shipped || this.createdAt;
    return new Date(shippedDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  }

  return new Date(this.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
});

export default mongoose.model("order", orderSchema);