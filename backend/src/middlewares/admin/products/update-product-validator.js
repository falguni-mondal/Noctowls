const isUpdateProductFormValid = (req, res, next) => {
  try {
    const errors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: [],
    };

    const {
      name,
      description,
      category,
      sizes,
      inventory,
      status,
      existingMainImages,
      existingHighlightImages,
    } = req.body;

    const newMainImages = req.files?.["mainImages"] || [];
    const newHighlightImages = req.files?.["highlightImages"] || [];
    
    // Normalize indices to arrays
    const mainImagesIndices = req.body.mainImagesIndices
      ? Array.isArray(req.body.mainImagesIndices)
        ? req.body.mainImagesIndices
        : [req.body.mainImagesIndices]
      : [];
      
    const highlightImagesIndices = req.body.highlightImagesIndices
      ? Array.isArray(req.body.highlightImagesIndices)
        ? req.body.highlightImagesIndices
        : [req.body.highlightImagesIndices]
      : [];

    // ==================== GENERAL VALIDATIONS ====================
    if (!name || typeof name !== "string") {
      errors.general.push("Product title is required");
    } else if (name.trim().length < 10) {
      errors.general.push("Product title must be at least 10 characters long");
    } else if (name.trim().length > 200) {
      errors.general.push("Product title cannot exceed 200 characters");
    }

    if (!description || typeof description !== "string") {
      errors.general.push("Product description is required");
    } else if (description.trim().length < 20) {
      errors.general.push(
        "Product description must be at least 20 characters long"
      );
    } else if (description.trim().length > 2000) {
      errors.general.push("Product description cannot exceed 2000 characters");
    }

    const validCategories = [
      "deskmat",
      "anime-keychain",
      "anime-figure",
      "anime-katana",
    ];
    if (!category) {
      errors.general.push("Product category is required");
    } else if (!validCategories.includes(category)) {
      errors.general.push("Invalid product category");
    }

    const validStatuses = ["published", "archived"];
    if (!status) {
      errors.others.push("Product status is required");
    } else if (typeof status !== "string") {
      errors.others.push("Product status must be a string");
    } else if (!validStatuses.includes(status)) {
      errors.others.push(
        `Invalid product status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // ==================== SIZE VALIDATIONS ====================
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch (error) {
      errors.general.push("Invalid sizes data format");
      parsedSizes = [];
    }

    if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
      errors.general.push("At least one size variant is required");
    } else {
      const SIZE_VALUES_BY_PRODUCT = {
        deskmat: ["l", "xl", "xxl"],
        "anime-keychain": ["onesize"],
        "anime-figure": ["onesize"],
        "anime-katana": ["miniature", "kids-short", "full-length"],
      };

      const allowedSizes = SIZE_VALUES_BY_PRODUCT[category] || [];
      const requiredSizeCount = allowedSizes.length;

      if (parsedSizes.length !== requiredSizeCount) {
        errors.general.push(
          `Product must have exactly ${requiredSizeCount} size variant(s) for ${category} category`
        );
      }

      parsedSizes.forEach((size, index) => {
        const sizeErrors = [];

        if (!size.value) {
          sizeErrors.push("Size value is required");
        } else if (!allowedSizes.includes(size.value)) {
          sizeErrors.push(`Invalid size value for ${category} category`);
        }

        if (size.originalPrice === undefined || size.originalPrice === null) {
          sizeErrors.push("Original price is required");
        } else {
          const originalPrice = Number(size.originalPrice);
          if (isNaN(originalPrice)) {
            sizeErrors.push("Original price must be a valid number");
          } else if (originalPrice <= 0) {
            sizeErrors.push("Original price must be greater than 0");
          } else if (originalPrice > 1000000) {
            sizeErrors.push("Original price is too high");
          }
        }

        if (size.numPrice === undefined || size.numPrice === null) {
          sizeErrors.push("Discounted price is required");
        } else {
          const numPrice = Number(size.numPrice);
          const originalPrice = Number(size.originalPrice);

          if (isNaN(numPrice)) {
            sizeErrors.push("Discounted price must be a valid number");
          } else if (numPrice < 0) {
            sizeErrors.push("Discounted price cannot be negative");
          } else if (numPrice > 1000000) {
            sizeErrors.push("Discounted price is too high");
          } else if (!isNaN(originalPrice) && numPrice > originalPrice) {
            sizeErrors.push(
              "Discounted price cannot be greater than original price"
            );
          }
        }

        if (size.stock === undefined || size.stock === null) {
          sizeErrors.push("Stock is required");
        } else {
          const stock = Number(size.stock);
          if (isNaN(stock)) {
            sizeErrors.push("Stock must be a valid number");
          } else if (!Number.isInteger(stock)) {
            sizeErrors.push("Stock must be a whole number");
          } else if (stock < 0) {
            sizeErrors.push("Stock cannot be negative");
          } else if (stock > 100000) {
            sizeErrors.push("Stock quantity is too high");
          }
        }

        if (!size.skuCode || typeof size.skuCode !== "string") {
          sizeErrors.push("SKU code is required");
        } else if (size.skuCode.trim().length === 0) {
          sizeErrors.push("SKU code cannot be empty");
        } else if (size.skuCode.trim().length < 3) {
          sizeErrors.push("SKU code must be at least 3 characters");
        } else if (size.skuCode.trim().length > 50) {
          sizeErrors.push("SKU code cannot exceed 50 characters");
        } else if (!/^[a-zA-Z0-9-_]+$/.test(size.skuCode.trim())) {
          sizeErrors.push(
            "SKU code can only contain letters, numbers, hyphens, and underscores"
          );
        }

        if (sizeErrors.length > 0) {
          errors.size[size.value || `size_${index}`] = sizeErrors;
        }
      });

      const skuCodes = parsedSizes
        .map((s) => s.skuCode?.trim())
        .filter(Boolean);
      const duplicateSkus = skuCodes.filter(
        (sku, index) => skuCodes.indexOf(sku) !== index
      );
      if (duplicateSkus.length > 0) {
        errors.general.push(
          `Duplicate SKU codes found: ${[...new Set(duplicateSkus)].join(", ")}`
        );
      }
    }

    // ==================== IMAGE VALIDATIONS ====================
    const IMAGE_COUNTS_BY_CATEGORY = {
      deskmat: { main: 7, highlight: 6 },
      "anime-keychain": { main: 4, highlight: 3 },
      "anime-figure": { main: 4, highlight: 3 },
      "anime-katana": { main: 4, highlight: 3 },
    };

    const expectedCounts = IMAGE_COUNTS_BY_CATEGORY[category] || {
      main: 4,
      highlight: 3,
    };

    let parsedExistingMainImages = [];
    let parsedExistingHighlightImages = [];

    try {
      parsedExistingMainImages = existingMainImages ? JSON.parse(existingMainImages) : [];
      parsedExistingHighlightImages = existingHighlightImages ? JSON.parse(existingHighlightImages) : [];
    } catch (error) {
      errors.general.push("Invalid existing images data");
    }

    // ✅ NEW: Validate Indices Match
    if (newMainImages.length !== mainImagesIndices.length) {
      errors.images.push("Mismatch between uploaded main images and their target indices");
    }
    if (newHighlightImages.length !== highlightImagesIndices.length) {
      errors.highlightImg.push("Mismatch between uploaded highlight images and their target indices");
    }

    // ✅ NEW: Validate Indices Range
    mainImagesIndices.forEach(idx => {
      const parsedIdx = parseInt(idx);
      if (isNaN(parsedIdx) || parsedIdx < 0 || parsedIdx >= expectedCounts.main) {
        errors.images.push(`Invalid main image index: ${idx}. Must be between 0 and ${expectedCounts.main - 1}`);
      }
    });

    highlightImagesIndices.forEach(idx => {
      const parsedIdx = parseInt(idx);
      if (isNaN(parsedIdx) || parsedIdx < 0 || parsedIdx >= expectedCounts.highlight) {
        errors.highlightImg.push(`Invalid highlight image index: ${idx}. Must be between 0 and ${expectedCounts.highlight - 1}`);
      }
    });

    const totalMainImages = parsedExistingMainImages.length + newMainImages.length;
    if (totalMainImages !== expectedCounts.main) {
      errors.images.push(
        `Total of ${expectedCounts.main} product images required (currently ${totalMainImages})`
      );
    }

    const totalHighlightImages = parsedExistingHighlightImages.length + newHighlightImages.length;
    if (totalHighlightImages !== expectedCounts.highlight) {
      errors.highlightImg.push(
        `Total of ${expectedCounts.highlight} highlight images required (currently ${totalHighlightImages})`
      );
    }

    const allowedImageTypes = ["image/png", "image/webp", "image/jpeg"];
    const maxFileSize = 10 * 1024 * 1024;

    newMainImages.forEach((image, index) => {
      if (!allowedImageTypes.includes(image.mimetype)) {
        errors.images.push(`New product image ${index + 1} must be PNG, WEBP, or JPEG format`);
      }
      if (image.size > maxFileSize) {
        errors.images.push(`New product image ${index + 1} must be less than 10MB`);
      }
      if (!image.buffer || image.buffer.length === 0) {
        errors.images.push(`New product image ${index + 1} is empty or corrupted`);
      }
    });

    newHighlightImages.forEach((image, index) => {
      if (!allowedImageTypes.includes(image.mimetype)) {
        errors.highlightImg.push(`New highlight image ${index + 1} must be PNG, WEBP, or JPEG format`);
      }
      if (image.size > maxFileSize) {
        errors.highlightImg.push(`New highlight image ${index + 1} must be less than 10MB`);
      }
      if (!image.buffer || image.buffer.length === 0) {
        errors.highlightImg.push(`New highlight image ${index + 1} is empty or corrupted`);
      }
    });

    // ==================== OTHER VALIDATIONS ====================
    const validInventories = ["Sanmilan, Yuri Gagarin Path, Muchipara"];
    if (
      !inventory ||
      typeof inventory !== "string" ||
      inventory.trim().length === 0
    ) {
      errors.others.push("Inventory location is required");
    } else if (!validInventories.includes(inventory)) {
      errors.others.push("Invalid inventory location");
    }

    // ==================== CHECK FOR ERRORS ====================
    const hasErrors =
      errors.general.length > 0 ||
      Object.keys(errors.size).length > 0 ||
      errors.images.length > 0 ||
      errors.highlightImg.length > 0 ||
      errors.others.length > 0;

    if (hasErrors) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    req.product = {
      name: name.trim(),
      description: description.trim(),
      category,
      sizes: parsedSizes,
      inventory,
      status,
      newMainImages,
      newHighlightImages,
      mainImagesIndices,
      highlightImagesIndices,
      existingMainImages: parsedExistingMainImages,
      existingHighlightImages: parsedExistingHighlightImages,
    };

    next();
  } catch (error) {
    console.error("Update validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during validation",
      error: error.message,
    });
  }
};

export default isUpdateProductFormValid;