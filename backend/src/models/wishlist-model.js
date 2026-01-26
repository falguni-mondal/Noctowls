import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

// Compound index for user and product lookup
wishlistSchema.index({ user: 1, "items.product": 1 });

// ==================== INSTANCE METHODS ====================

/**
 * Check if product exists in wishlist
 */
wishlistSchema.methods.hasProduct = function (productId) {
  return this.items.some(
    (item) => item.product.toString() === productId.toString()
  );
};

/**
 * Add product to wishlist
 */
wishlistSchema.methods.addProduct = function (productId) {
  if (!this.hasProduct(productId)) {
    this.items.push({
      product: productId,
      addedAt: new Date(),
    });
  }
  return this;
};

/**
 * Remove product from wishlist
 */
wishlistSchema.methods.removeProduct = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this;
};

/**
 * Get items count
 */
wishlistSchema.methods.getItemsCount = function () {
  return this.items.length;
};

/**
 * Clear all items
 */
wishlistSchema.methods.clearAll = function () {
  this.items = [];
  return this;
};

// ==================== STATIC METHODS ====================

/**
 * Find or create wishlist for user
 */
wishlistSchema.statics.findOrCreate = async function (userId) {
  let wishlist = await this.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await this.create({
      user: userId,
      items: [],
    });
  }

  return wishlist;
};

/**
 * Get wishlist with populated products
 */
wishlistSchema.statics.getWithProducts = async function (userId) {
  return await this.findOne({ user: userId })
    .populate({
      path: "items.product",
      select: "name description images price sizes inStock category rating",
    })
    .lean();
};

/**
 * Check if product is in user's wishlist
 */
wishlistSchema.statics.isProductInWishlist = async function (
  userId,
  productId
) {
  const wishlist = await this.findOne({
    user: userId,
    "items.product": productId,
  });

  return !!wishlist;
};

/**
 * Get wishlist items count for user
 */
wishlistSchema.statics.getItemsCount = async function (userId) {
  const wishlist = await this.findOne({ user: userId }).select("items");
  return wishlist ? wishlist.items.length : 0;
};

// ==================== MIDDLEWARE ====================

// Remove wishlist when user is deleted
wishlistSchema.pre("remove", async function (next) {
  // You can add cleanup logic here if needed
  next();
});

// ==================== VIRTUALS ====================

// Virtual for items count
wishlistSchema.virtual("itemsCount").get(function () {
  return this.items.length;
});

// Ensure virtuals are included in JSON
wishlistSchema.set("toJSON", { virtuals: true });
wishlistSchema.set("toObject", { virtuals: true });


export default mongoose.model("Wishlist", wishlistSchema);