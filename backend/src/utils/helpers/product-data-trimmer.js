const formatFallbackPrice = (num) => {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toLocaleString("en-IN");
};

const normalizeImageObj = (img) => {
  if (!img) return null;
  if (typeof img === "string") {
    return { url: img, imageId: "", alt: "" };
  }
  return img;
};

/**
 * Deterministic product sorter:
 * 1. Products with a numeric `displayOrder` come first, ordered ascending (0, 1, 2...).
 * 2. Products without `displayOrder` (or with equal `displayOrder`) are ordered Latest First
 *    (`createdAt` descending, then `_id` descending as a tie-breaker).
 */
export const sortProductsList = (products = []) => {
  if (!Array.isArray(products)) return [];
  return [...products].sort((a, b) => {
    const aHasOrder =
      typeof a?.displayOrder === "number" && !Number.isNaN(a.displayOrder);
    const bHasOrder =
      typeof b?.displayOrder === "number" && !Number.isNaN(b.displayOrder);

    if (aHasOrder && bHasOrder && a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    if (aHasOrder && !bHasOrder) return -1;
    if (!aHasOrder && bHasOrder) return 1;

    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA; // Latest first
    }

    const idA = String(a?._id || a?.id || "");
    const idB = String(b?._id || b?.id || "");
    return idB.localeCompare(idA); // Latest ObjectId first
  });
};

export const trimReview = (review) => {
  return {
    id: review._id,
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    images: review.images || [],
    createdAt: review.createdAt,
  };
};

export const trimReviews = (reviews = []) => {
  return Array.isArray(reviews) ? reviews.map(trimReview) : [];
};

export const productForAdminList = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const primarySize = sizes[0] || {};
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = normalizeImageObj(images[0]);

  const hasMultipleSizes = sizes.length > 1;
  const stocks = hasMultipleSizes
    ? sizes.map((size) => ({
        size: size.value,
        count: size.stock ?? 0,
      }))
    : undefined;

  const origPriceNum = Number(primarySize.originalPrice) || 0;
  const sellPriceNum =
    primarySize.numPrice !== undefined
      ? Number(primarySize.numPrice)
      : origPriceNum;

  const computedDiscount =
    origPriceNum > 0 && sellPriceNum < origPriceNum
      ? Math.floor(((origPriceNum - sellPriceNum) / origPriceNum) * 100)
      : 0;

  const computedTotalStock =
    product.totalStock !== undefined
      ? product.totalStock
      : sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  return {
    id: product._id,
    name: product.name || "Untitled Product",
    slug: product.slug,
    category: product.category || "deskmat",
    group: product.group || "General",
    type: product.type || product.category || "deskmat",
    status: product.status || "published",
    displayOrder:
      typeof product.displayOrder === "number" ? product.displayOrder : null,
    createdAt: product.createdAt,

    image: primaryImage,
    images: images.map(normalizeImageObj).filter(Boolean),

    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    },

    originalPrice:
      primarySize.formattedOriginalPrice || formatFallbackPrice(origPriceNum),
    price: primarySize.price || formatFallbackPrice(sellPriceNum),
    discount: primarySize.discount ?? computedDiscount,

    inStock: computedTotalStock > 0,
    totalStock: computedTotalStock,
    stock: computedTotalStock,

    ...(stocks && { stocks }),

    sales: product.totalSales || 0,
  };
};

export const productForAdminDetail = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const images = Array.isArray(product.images)
    ? product.images.map(normalizeImageObj).filter(Boolean)
    : [];
  const highlightImages = Array.isArray(product.highlightImages)
    ? product.highlightImages.map(normalizeImageObj).filter(Boolean)
    : [];

  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    group: product.group,
    type: product.type,
    status: product.status,
    inventory: product.inventory,
    displayOrder:
      typeof product.displayOrder === "number" ? product.displayOrder : null,
    createdAt: product.createdAt,

    images,
    highlightImages,

    sizes: sizes.map((size) => ({
      value: size.value,
      originalPrice: size.originalPrice ?? 0,
      numPrice: size.numPrice ?? size.originalPrice ?? 0,
      discount: size.discount ?? 0,
      stock: size.stock ?? 0,
      skuCode: size.skuCode || "",
    })),
  };
};

export const productForList = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const primarySize = sizes[0] || {};
  const images = Array.isArray(product.images)
    ? product.images.map(normalizeImageObj).filter(Boolean)
    : [];

  const origPriceNum = Number(primarySize.originalPrice) || 0;
  const sellPriceNum =
    primarySize.numPrice !== undefined
      ? Number(primarySize.numPrice)
      : origPriceNum;

  const computedDiscount =
    origPriceNum > 0 && sellPriceNum < origPriceNum
      ? Math.floor(((origPriceNum - sellPriceNum) / origPriceNum) * 100)
      : 0;

  const computedTotalStock =
    product.totalStock !== undefined
      ? product.totalStock
      : sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  return {
    id: product._id,
    name: product.name,
    category: product.category,
    group: product.group,
    type: product.type,
    displayOrder:
      typeof product.displayOrder === "number" ? product.displayOrder : null,
    createdAt: product.createdAt,

    images: [images[0], images[1]].filter(Boolean),

    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    },

    originalPrice:
      primarySize.formattedOriginalPrice || formatFallbackPrice(origPriceNum),
    price: primarySize.price || formatFallbackPrice(sellPriceNum),
    discount: primarySize.discount ?? computedDiscount,

    inStock: computedTotalStock > 0,

    sales: product.totalSales || 0,
  };
};

export const productForDetail = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const images = Array.isArray(product.images)
    ? product.images.map(normalizeImageObj).filter(Boolean)
    : [];
  const highlightImages = Array.isArray(product.highlightImages)
    ? product.highlightImages.map(normalizeImageObj).filter(Boolean)
    : [];

  const computedTotalStock =
    product.totalStock !== undefined
      ? product.totalStock
      : sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  return {
    id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    group: product.group,
    type: product.type,

    images,
    highlightImages,

    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    },

    sizes: sizes.map((size) => {
      const origPriceNum = Number(size.originalPrice) || 0;
      const sellPriceNum =
        size.numPrice !== undefined ? Number(size.numPrice) : origPriceNum;
      return {
        value: size.value,
        label: size.label,
        originalPrice: origPriceNum,
        formattedOriginalPrice:
          size.formattedOriginalPrice || formatFallbackPrice(origPriceNum),
        discount: size.discount ?? 0,
        price: size.price || formatFallbackPrice(sellPriceNum),
        numPrice: sellPriceNum,
        stock: size.stock ?? 0,
        inStock: (size.stock ?? 0) > 0,
      };
    }),

    inStock: computedTotalStock > 0,

    salesCount: product.totalSales || 0,
  };
};