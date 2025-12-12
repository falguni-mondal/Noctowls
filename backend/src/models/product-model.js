import mongoose from "mongoose";

const formatPriceWithCommas = (price) => {
  if (!price || isNaN(price)) return "0";
  return price.toLocaleString("en-IN");
};

const PRODUCT_CATEGORIES = [
  "deskmat",
  "anime-keychain",
  "anime-figure",
  "anime-katana",
];

const SIZE_VALUES_BY_PRODUCT = {
  deskmat: ["l", "xl", "xxl"],
  "anime-keychain": ["onesize"],
  "anime-figure": ["onesize"],
  "anime-katana": ["miniature", "kids-short", "full-length"],
};

const ALL_SIZE_VALUES = [
  ...new Set(Object.values(SIZE_VALUES_BY_PRODUCT).flat()),
];

const IMAGE_COUNTS = {
  deskmat: { images: 7, highlights: 6 },
  "anime-keychain": { images: 4, highlights: 3 },
  "anime-figure": { images: 4, highlights: 3 },
  "anime-katana": { images: 4, highlights: 3 },
};

// ---------- Image Schema ----------
const simpleImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    imageId: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

// ---------- Size Schema ----------
const sizeSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      enum: ALL_SIZE_VALUES,
      lowercase: true,
    },

    label: { type: String, default: "" },

    originalPrice: { type: Number, required: true, min: 0 },
    
    formattedOriginalPrice: String, // ✅ NEW: Formatted original price

    discount: { type: Number, default: 0, min: 0, max: 100 },

    numPrice: Number,
    price: String,

    stock: { type: Number, required: true, min: 0, default: 0 },

    skuCode: { type: String, required: true, trim: true },

    salesCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// ---------- Price Calculation Hook ----------
sizeSchema.pre("validate", function () {
  if (this.originalPrice !== undefined) {
    // Format original price
    this.formattedOriginalPrice = formatPriceWithCommas(this.originalPrice);
    
    // Calculate discounted price
    if (this.discount !== undefined) {
      const calculated =
        this.originalPrice - (this.originalPrice * this.discount) / 100;
      this.numPrice = Math.round(calculated);
      this.price = formatPriceWithCommas(this.numPrice);
    }
  }
});

// ---------- Rating Schema ----------
const ratingSchema = new mongoose.Schema(
  {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    distribution: {
      1: { type: Number, default: 0, min: 0 },
      2: { type: Number, default: 0, min: 0 },
      3: { type: Number, default: 0, min: 0 },
      4: { type: Number, default: 0, min: 0 },
      5: { type: Number, default: 0, min: 0 },
    },
  },
  { _id: false }
);

// ---------- Main Product Schema ----------
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 80,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },

    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORIES,
      lowercase: true,
    },

    images: {
      type: [simpleImageSchema],
      required: true,
      validate: {
        validator(images) {
          const rule = IMAGE_COUNTS[this.category];
          return images.length === rule.images;
        },
        message: "Invalid number of images for this product category.",
      },
    },

    highlightImages: {
      type: [simpleImageSchema],
      required: true,
      validate: {
        validator(images) {
          const rule = IMAGE_COUNTS[this.category];
          return images.length === rule.highlights;
        },
        message:
          "Invalid number of highlight images for this product category.",
      },
    },

    sizes: {
      type: [sizeSchema],
      required: true,
      validate: {
        validator(sizes) {
          const allowed = SIZE_VALUES_BY_PRODUCT[this.category];
          return sizes.every((s) => allowed.includes(s.value));
        },
        message: "Invalid sizes for this product category.",
      },
    },

    inventory: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    totalStock: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },

    slug: { type: String, unique: true, lowercase: true, sparse: true },

    // ---------- RATINGS (Cached/Denormalized) ----------
    rating: {
      type: ratingSchema,
      default: () => ({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Indexes ----------
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ "rating.average": -1, "rating.count": -1 });
productSchema.index({ status: 1, "rating.average": -1 });

// ---------- Virtual: Populate Reviews (Optional) ----------
productSchema.virtual("reviews", {
  ref: "review",
  localField: "_id",
  foreignField: "product",
});

// ---------- Auto Slug ----------
productSchema.pre("save", function () {
  if (this.isModified("name") && this.name) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    this.slug = `${base}-${this._id}`;
  }
});

// ---------- Auto Total Stock & Sales ----------
productSchema.pre("save", function () {
  this.totalStock = this.sizes.reduce((t, s) => t + (s.stock || 0), 0);
  this.totalSales = this.sizes.reduce((t, s) => t + (s.salesCount || 0), 0);
});

// ---------- Instance Method: Update Rating Cache ----------
productSchema.methods.updateRatingCache = async function () {
  const Review = mongoose.model("review");
  const stats = await Review.getProductRatingStats(this._id);
  this.rating = stats;
  return this.save();
};

export default mongoose.model("product", productSchema);