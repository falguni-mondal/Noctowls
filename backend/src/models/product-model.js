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

// ---------- GST Mapping ----------
const GST_MAPPING = {
  deskmat: { hsn: "6307", gstRate: 12 },
  "anime-keychain": { hsn: "3926", gstRate: 18 },
  "anime-figure": { hsn: "9503", gstRate: 18 },
  "anime-katana": { hsn: "8306", gstRate: 18 },
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

    formattedOriginalPrice: String,

    // Price is now required from frontend
    numPrice: { type: Number, required: true, min: 0 },

    price: String, // Formatted price

    // Discount is now calculated, not required from frontend
    discount: { type: Number, default: 0, min: 0, max: 100 },

    stock: { type: Number, required: true, min: 0, default: 0 },

    skuCode: { type: String, required: true, trim: true },

    salesCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

sizeSchema.pre("validate", function () {
  if (this.originalPrice !== undefined) {
    // Format original price
    this.formattedOriginalPrice = formatPriceWithCommas(this.originalPrice);
  }

  // Calculate discount percentage from originalPrice and numPrice
  if (this.originalPrice !== undefined && this.numPrice !== undefined) {
    if (this.numPrice > this.originalPrice) {
      throw new Error(
        "Discounted price cannot be greater than original price"
      );
    }

    if (this.numPrice === this.originalPrice) {
      this.discount = 0;
    } else {
      const discountAmount = this.originalPrice - this.numPrice;
      this.discount = Math.round(
        (discountAmount / this.originalPrice) * 100
      );
    }

    // Format the price
    this.price = formatPriceWithCommas(this.numPrice);
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

    // ---------- GST & HSN Fields ----------
    hsnCode: {
      type: String,
      required: true,
      trim: true,
    },

    gstRate: {
      type: Number,
      required: true,
      min: 0,
    },

    images: {
      type: [simpleImageSchema],
      required: true,
      validate: {
        validator(images) {
          const rule = IMAGE_COUNTS[this.category];
          // Determine rule based on category if available, otherwise skip (handled by category validator)
          if (!rule) return true;
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
      enum: ["published", "archived"],
      default: "published",
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

// ---------- Auto GST & HSN Assignment ----------
// Note: Must be pre('validate') because fields are required
productSchema.pre("validate", function () {
  // If category is set and matches our mapping
  if (this.category && GST_MAPPING[this.category]) {
    const rules = GST_MAPPING[this.category];

    // Assign HSN Code if not manually provided
    if (!this.hsnCode) {
      this.hsnCode = rules.hsn;
    }

    // Assign GST Rate if not manually provided
    // Check for undefined or null to allow explicit 0 if needed in future
    if (this.gstRate === undefined || this.gstRate === null) {
      this.gstRate = rules.gstRate;
    }
  }
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
  if (this.sizes && Array.isArray(this.sizes)) {
    this.totalStock = this.sizes.reduce((t, s) => t + (s.stock || 0), 0);
    this.totalSales = this.sizes.reduce((t, s) => t + (s.salesCount || 0), 0);
  }
});

// ---------- Instance Method: Update Rating Cache ----------
productSchema.methods.updateRatingCache = async function () {
  const Review = mongoose.model("review");
  const stats = await Review.getProductRatingStats(this._id);
  this.rating = stats;
  return this.save();
};

export default mongoose.model("product", productSchema);