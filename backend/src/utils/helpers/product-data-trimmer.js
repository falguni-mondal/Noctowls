export const trimReview = (review) => {
  return {
    id: review._id,
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    images: review.images || [],
    createdAt: review.createdAt,
    
    // Optional: Show if verified purchase (if you add this feature later)
    // verifiedPurchase: review.verifiedPurchase || false,
  };
};


export const trimReviews = (reviews) => {
  return reviews.map(trimReview);
};

export const productForAdminList = (product) => {
  const hasMultipleSizes = product.sizes.length > 1;
  const stocks = hasMultipleSizes
    ? product.sizes.map((size) => ({
        size: size.value,
        count: size.stock,
      }))
    : undefined;

  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    category: product.category,

    image: product.images[0] || null,

    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    },

    originalPrice: product.sizes[0].formattedOriginalPrice,
    price: product.sizes[0].price,
    discount: Math.floor(
      ((product.sizes[0].originalPrice - product.sizes[0].numPrice) /
        product.sizes[0].originalPrice) *
        100
    ),

    inStock: product.totalStock > 0,
    totalStock: product.totalStock,

    ...(stocks && { stocks }),

    sales: product.totalSales || 0,
  };
}

export const productForAdminDetail = (product) => {
  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    status: product.status,
    inventory: product.inventory,
    
    // All images
    images: product.images || [],
    highlightImages: product.highlightImages || [],

    // All size variants with prices
    sizes: product.sizes?.map((size) => ({
      value: size.value,
      originalPrice: size.originalPrice,
      numPrice: size.numPrice,
      stock: size.stock,
      skuCode: size.skuCode,
    })) || [],
  };
};

export const productForList = (product) => {
  return {
    id: product._id,
    name: product.name,
    category: product.category,

    images: [product.images?.[0], product.images?.[1]],

    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    },

    originalPrice: product.sizes[0].formattedOriginalPrice,
    price: product.sizes[0].price,
    discount: Math.floor(
      ((product.sizes[0].originalPrice - product.sizes[0].numPrice) /
        product.sizes[0].originalPrice) *
        100
    ),

    inStock: product.totalStock > 0,

    sales: product.totalSales || 0,
  };
};

export const productForDetail = (product) => {
  return {
    id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    
    // All images
    images: product.images || [],
    highlightImages: product.highlightImages || [],
    
    // Complete rating data
    rating: {
      average: product.rating?.average || 0,
      count: product.rating?.count || 0,
    //   distribution: product.rating?.distribution || {
    //     1: 0,
    //     2: 0,
    //     3: 0,
    //     4: 0,
    //     5: 0,
    //   },
    },
    
    // All size variants with prices
    sizes: product.sizes?.map((size) => ({
      value: size.value,
      label: size.label,
      originalPrice: size.originalPrice,
      formattedOriginalPrice: size.formattedOriginalPrice,
      discount: size.discount,
      price: size.price,
      numPrice: size.numPrice,
      stock: size.stock,
      inStock: size.stock > 0,
    })) || [],
    
    inStock: product.totalStock > 0,

    salesCount: product.totalSales || 0,
  };
};


/**
 * Helper: Get lowest price from size variants
 * @param {Array} sizes - Array of size objects
 * @returns {Object} Price information
 */

// const getLowestPrice = (sizes) => {
//   if (!sizes || sizes.length === 0) {
//     return {
//       original: 0,
//       current: 0,
//       discount: 0,
//       formatted: "0",
//     };
//   }

  // Find size with lowest price
//   const lowestPriceSize = sizes.reduce((lowest, size) => {
//     return size.numPrice < lowest.numPrice ? size : lowest;
//   }, sizes[0]);

//   return {
//     original: lowestPriceSize.originalPrice,
//     current: lowestPriceSize.numPrice,
//     discount: lowestPriceSize.discount,
//     formatted: lowestPriceSize.price,
//   };
// };

/**
 * Helper: Calculate price range (if multiple sizes have different prices)
 * @param {Array} sizes - Array of size objects
 * @returns {Object} Price range
 */
// export const getPriceRange = (sizes) => {
//   if (!sizes || sizes.length === 0) {
//     return { min: 0, max: 0, hasRange: false };
//   }

//   const prices = sizes.map((s) => s.numPrice);
//   const min = Math.min(...prices);
//   const max = Math.max(...prices);

//   return {
//     min,
//     max,
//     hasRange: min !== max,
//   };
// };