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

// ---------- Cart Item Schema ----------
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    size: {
      value: { type: String, required: true },
      label: { type: String, default: "" },
      skuCode: { type: String, required: true },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    originalPrice: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    couponDiscountPerItem: { type: Number, default: 0, min: 0 },
    totalCouponDiscount: { type: Number, default: 0, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
    isFreeGift: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    _id: true,
  }
);

// ---------- Main Cart Schema ----------
const cartSchema = new mongoose.Schema(
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
    items: {
      type: [cartItemSchema],
      default: [],
    },
    coupon: {
      code: { type: String, default: null },
      isApplied: { type: Boolean, default: false },
      discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed",
      },
      discountValue: { type: Number, default: 0 },
      applyType: {
        type: String,
        enum: ["each-product", "each-order"],
        default: "each-product",
      },
      totalDiscount: { type: Number, default: 0 },
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
    summary: {
      totalQuantity: { type: Number, default: 0 },
      itemsCount: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
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
cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ deviceId: 1 }, { sparse: true });
cartSchema.index({ lastActivity: -1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ user: 1, deviceId: 1 });

// ---------- Validation ----------
cartSchema.pre("validate", function () {
  if (!this.user && !this.deviceId) {
    throw new Error("Either user or deviceId must be provided");
  }
});

// ---------- Helper Function: Calculate Free Gifts ----------
function calculateFreeGifts(totalQuantity) {
  if (totalQuantity === 0) {
    return {
      eligible: false,
      highestTier: 0,
      totalTiers: 0,
      gifts: [],
    };
  }

  const gifts = [];
  let eligible = true;
  let highestTier = 0;
  let totalTiers = 0;

  const giftPrices = {
    "Anime Keychain": 150,
    "Anime Figure": 300,
    "Anime Katana": 600,
    Stickers: 0,
  };

  const tierGifts = {
    1: [
      {
        name: "Anime Keychain",
        quantity: 1,
        category: "anime-keychain",
        originalPrice: giftPrices["Anime Keychain"],
      },
      {
        name: "Stickers",
        quantity: 5,
        category: "sticker",
        originalPrice: giftPrices["Stickers"],
      },
    ],
    2: [
      {
        name: "Anime Figure",
        quantity: 1,
        category: "anime-figure",
        originalPrice: giftPrices["Anime Figure"],
      },
      {
        name: "Anime Keychain",
        quantity: 2,
        category: "anime-keychain",
        originalPrice: giftPrices["Anime Keychain"],
      },
      {
        name: "Stickers",
        quantity: 10,
        category: "sticker",
        originalPrice: giftPrices["Stickers"],
      },
    ],
    3: [
      {
        name: "Anime Katana",
        quantity: 1,
        category: "anime-katana",
        originalPrice: giftPrices["Anime Katana"],
      },
      {
        name: "Anime Keychain",
        quantity: 3,
        category: "anime-keychain",
        originalPrice: giftPrices["Anime Keychain"],
      },
      {
        name: "Stickers",
        quantity: 15,
        category: "sticker",
        originalPrice: giftPrices["Stickers"],
      },
    ],
  };

  if (totalQuantity >= 3) {
    highestTier = 3;
  } else if (totalQuantity === 2) {
    highestTier = 2;
  } else if (totalQuantity === 1) {
    highestTier = 1;
  }

  const tier3Sets = Math.floor(totalQuantity / 3);
  const remainder = totalQuantity % 3;

  if (tier3Sets > 0) {
    const aggregatedGifts = {};

    for (let i = 0; i < tier3Sets; i++) {
      tierGifts[3].forEach((gift) => {
        const key = gift.name;
        if (aggregatedGifts[key]) {
          aggregatedGifts[key].quantity += gift.quantity;
        } else {
          aggregatedGifts[key] = { ...gift };
        }
      });
    }

    if (remainder > 0 && tierGifts[remainder]) {
      tierGifts[remainder].forEach((gift) => {
        const key = gift.name;
        if (aggregatedGifts[key]) {
          aggregatedGifts[key].quantity += gift.quantity;
        } else {
          aggregatedGifts[key] = { ...gift };
        }
      });
    }

    Object.values(aggregatedGifts).forEach((gift) => {
      gifts.push(gift);
    });

    totalTiers = tier3Sets + (remainder > 0 ? 1 : 0);
  } else {
    if (tierGifts[totalQuantity]) {
      gifts.push(...tierGifts[totalQuantity]);
      totalTiers = 1;
    }
  }

  return {
    eligible,
    highestTier,
    totalTiers,
    gifts,
  };
}

