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

    // Product snapshot for consistency
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },

    // Size details
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

    // Price at time of adding to cart
    originalPrice: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 }, // After product discount
    discount: { type: Number, default: 0, min: 0, max: 100 },

    // Coupon discount (₹50 per quantity if coupon applied)
    couponDiscountPerItem: { type: Number, default: 0, min: 0 }, // ₹50 per item
    totalCouponDiscount: { type: Number, default: 0, min: 0 }, // ₹50 × quantity

    // Final item total
    itemTotal: { type: Number, required: true, min: 0 },

    // Mark if this is a free gift (won't be counted for conditions)
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
    // Either user OR device_id must be present
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    // For guest users (from cookie)
    deviceId: {
      type: String,
      default: null,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    // Applied coupon
    coupon: {
      code: { type: String, default: null },
      isApplied: { type: Boolean, default: false },
      discountPerItem: { type: Number, default: 50 }, // ₹50 per item
      totalDiscount: { type: Number, default: 0 }, // ₹50 × total quantity (excluding gifts)
    },

    // Free gifts based on total quantity (excluding gifts themselves)
    freeGifts: {
      eligible: { type: Boolean, default: false },
      highestTier: { type: Number, default: 0 }, // Highest tier achieved (1, 2, or 3)
      totalTiers: { type: Number, default: 0 }, // How many complete tier sets
      gifts: {
        type: [freeGiftSchema],
        default: [],
      },
    },

    // Cart summary
    summary: {
      totalQuantity: { type: Number, default: 0 }, // Sum of all quantities (excluding gifts)
      itemsCount: { type: Number, default: 0 }, // Number of unique items (excluding gifts)
      subtotal: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // For guest carts - expire after 7 days of inactivity
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
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired carts

// Compound index to ensure either user or deviceId exists
cartSchema.index({ user: 1, deviceId: 1 });

// ---------- Validation ----------
cartSchema.pre("validate", function () {
  // Either user or deviceId must be present
  if (!this.user && !this.deviceId) {
    throw new Error("Either user or deviceId must be provided");
  }
});

// ---------- Helper Function: Calculate Free Gifts Based on Total Quantity ----------
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

  // Gift prices mapping
  const giftPrices = {
    "Anime Keychain": 150,
    "Anime Figure": 300,
    "Anime Katana": 600,
    Stickers: 0,
  };

  // Base tiers definition
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

  // Determine highest tier
  if (totalQuantity >= 3) {
    highestTier = 3;
  } else if (totalQuantity === 2) {
    highestTier = 2;
  } else if (totalQuantity === 1) {
    highestTier = 1;
  }

  // Calculate how many complete tier 3 sets
  const tier3Sets = Math.floor(totalQuantity / 3);
  const remainder = totalQuantity % 3;

  // Add tier 3 gifts for each complete set
  if (tier3Sets > 0) {
    const aggregatedGifts = {};

    // Add all tier 3 sets
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

    // Add remainder tier gifts
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

    // Convert aggregated gifts object to array
    Object.values(aggregatedGifts).forEach((gift) => {
      gifts.push(gift);
    });

    totalTiers = tier3Sets + (remainder > 0 ? 1 : 0);
  } else {
    // Less than 3 items, just add the appropriate tier
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

// ---------- Pre-save: Calculate Totals and Free Gifts ----------
cartSchema.pre("save", function () {
  this.lastActivity = new Date();

  // Set expiry for guest carts (7 days from last activity)
  if (this.deviceId && !this.user) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    this.expiresAt = null; // User carts don't expire
  }

  let totalQuantity = 0;
  let itemsCount = 0;
  let subtotal = 0;
  let totalCouponDiscount = 0;

  // Calculate item totals (ONLY for non-gift items)
  this.items.forEach((item) => {
    // Skip free gifts in calculations
    if (item.isFreeGift) {
      item.itemTotal = 0;
      item.couponDiscountPerItem = 0;
      item.totalCouponDiscount = 0;
      return;
    }

    // Base item total (price × quantity)
    let itemSubtotal = item.price * item.quantity;

    // Apply coupon discount if coupon is applied
    if (this.coupon.isApplied) {
      item.couponDiscountPerItem = this.coupon.discountPerItem; // ₹50 per item
      item.totalCouponDiscount = this.coupon.discountPerItem * item.quantity; // ₹50 × quantity
      totalCouponDiscount += item.totalCouponDiscount;
    } else {
      item.couponDiscountPerItem = 0;
      item.totalCouponDiscount = 0;
    }

    // Calculate final item total (subtract coupon discount)
    item.itemTotal = Math.max(0, itemSubtotal - item.totalCouponDiscount);

    // Count only non-gift items
    totalQuantity += item.quantity;
    itemsCount += 1;
    subtotal += itemSubtotal;
  });

  // Update coupon total discount
  if (this.coupon.isApplied) {
    this.coupon.totalDiscount = totalCouponDiscount;
  } else {
    this.coupon.totalDiscount = 0;
  }

  // Calculate free gifts based on total quantity (excluding gifts)
  const freeGiftsData = calculateFreeGifts(totalQuantity);
  this.freeGifts = freeGiftsData;

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

  // Check if item already exists (same product + size)
  const existingItemIndex = this.items.findIndex(
    (item) =>
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
      couponDiscountPerItem:
        this.coupon.isApplied && !isFreeGift ? this.coupon.discountPerItem : 0,
      totalCouponDiscount:
        this.coupon.isApplied && !isFreeGift
          ? this.coupon.discountPerItem * quantity
          : 0,
      itemTotal: isFreeGift
        ? 0
        : price * quantity -
          (this.coupon.isApplied ? this.coupon.discountPerItem * quantity : 0),
    });
  }

  return this.save();
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

  // Don't allow updating free gift quantities
  if (item.isFreeGift) {
    throw new Error("Cannot modify free gift quantities");
  }

  item.quantity = newQuantity;
  return this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function (itemId) {
  const item = this.items.id(itemId);

  // Don't allow removing free gifts directly
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
    discountPerItem: 50,
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
cartSchema.methods.applyCoupon = async function (couponCode) {
  const Coupon = mongoose.model("coupon");

  // Validate coupon
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is no longer active");
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit");
  }

  // Apply coupon
  this.coupon = {
    code: coupon.code,
    isApplied: true,
    discountPerItem: coupon.discountPerItem,
    totalDiscount: 0, // Will be calculated in pre-save
  };

  return this.save();
};

// Remove coupon
cartSchema.methods.removeCoupon = async function () {
  this.coupon = {
    code: null,
    isApplied: false,
    discountPerItem: 50,
    totalDiscount: 0,
  };
  return this.save();
};

// Get free gifts description
cartSchema.methods.getFreeGiftsDescription = function () {
  if (!this.freeGifts.eligible) {
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

  // Calculate what they'll get on next item
  const nextQty = currentQty + 1;
  const nextGifts = calculateFreeGifts(nextQty);
  const currentGifts = calculateFreeGifts(currentQty);

  // Calculate the difference in gifts
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
  this.expiresAt = null; // User carts don't expire

  return this.save();
};

cartSchema.methods.validateCart = async function () {
  const Product = mongoose.model("product");
  const validationResults = [];

  for (const item of this.items) {
    // Skip free gifts
    if (item.isFreeGift) {
      continue;
    }

    const product = await Product.findById(item.product);

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

// Get or create cart (for both guest and logged-in users)
cartSchema.statics.getOrCreateCart = async function (identifier) {
  const { userId, deviceId } = identifier;

  let query = {};
  let cart;

  if (userId) {
    // Logged-in user - ONLY use userId, deviceId must be null
    query.user = userId;
    query.deviceId = null; // Explicitly ensure no deviceId

    cart = await this.findOne(query).populate("items.product");

    if (!cart) {
      // Create new user cart
      cart = await this.create({
        user: userId,
        deviceId: null,
      });
    } else {
      // Safety check: if cart somehow has deviceId, clear it
      if (cart.deviceId !== null) {
        cart.deviceId = null;
        await cart.save();
      }
    }
  } else if (deviceId) {
    // Guest user - ONLY use deviceId, user must be null
    query.deviceId = deviceId;
    query.user = null;

    cart = await this.findOne(query).populate("items.product");

    if (!cart) {
      // Create new guest cart
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

// Get free gifts tiers info (for displaying on frontend)
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
