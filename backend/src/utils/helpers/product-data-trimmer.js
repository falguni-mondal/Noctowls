const formatFallbackPrice = (num) => {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toLocaleString("en-IN");
};

const normalizeImageObj = (img, fallbackAlt = "") => {
  if (!img) return null;
  if (typeof img === "string") {
    return { url: img, imageId: "", alt: fallbackAlt };
  }
  return {
    ...img,
    alt: img.alt || fallbackAlt,
  };
};

const getProductTotalStock = (p) => {
  if (typeof p?.totalStock === "number") return p.totalStock;
  if (Array.isArray(p?.sizes)) {
    return p.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  }
  return typeof p?.stock === "number" ? p.stock : 0;
};

const isProductInStock = (p) => {
  if (typeof p?.inStock === "boolean") return p.inStock;
  return getProductTotalStock(p) > 0;
};

const getSalesVelocity = (p) => {
  return Number(p?.salesVelocity ?? p?.totalSales ?? p?.sales ?? 0);
};

/**
 * Deterministic product sorter:
 * 1. In-stock products ALWAYS come before out-of-stock products (P0 rule).
 * 2. Sorted by `salesVelocity` descending (`b.salesVelocity - a.salesVelocity`).
 * 3. Tie-breakers: custom admin `displayOrder` ascending, then `createdAt` descending, then `_id` descending.
 */
export const sortProductsList = (products = []) => {
  if (!Array.isArray(products)) return [];
  return [...products].sort((a, b) => {
    const aInStock = isProductInStock(a);
    const bInStock = isProductInStock(b);

    if (aInStock && !bInStock) return -1;
    if (!aInStock && bInStock) return 1;

    const aVelocity = getSalesVelocity(a);
    const bVelocity = getSalesVelocity(b);
    if (bVelocity !== aVelocity) {
      return bVelocity - aVelocity;
    }

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
  const seoAlt = `${product.name || "Noctowls"} Extended Gaming Deskmat 900x400mm`;
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = normalizeImageObj(images[0], seoAlt);

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

  const salesVelocity = product.totalSales || 0;

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
    images: images.map((img) => normalizeImageObj(img, seoAlt)).filter(Boolean),

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

    sales: salesVelocity,
    salesVelocity,
  };
};

export const productForAdminDetail = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const seoAlt = `${product.name || "Noctowls"} Extended Gaming Deskmat 900x400mm`;
  const images = Array.isArray(product.images)
    ? product.images.map((img) => normalizeImageObj(img, seoAlt)).filter(Boolean)
    : [];
  const highlightImages = Array.isArray(product.highlightImages)
    ? product.highlightImages
        .map((img) => normalizeImageObj(img, seoAlt))
        .filter(Boolean)
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
  const firstAvailableSize =
    sizes.find((s) => (Number(s.stock) || 0) > 0) || primarySize;
  const seoAlt = `${product.name || "Noctowls"} Extended Gaming Deskmat 900x400mm`;
  const images = Array.isArray(product.images)
    ? product.images.map((img) => normalizeImageObj(img, seoAlt)).filter(Boolean)
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

  const salesVelocity = product.totalSales || 0;

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

    primarySize: primarySize.value || "l",
    defaultSize: firstAvailableSize.value || primarySize.value || "l",

    sizes: sizes.map((size) => {
      const sOrig = Number(size.originalPrice) || 0;
      const sSell =
        size.numPrice !== undefined ? Number(size.numPrice) : sOrig;
      const sDisc =
        sOrig > 0 && sSell < sOrig
          ? Math.floor(((sOrig - sSell) / sOrig) * 100)
          : 0;
      return {
        value: size.value,
        label: size.label || String(size.value || "").toUpperCase(),
        skuCode: size.skuCode || "",
        originalPrice: sOrig,
        formattedOriginalPrice:
          size.formattedOriginalPrice || formatFallbackPrice(sOrig),
        discount: size.discount ?? sDisc,
        price: size.price || formatFallbackPrice(sSell),
        numPrice: sSell,
        stock: size.stock ?? 0,
        inStock: (size.stock ?? 0) > 0,
      };
    }),

    originalPrice:
      primarySize.formattedOriginalPrice || formatFallbackPrice(origPriceNum),
    price: primarySize.price || formatFallbackPrice(sellPriceNum),
    numPrice: sellPriceNum,
    discount: primarySize.discount ?? computedDiscount,

    inStock: computedTotalStock > 0,
    totalStock: computedTotalStock,

    sales: salesVelocity,
    salesVelocity,
  };
};

export const productForDetail = (product) => {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const seoAlt = `${product.name || "Noctowls"} Extended Gaming Deskmat 900x400mm`;
  const images = Array.isArray(product.images)
    ? product.images.map((img) => normalizeImageObj(img, seoAlt)).filter(Boolean)
    : [];
  const highlightImages = Array.isArray(product.highlightImages)
    ? product.highlightImages
        .map((img) => normalizeImageObj(img, seoAlt))
        .filter(Boolean)
    : [];

  const computedTotalStock =
    product.totalStock !== undefined
      ? product.totalStock
      : sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  const salesVelocity = product.totalSales || 0;

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
        skuCode: size.skuCode || "",
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
    totalStock: computedTotalStock,

    salesCount: salesVelocity,
    salesVelocity,
  };
};