// ---------- Helper Function: Calculate Coupon Discount ----------
function calculateCouponDiscount(cart) {
  if (!cart.coupon.isApplied) {
    return 0;
  }

  const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);
  let totalDiscount = 0;

  if (cart.coupon.applyType === "each-product") {
    if (cart.coupon.discountType === "fixed") {
      const totalQuantity = nonGiftItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      totalDiscount = cart.coupon.discountValue * totalQuantity;
    } else {
      nonGiftItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const itemDiscount = (itemTotal * cart.coupon.discountValue) / 100;
        totalDiscount += itemDiscount;
      });
    }
  } else {
    const subtotal = nonGiftItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (cart.coupon.discountType === "fixed") {
      totalDiscount = cart.coupon.discountValue;
    } else {
      totalDiscount = (subtotal * cart.coupon.discountValue) / 100;
    }
  }

  const subtotal = nonGiftItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  totalDiscount = Math.min(totalDiscount, subtotal);

  return Math.round(totalDiscount * 100) / 100;
}

// ---------- Pre-save: Calculate Totals and Free Gifts ----------
cartSchema.pre("save", function () {
  this.lastActivity = new Date();

  if (this.deviceId && !this.user) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    this.expiresAt = null;
  }

  let totalQuantity = 0;
  let itemsCount = 0;
  let subtotal = 0;

  // Calculate item totals (ONLY for non-gift items)
  this.items.forEach((item) => {
    if (item.isFreeGift) {
      item.itemTotal = 0;
      item.couponDiscountPerItem = 0;
      item.totalCouponDiscount = 0;
      return;
    }

    let itemSubtotal = item.price * item.quantity;
    totalQuantity += item.quantity;
    itemsCount += 1;
    subtotal += itemSubtotal;
  });

  // ✅ FIX: Auto-remove coupon if cart no longer qualifies
  if (this.coupon.isApplied) {
    const Coupon = mongoose.model("coupon");

    // Check minimum purchase amount
    if (
      this.coupon.minPurchaseAmount &&
      subtotal < this.coupon.minPurchaseAmount
    ) {
      console.log(
        `Auto-removing coupon: subtotal ${subtotal} < min ${this.coupon.minPurchaseAmount}`
      );
      this.coupon = {
        code: null,
        isApplied: false,
        discountType: "fixed",
        discountValue: 0,
        applyType: "each-product",
        totalDiscount: 0,
      };
    }

    // Check minimum items required
    if (
      this.coupon.minItemsRequired &&
      totalQuantity < this.coupon.minItemsRequired
    ) {
      console.log(
        `Auto-removing coupon: quantity ${totalQuantity} < min ${this.coupon.minItemsRequired}`
      );
      this.coupon = {
        code: null,
        isApplied: false,
        discountType: "fixed",
        discountValue: 0,
        applyType: "each-product",
        totalDiscount: 0,
      };
    }
  }

  // Calculate coupon discount
  const totalCouponDiscount = calculateCouponDiscount(this);

  // Distribute coupon discount to items
  if (this.coupon.isApplied && totalCouponDiscount > 0) {
    const nonGiftItems = this.items.filter((item) => !item.isFreeGift);

    if (this.coupon.applyType === "each-product") {
      if (this.coupon.discountType === "fixed") {
        nonGiftItems.forEach((item) => {
          item.couponDiscountPerItem = this.coupon.discountValue;
          item.totalCouponDiscount = this.coupon.discountValue * item.quantity;
          item.itemTotal = Math.max(
            0,
            item.price * item.quantity - item.totalCouponDiscount
          );
        });
      } else {
        nonGiftItems.forEach((item) => {
          const itemTotal = item.price * item.quantity;
          const itemDiscount = (itemTotal * this.coupon.discountValue) / 100;
          item.couponDiscountPerItem = itemDiscount / item.quantity;
          item.totalCouponDiscount = itemDiscount;
          item.itemTotal = Math.max(0, itemTotal - itemDiscount);
        });
      }
    } else {
      const totalItemsValue = nonGiftItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      nonGiftItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const itemProportion = itemTotal / totalItemsValue;
        const itemDiscount = totalCouponDiscount * itemProportion;
        item.couponDiscountPerItem = itemDiscount / item.quantity;
        item.totalCouponDiscount = itemDiscount;
        item.itemTotal = Math.max(0, itemTotal - itemDiscount);
      });
    }
  } else {
    this.items.forEach((item) => {
      if (!item.isFreeGift) {
        item.couponDiscountPerItem = 0;
        item.totalCouponDiscount = 0;
        item.itemTotal = item.price * item.quantity;
      }
    });
  }

  this.coupon.totalDiscount = totalCouponDiscount;

  // Calculate free gifts
  const freeGiftsData = calculateFreeGifts(totalQuantity);
  this.freeGifts = freeGiftsData;

  // ✅ FIX: Auto-update free gift items in cart
  // Remove all old free gift items
  this.items = this.items.filter((item) => !item.isFreeGift);

  // Add new free gift items
  if (freeGiftsData.eligible && freeGiftsData.gifts.length > 0) {
    freeGiftsData.gifts.forEach((gift) => {
      this.items.push({
        product: new mongoose.Types.ObjectId(), // Dummy ID for free gifts
        name: gift.name,
        image:
          "https://ik.imagekit.io/noctowls/Gifts/gift.png?updatedAt=1766128110166",
        category: gift.category,
        size: {
          value: "free",
          label: "FREE GIFT",
          skuCode: `GIFT-${gift.name.replace(/\s+/g, "-").toUpperCase()}`,
        },
        quantity: gift.quantity,
        originalPrice: gift.originalPrice,
        price: 0,
        discount: 100,
        isFreeGift: true,
        couponDiscountPerItem: 0,
        totalCouponDiscount: 0,
        itemTotal: 0,
      });
    });
  }

  // Update summary
  this.summary.totalQuantity = totalQuantity;
  this.summary.itemsCount = itemsCount;
  this.summary.subtotal = subtotal;
  this.summary.couponDiscount = totalCouponDiscount;
  this.summary.total = Math.max(0, subtotal - totalCouponDiscount);
});

