import {
  cleanupUploadedImages,
  isValidImageKitAsset,
} from "../../../utils/imageUtils.js";

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isAddProductFormValid = async (req, res, next) => {
  // Parse pre-uploaded ImageKit metadata arrays early so we can roll them back if validation fails
  const mainImages = parseJsonArray(req.body?.mainImages);
  const highlightImages = parseJsonArray(req.body?.highlightImages);

  try {
    const errors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: [],
    };

    const { name, description, category, group, sizes, inventory } = req.body;

    // ==================== GENERAL VALIDATIONS ====================
    if (!name || typeof name !== "string") {
      errors.general.push("Product title is required");
    } else if (name.trim().length < 5) {
      errors.general.push("Product title must be at least 5 characters long");
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

    if (!group || typeof group !== "string") {
      errors.general.push("Product group is required");
    } else if (group.trim().length < 5) {
      errors.general.push("Product group must be at least 5 characters long");
    } else if (group.trim().length > 100) {
      errors.general.push("Product group cannot exceed 100 characters");
    }

    // ==================== SIZE VALIDATIONS ====================
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
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

    if (mainImages.length === 0) {
      errors.images.push("At least one product image is required");
    } else if (mainImages.length < expectedCounts.main) {
      errors.images.push(
        `${expectedCounts.main} product images are required for ${category} category`
      );
    } else if (mainImages.length > expectedCounts.main) {
      errors.images.push(
        `Maximum ${expectedCounts.main} product images allowed for ${category} category`
      );
    }

    mainImages.forEach((image, index) => {
      if (!isValidImageKitAsset(image)) {
        errors.images.push(
          `Product image ${index + 1} has invalid or missing ImageKit upload data`
        );
      }
    });

    if (highlightImages.length === 0) {
      errors.highlightImg.push("At least one highlight image is required");
    } else if (highlightImages.length < expectedCounts.highlight) {
      errors.highlightImg.push(
        `${expectedCounts.highlight} highlight images are required for ${category} category`
      );
    } else if (highlightImages.length > expectedCounts.highlight) {
      errors.highlightImg.push(
        `Maximum ${expectedCounts.highlight} highlight images allowed for ${category} category`
      );
    }

    highlightImages.forEach((image, index) => {
      if (!isValidImageKitAsset(image)) {
        errors.highlightImg.push(
          `Highlight image ${index + 1} has invalid or missing ImageKit upload data`
        );
      }
    });

    // ==================== OTHER VALIDATIONS ====================
    const validInventories = [
      "Sanmilan, Yuri Gagarin Path, Muchipara",
      "Shri Bhumi Park, Bidhannagar",
    ];
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
      // Automatically clean up pre-uploaded ImageKit images when validation fails
      await cleanupUploadedImages([...mainImages, ...highlightImages]);

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
      group: group.trim(),
      sizes: parsedSizes,
      inventory,
      mainImages,
      highlightImages,
    };

    next();
  } catch (error) {
    console.error("Validation middleware error:", error);
    await cleanupUploadedImages([...mainImages, ...highlightImages]);

    return res.status(500).json({
      success: false,
      message: "Internal server error during validation",
      error: error.message,
    });
  }
};

export default isAddProductFormValid;
