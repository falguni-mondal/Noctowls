
const isAddProductFormValid = (req, res, next) => {
  try {
    const errors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    };

    // Extract data from request
    const { name, description, category, sizes, inventory } = req.body;
    const mainImages = req.files?.['mainImages'] || [];
    const highlightImages = req.files?.['highlightImages'] || [];

    // ==================== GENERAL VALIDATIONS ====================

    // Validate product name
    if (!name || typeof name !== 'string') {
      errors.general.push('Product title is required');
    } else if (name.trim().length < 10) {
      errors.general.push('Product title must be at least 10 characters long');
    } else if (name.trim().length > 200) {
      errors.general.push('Product title cannot exceed 200 characters');
    }

    // Validate description
    if (!description || typeof description !== 'string') {
      errors.general.push('Product description is required');
    } else if (description.trim().length < 20) {
      errors.general.push('Product description must be at least 20 characters long');
    } else if (description.trim().length > 2000) {
      errors.general.push('Product description cannot exceed 2000 characters');
    }

    // Validate category
    const validCategories = ['deskmat', 'keychain', 'anime-figure', 'anime-katana'];
    if (!category) {
      errors.general.push('Product category is required');
    } else if (!validCategories.includes(category)) {
      errors.general.push('Invalid product category');
    }

    // ==================== SIZE VALIDATIONS ====================

    // Parse sizes if it's a JSON string
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    } catch (error) {
      errors.general.push('Invalid sizes data format');
      parsedSizes = [];
    }

    // Validate sizes array
    if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
      errors.general.push('At least one size variant is required');
    } else {
      // Define allowed sizes based on category
      const SIZE_VALUES_BY_PRODUCT = {
        deskmat: ['l', 'xl', 'xxl'],
        keychain: ['onesize'],
        'anime-figure': ['onesize'],
        'anime-katana': ['miniature', 'kids-short', 'full-length'],
      };

      const allowedSizes = SIZE_VALUES_BY_PRODUCT[category] || [];
      const requiredSizeCount = allowedSizes.length;

      // Check if all required sizes are present
      if (parsedSizes.length !== requiredSizeCount) {
        errors.general.push(`Product must have exactly ${requiredSizeCount} size variant(s) for ${category} category`);
      }

      // Validate each size
      parsedSizes.forEach((size, index) => {
        const sizeErrors = [];

        // Validate size value
        if (!size.value) {
          sizeErrors.push('Size value is required');
        } else if (!allowedSizes.includes(size.value)) {
          sizeErrors.push(`Invalid size value for ${category} category`);
        }

        // Validate original price
        if (size.originalPrice === undefined || size.originalPrice === null) {
          sizeErrors.push('Original price is required');
        } else {
          const originalPrice = Number(size.originalPrice);
          if (isNaN(originalPrice)) {
            sizeErrors.push('Original price must be a valid number');
          } else if (originalPrice <= 0) {
            sizeErrors.push('Original price must be greater than 0');
          } else if (originalPrice > 1000000) {
            sizeErrors.push('Original price is too high');
          }
        }

        // Validate discount
        if (size.discount === undefined || size.discount === null) {
          sizeErrors.push('Discount is required');
        } else {
          const discount = Number(size.discount);
          if (isNaN(discount)) {
            sizeErrors.push('Discount must be a valid number');
          } else if (discount < 0) {
            sizeErrors.push('Discount cannot be negative');
          } else if (discount > 100) {
            sizeErrors.push('Discount cannot exceed 100%');
          }
        }

        // Validate stock
        if (size.stock === undefined || size.stock === null) {
          sizeErrors.push('Stock is required');
        } else {
          const stock = Number(size.stock);
          if (isNaN(stock)) {
            sizeErrors.push('Stock must be a valid number');
          } else if (!Number.isInteger(stock)) {
            sizeErrors.push('Stock must be a whole number');
          } else if (stock <= 0) {
            sizeErrors.push('Stock must be greater than 0');
          } else if (stock > 100000) {
            sizeErrors.push('Stock quantity is too high');
          }
        }

        // Validate SKU code
        if (!size.skuCode || typeof size.skuCode !== 'string') {
          sizeErrors.push('SKU code is required');
        } else if (size.skuCode.trim().length === 0) {
          sizeErrors.push('SKU code cannot be empty');
        } else if (size.skuCode.trim().length < 3) {
          sizeErrors.push('SKU code must be at least 3 characters');
        } else if (size.skuCode.trim().length > 50) {
          sizeErrors.push('SKU code cannot exceed 50 characters');
        } else if (!/^[a-zA-Z0-9-_]+$/.test(size.skuCode.trim())) {
          sizeErrors.push('SKU code can only contain letters, numbers, hyphens, and underscores');
        }

        // Add size-specific errors to the errors object
        if (sizeErrors.length > 0) {
          errors.size[size.value || `size_${index}`] = sizeErrors;
        }
      });

      // Check for duplicate SKU codes
      const skuCodes = parsedSizes.map(s => s.skuCode?.trim()).filter(Boolean);
      const duplicateSkus = skuCodes.filter((sku, index) => skuCodes.indexOf(sku) !== index);
      if (duplicateSkus.length > 0) {
        errors.general.push(`Duplicate SKU codes found: ${[...new Set(duplicateSkus)].join(', ')}`);
      }
    }

    // ==================== IMAGE VALIDATIONS ====================

    // Define expected image counts based on category
    const IMAGE_COUNTS_BY_CATEGORY = {
      deskmat: { main: 7, highlight: 6 },
      keychain: { main: 4, highlight: 3 },
      'anime-figure': { main: 4, highlight: 3 },
      'anime-katana': { main: 4, highlight: 3 },
    };

    const expectedCounts = IMAGE_COUNTS_BY_CATEGORY[category] || { main: 4, highlight: 3 };
    const allowedImageTypes = ['image/png', 'image/webp', 'image/jpeg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // Validate main images count
    if (mainImages.length === 0) {
      errors.images.push('At least one product image is required');
    } else if (mainImages.length < expectedCounts.main) {
      errors.images.push(`${expectedCounts.main} product images are required for ${category} category`);
    } else if (mainImages.length > expectedCounts.main) {
      errors.images.push(`Maximum ${expectedCounts.main} product images allowed for ${category} category`);
    }

    // Validate each main image
    mainImages.forEach((image, index) => {
      // Check file type
      if (!allowedImageTypes.includes(image.mimetype)) {
        errors.images.push(`Product image ${index + 1} must be PNG, WEBP, or JPEG format`);
      }

      // Check file size
      if (image.size > maxFileSize) {
        errors.images.push(`Product image ${index + 1} must be less than 5MB`);
      }

      // Check if file buffer exists
      if (!image.buffer || image.buffer.length === 0) {
        errors.images.push(`Product image ${index + 1} is empty or corrupted`);
      }

      // Check filename
      if (!image.originalname || image.originalname.trim().length === 0) {
        errors.images.push(`Product image ${index + 1} has invalid filename`);
      }
    });

    // Validate highlight images count
    if (highlightImages.length === 0) {
      errors.highlightImg.push('At least one highlight image is required');
    } else if (highlightImages.length < expectedCounts.highlight) {
      errors.highlightImg.push(`${expectedCounts.highlight} highlight images are required for ${category} category`);
    } else if (highlightImages.length > expectedCounts.highlight) {
      errors.highlightImg.push(`Maximum ${expectedCounts.highlight} highlight images allowed for ${category} category`);
    }

    // Validate each highlight image
    highlightImages.forEach((image, index) => {
      // Check file type
      if (!allowedImageTypes.includes(image.mimetype)) {
        errors.highlightImg.push(`Highlight image ${index + 1} must be PNG, WEBP, or JPEG format`);
      }

      // Check file size
      if (image.size > maxFileSize) {
        errors.highlightImg.push(`Highlight image ${index + 1} must be less than 5MB`);
      }

      // Check if file buffer exists
      if (!image.buffer || image.buffer.length === 0) {
        errors.highlightImg.push(`Highlight image ${index + 1} is empty or corrupted`);
      }

      // Check filename
      if (!image.originalname || image.originalname.trim().length === 0) {
        errors.highlightImg.push(`Highlight image ${index + 1} has invalid filename`);
      }
    });

    // ==================== OTHER VALIDATIONS ====================

    // Validate inventory
    const validInventories = ['Sanmilan, Yuri Gagarin Path, Muchipara']; // Add more as needed
    if (!inventory || typeof inventory !== 'string') {
      errors.others.push('Inventory location is required');
    } else if (!validInventories.includes(inventory)) {
      errors.others.push('Invalid inventory location');
    }

    // ==================== CHECK FOR ERRORS ====================

    const hasGeneralErrors = errors.general.length > 0;
    const hasSizeErrors = Object.keys(errors.size).length > 0;
    const hasImageErrors = errors.images.length > 0;
    const hasHighlightErrors = errors.highlightImg.length > 0;
    const hasOtherErrors = errors.others.length > 0;

    const hasErrors = hasGeneralErrors || hasSizeErrors || hasImageErrors || hasHighlightErrors || hasOtherErrors;

    if (hasErrors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Attach validated and parsed data to request for controller use
    req.validatedData = {
      name: name.trim(),
      description: description.trim(),
      category,
      sizes: parsedSizes,
      inventory,
      mainImages,
      highlightImages
    };

    // All validations passed
    next();

  } catch (error) {
    console.error('Validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
      error: error.message
    });
  }
};

export default isAddProductFormValid;