// ---------- Instance Methods ----------

// Add item to cart
cartSchema.methods.addItem = async function (itemData) {
  const {
    product,
    name,
    image,
    category,
    size,
    quantity,
    originalPrice,
    price,
    discount,
    isFreeGift = false,
  } = itemData;

  // ✅ FIX: Safe comparison with null checks
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product != null && // ← Add null check
      item.product.toString() === product.toString() &&
      item.size.value === size.value &&
      item.isFreeGift === isFreeGift
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product,
      name,
      image,
      category,
      size,
      quantity,
      originalPrice,
      price,
      discount,
      isFreeGift,
      couponDiscountPerItem: 0,
      totalCouponDiscount: 0,
      itemTotal: isFreeGift ? 0 : price * quantity,
    });
  }

  return this.save();
};

// ✅ NEW: Clean invalid items from cart
cartSchema.methods.cleanInvalidItems = async function () {
  const initialLength = this.items.length;

  // Remove items with null/undefined products or missing required fields
  this.items = this.items.filter((item) => {
    if (item.isFreeGift) return true; // Keep free gifts (they have dummy product IDs)

    const isValid =
      item.product != null &&
      item.name &&
      item.size?.value &&
      item.price != null &&
      item.quantity > 0;

    if (!isValid) {
      console.log("🗑️ Removing invalid cart item:", {
        name: item.name || "Unknown",
        product: item.product,
        hasProduct: item.product != null,
      });
    }

    return isValid;
  });

  const removedCount = initialLength - this.items.length;

  if (removedCount > 0) {
    console.log(`✅ Cleaned ${removedCount} invalid items from cart`);
    await this.save();
  }

  return this;
};

// Update item quantity
cartSchema.methods.updateItemQuantity = async function (itemId, newQuantity) {
  if (newQuantity <= 0) {
    return this.removeItem(itemId);
  }

  const item = this.items.id(itemId);
  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (item.isFreeGift) {
    throw new Error("Cannot modify free gift quantities");
  }

  item.quantity = newQuantity;
  return this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function (itemId) {
  const item = this.items.id(itemId);

  if (item && item.isFreeGift) {
    throw new Error("Cannot remove free gifts");
  }

  this.items.pull(itemId);
  return this.save();
};

// Clear cart
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.coupon = {
    code: null,
    isApplied: false,
    discountType: "fixed",
    discountValue: 0,
    applyType: "each-product",
    totalDiscount: 0,
  };
  this.freeGifts = {
    eligible: false,
    highestTier: 0,
    totalTiers: 0,
    gifts: [],
  };
  return this.save();
};

// Apply coupon
cartSchema.methods.applyCoupon = async function (
  couponCode,
  userId = null,
  deviceId = null
) {
  const Coupon = mongoose.model("coupon");

  if (!userId && !deviceId) {
    throw new Error("User authentication or device identification required");
  }

  if (userId && deviceId) {
    throw new Error("Cannot use both userId and deviceId");
  }

  const coupon = await Coupon.findValidCoupon(couponCode);

  if (!coupon) {
    throw new Error("Invalid or expired coupon code");
  }

  coupon.validateForCart(this, userId, deviceId);

  this.coupon = {
    code: coupon.code,
    isApplied: true,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    applyType: coupon.applyType,
    totalDiscount: 0, // Will be calculated in pre-save
    minPurchaseAmount: coupon.minPurchaseAmount || 0,
    minItemsRequired: coupon.minItemsRequired || 0,
  };

  return this.save();
};

// Remove coupon
cartSchema.methods.removeCoupon = async function () {
  this.coupon = {
    code: null,
    isApplied: false,
    discountType: "fixed",
    discountValue: 0,
    applyType: "each-product",
    totalDiscount: 0,
  };
  return this.save();
};

// Get free gifts description
cartSchema.methods.getFreeGiftsDescription = function () {
  if (!this.freeGifts.eligible || this.freeGifts.gifts.length === 0) {
    return "Add more items to unlock free gifts!";
  }

  const giftsText = this.freeGifts.gifts
    .map((gift) => `${gift.quantity} ${gift.name}`)
    .join(", ");

  return `🎁 You're getting: ${giftsText} FREE!`;
};

// Get next tier info
cartSchema.methods.getNextTierInfo = function () {
  const currentQty = this.summary.totalQuantity;

  if (currentQty === 0) {
    return {
      itemsNeeded: 1,
      nextTier: 1,
      message: "Add 1 item to get 1 Anime Keychain + 5 Stickers FREE!",
    };
  }

  const nextQty = currentQty + 1;
  const nextGifts = calculateFreeGifts(nextQty);
  const currentGifts = calculateFreeGifts(currentQty);

  const additionalGifts = [];
  nextGifts.gifts.forEach((nextGift) => {
    const currentGift = currentGifts.gifts.find(
      (g) => g.name === nextGift.name
    );
    const currentQuantity = currentGift ? currentGift.quantity : 0;
    const additionalQuantity = nextGift.quantity - currentQuantity;

    if (additionalQuantity > 0) {
      additionalGifts.push(`${additionalQuantity} ${nextGift.name}`);
    }
  });

  if (additionalGifts.length === 0) {
    return {
      itemsNeeded: 0,
      nextTier: nextGifts.highestTier,
      message:
        "You're getting amazing free gifts! Keep adding more to get even more! 🎉",
    };
  }

  return {
    itemsNeeded: 1,
    nextTier: nextGifts.highestTier,
    message: `Add 1 more item to get ${additionalGifts.join(", ")} extra FREE!`,
  };
};

// Convert guest cart to user cart
cartSchema.methods.convertToUserCart = async function (userId) {
  if (this.user) {
    throw new Error("Cart is already associated with a user");
  }

  this.user = userId;
  this.deviceId = null;
  this.expiresAt = null;

  return this.save();
};

// ✅ FIXED: Validate cart with proper population
cartSchema.methods.validateCart = async function () {
  const Product = mongoose.model("product");
  const validationResults = [];

  for (const item of this.items) {
    if (item.isFreeGift) {
      continue;
    }

    // ✅ FIX: Populate product if not already populated
    let product = item.product;
    if (!product.name) {
      product = await Product.findById(item.product);
    }

    if (!product) {
      validationResults.push({
        itemId: item._id,
        productName: item.name,
        isValid: false,
        reason: "Product not found",
        action: "remove",
      });
      continue;
    }

    if (product.status !== "published") {
      validationResults.push({
        itemId: item._id,
        productName: item.name,
        isValid: false,
        reason: "Product no longer available",
        action: "remove",
      });
      continue;
    }

    const sizeData = product.sizes.find((s) => s.value === item.size.value);

    if (!sizeData) {
      validationResults.push({
        itemId: item._id,
        productName: item.name,
        isValid: false,
        reason: "Size not available",
        action: "remove",
      });
      continue;
    }

    if (sizeData.stock < item.quantity) {
      validationResults.push({
        itemId: item._id,
        productName: item.name,
        isValid: false,
        reason: "Insufficient stock",
        availableStock: sizeData.stock,
        requestedQuantity: item.quantity,
        action: sizeData.stock > 0 ? "update" : "remove",
      });
    } else {
      validationResults.push({
        itemId: item._id,
        productName: item.name,
        isValid: true,
      });
    }
  }

  return {
    isValid: validationResults.every((r) => r.isValid),
    results: validationResults,
  };
};

// ---------- Static Methods ----------

// ✅ FIXED: Better cart retrieval
cartSchema.statics.getOrCreateCart = async function (identifier) {
  const { userId, deviceId } = identifier;

  let query = {};
  let cart;

  if (userId) {
    query.user = userId;
    query.deviceId = null;

    cart = await this.findOne(query).populate("items.product");

    if (!cart) {
      cart = await this.create({
        user: userId,
        deviceId: null,
      });
    } else {
      if (cart.deviceId !== null) {
        cart.deviceId = null;
        await cart.save();
      }
    }
  } else if (deviceId) {
    query.deviceId = deviceId;
    query.user = null;

    cart = await this.findOne(query).populate("items.product");

    if (!cart) {
      cart = await this.create({
        user: null,
        deviceId: deviceId,
      });
    }
  } else {
    throw new Error("Either userId or deviceId must be provided");
  }

  return cart;
};

// Get free gifts tiers info
cartSchema.statics.getFreeGiftsTiers = function () {
  return [
    {
      tier: 1,
      itemsRequired: 1,
      gifts: [
        { name: "Anime Keychain", quantity: 1, originalPrice: 150 },
        { name: "Stickers", quantity: 5, originalPrice: 0 },
      ],
      description: "Buy 1 item, get 1 Anime Keychain (₹150) + 5 Stickers FREE!",
      totalValue: 150,
    },
    {
      tier: 2,
      itemsRequired: 2,
      gifts: [
        { name: "Anime Figure", quantity: 1, originalPrice: 300 },
        { name: "Anime Keychain", quantity: 2, originalPrice: 150 },
        { name: "Stickers", quantity: 10, originalPrice: 0 },
      ],
      description:
        "Buy 2 items, get 1 Anime Figure (₹300) + 2 Anime Keychains (₹300) + 10 Stickers FREE!",
      totalValue: 600,
    },
    {
      tier: 3,
      itemsRequired: 3,
      gifts: [
        { name: "Anime Katana", quantity: 1, originalPrice: 600 },
        { name: "Anime Keychain", quantity: 3, originalPrice: 150 },
        { name: "Stickers", quantity: 15, originalPrice: 0 },
      ],
      description:
        "Buy 3+ items, get 1 Anime Katana (₹600) + 3 Anime Keychains (₹450) + 15 Stickers FREE!",
      totalValue: 1050,
    },
  ];
};

export default mongoose.model("cart", cartSchema);
