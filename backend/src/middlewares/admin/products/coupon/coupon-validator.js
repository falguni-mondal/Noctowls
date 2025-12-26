// ==================== CREATE COUPON VALIDATION ====================
export const validateCreateCoupon = (req, res, next) => {
  const errors = [];
  const {
    code,
    description,
    discountType,
    discountValue,
    applyType,
    usageLimitType,
    perUserLimit,
    maxTotalUsage,
    startsAt,
    expiresAt,
    isActive,
    minPurchaseAmount,
    minItemsRequired,
    applicableCategories,
  } = req.body;

  // Validate code
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    errors.push({ field: "code", message: "Coupon code is required" });
  } else {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      errors.push({
        field: "code",
        message: "Coupon code must be between 3 and 20 characters",
      });
    }
    if (!/^[A-Z0-9]+$/.test(trimmedCode.toUpperCase())) {
      errors.push({
        field: "code",
        message: "Coupon code must contain only uppercase letters and numbers",
      });
    }
  }

  // Validate description
  if (!description || typeof description !== "string" || description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required" });
  } else {
    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 10 || trimmedDesc.length > 200) {
      errors.push({
        field: "description",
        message: "Description must be between 10 and 200 characters",
      });
    }
  }

  // Validate discountType
  if (!discountType) {
    errors.push({ field: "discountType", message: "Discount type is required" });
  } else if (!["fixed", "percentage"].includes(discountType)) {
    errors.push({
      field: "discountType",
      message: "Discount type must be either 'fixed' or 'percentage'",
    });
  }

  // Validate discountValue
  if (discountValue === undefined || discountValue === null || discountValue === "") {
    errors.push({ field: "discountValue", message: "Discount value is required" });
  } else {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      errors.push({
        field: "discountValue",
        message: "Discount value must be greater than 0",
      });
    } else {
      if (discountType === "percentage" && value > 100) {
        errors.push({
          field: "discountValue",
          message: "Percentage discount cannot exceed 100%",
        });
      }
      if (discountType === "fixed" && value > 10000) {
        errors.push({
          field: "discountValue",
          message: "Fixed discount cannot exceed ₹10,000",
        });
      }
    }
  }

  // Validate applyType
  if (!applyType) {
    errors.push({ field: "applyType", message: "Apply type is required" });
  } else if (!["each-product", "each-order"].includes(applyType)) {
    errors.push({
      field: "applyType",
      message: "Apply type must be either 'each-product' or 'each-order'",
    });
  }

  // Validate usageLimitType
  if (!usageLimitType) {
    errors.push({ field: "usageLimitType", message: "Usage limit type is required" });
  } else if (!["once-per-user", "multiple-per-user", "max-total"].includes(usageLimitType)) {
    errors.push({
      field: "usageLimitType",
      message: "Usage limit type must be 'once-per-user', 'multiple-per-user', or 'max-total'",
    });
  }

  // Validate perUserLimit (required for 'multiple-per-user')
  if (usageLimitType === "multiple-per-user") {
    if (perUserLimit === undefined || perUserLimit === null || perUserLimit === "") {
      errors.push({
        field: "perUserLimit",
        message: "Per-user limit is required when usage limit type is 'multiple-per-user'",
      });
    } else {
      const limit = parseInt(perUserLimit);
      if (isNaN(limit) || limit < 1) {
        errors.push({
          field: "perUserLimit",
          message: "Per-user limit must be at least 1",
        });
      } else if (limit > 1000) {
        errors.push({
          field: "perUserLimit",
          message: "Per-user limit cannot exceed 1000",
        });
      }
    }
  }

  // Validate maxTotalUsage (required for 'max-total')
  if (usageLimitType === "max-total") {
    if (maxTotalUsage === undefined || maxTotalUsage === null || maxTotalUsage === "") {
      errors.push({
        field: "maxTotalUsage",
        message: "Maximum total usage is required when usage limit type is 'max-total'",
      });
    } else {
      const usage = parseInt(maxTotalUsage);
      if (isNaN(usage) || usage < 1) {
        errors.push({
          field: "maxTotalUsage",
          message: "Maximum total usage must be at least 1",
        });
      } else if (usage > 100000) {
        errors.push({
          field: "maxTotalUsage",
          message: "Maximum total usage cannot exceed 100,000",
        });
      }
    }
  }

  // ✅ UPDATED: Validate startsAt (REMOVED "must be in future" check)
  if (!startsAt) {
    errors.push({ field: "startsAt", message: "Start date is required" });
  } else {
    const startDate = new Date(startsAt);
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: "startsAt",
        message: "Start date must be a valid date",
      });
    }
    // ✅ REMOVED: Check for "must be in the future"
    // This allows creating upcoming coupons with active status
  }

  // Validate expiresAt
  if (!expiresAt) {
    errors.push({ field: "expiresAt", message: "Expiry date is required" });
  } else {
    const expireDate = new Date(expiresAt);
    if (isNaN(expireDate.getTime())) {
      errors.push({
        field: "expiresAt",
        message: "Expiry date must be a valid date",
      });
    } else if (startsAt && expireDate <= new Date(startsAt)) {
      errors.push({
        field: "expiresAt",
        message: "Expiry date must be after start date",
      });
    }
  }

  // Validate isActive (optional)
  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.push({
      field: "isActive",
      message: "isActive must be a boolean",
    });
  }

  // Validate minPurchaseAmount (optional)
  if (minPurchaseAmount !== undefined && minPurchaseAmount !== null && minPurchaseAmount !== "") {
    const amount = parseFloat(minPurchaseAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push({
        field: "minPurchaseAmount",
        message: "Minimum purchase amount must be 0 or greater",
      });
    }
  }

  // Validate minItemsRequired (optional)
  if (minItemsRequired !== undefined && minItemsRequired !== null && minItemsRequired !== "") {
    const items = parseInt(minItemsRequired);
    if (isNaN(items) || items < 0) {
      errors.push({
        field: "minItemsRequired",
        message: "Minimum items required must be 0 or greater",
      });
    }
  }

  // Validate applicableCategories (optional)
  if (applicableCategories !== undefined && !Array.isArray(applicableCategories)) {
    errors.push({
      field: "applicableCategories",
      message: "Applicable categories must be an array",
    });
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== UPDATE COUPON VALIDATION ====================
export const validateUpdateCoupon = (req, res, next) => {
  const errors = [];
  const { id } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    applyType,
    usageLimitType,
    perUserLimit,
    maxTotalUsage,
    startsAt,
    expiresAt,
    isActive,
    minPurchaseAmount,
    minItemsRequired,
    applicableCategories,
    totalUsedCount,
    userUsageHistory,
    createdBy,
  } = req.body;

  // Validate ID
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push({ field: "id", message: "Invalid coupon ID" });
  }

  // Prevent updating forbidden fields
  if (totalUsedCount !== undefined) {
    errors.push({
      field: "totalUsedCount",
      message: "Cannot manually update total used count",
    });
  }

  if (userUsageHistory !== undefined) {
    errors.push({
      field: "userUsageHistory",
      message: "Cannot manually update user usage history",
    });
  }

  if (createdBy !== undefined) {
    errors.push({
      field: "createdBy",
      message: "Cannot update coupon creator",
    });
  }

  // Validate code (optional)
  if (code !== undefined) {
    if (typeof code !== "string" || code.trim().length === 0) {
      errors.push({ field: "code", message: "Coupon code cannot be empty" });
    } else {
      const trimmedCode = code.trim();
      if (trimmedCode.length < 3 || trimmedCode.length > 20) {
        errors.push({
          field: "code",
          message: "Coupon code must be between 3 and 20 characters",
        });
      }
      if (!/^[A-Z0-9]+$/.test(trimmedCode.toUpperCase())) {
        errors.push({
          field: "code",
          message: "Coupon code must contain only uppercase letters and numbers",
        });
      }
    }
  }

  // Validate description (optional)
  if (description !== undefined) {
    if (typeof description !== "string" || description.trim().length === 0) {
      errors.push({ field: "description", message: "Description cannot be empty" });
    } else {
      const trimmedDesc = description.trim();
      if (trimmedDesc.length < 10 || trimmedDesc.length > 200) {
        errors.push({
          field: "description",
          message: "Description must be between 10 and 200 characters",
        });
      }
    }
  }

  // Validate discountType (optional)
  if (discountType !== undefined && !["fixed", "percentage"].includes(discountType)) {
    errors.push({
      field: "discountType",
      message: "Discount type must be either 'fixed' or 'percentage'",
    });
  }

  // Validate discountValue (optional)
  if (discountValue !== undefined && discountValue !== null && discountValue !== "") {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      errors.push({
        field: "discountValue",
        message: "Discount value must be greater than 0",
      });
    } else {
      const typeToCheck = discountType || req.body.discountType;
      if (typeToCheck === "percentage" && value > 100) {
        errors.push({
          field: "discountValue",
          message: "Percentage discount cannot exceed 100%",
        });
      }
      if (typeToCheck === "fixed" && value > 10000) {
        errors.push({
          field: "discountValue",
          message: "Fixed discount cannot exceed ₹10,000",
        });
      }
    }
  }

  // Validate applyType (optional)
  if (applyType !== undefined && !["each-product", "each-order"].includes(applyType)) {
    errors.push({
      field: "applyType",
      message: "Apply type must be either 'each-product' or 'each-order'",
    });
  }

  // Validate usageLimitType (optional)
  if (usageLimitType !== undefined) {
    if (!["once-per-user", "multiple-per-user", "max-total"].includes(usageLimitType)) {
      errors.push({
        field: "usageLimitType",
        message: "Usage limit type must be 'once-per-user', 'multiple-per-user', or 'max-total'",
      });
    }
  }

  // Validate perUserLimit (conditional)
  if (perUserLimit !== undefined && perUserLimit !== null && perUserLimit !== "") {
    const limit = parseInt(perUserLimit);
    if (isNaN(limit) || limit < 1) {
      errors.push({
        field: "perUserLimit",
        message: "Per-user limit must be at least 1",
      });
    } else if (limit > 1000) {
      errors.push({
        field: "perUserLimit",
        message: "Per-user limit cannot exceed 1000",
      });
    }
  }

  // If updating to 'multiple-per-user', ensure perUserLimit is provided
  if (usageLimitType === "multiple-per-user") {
    if (perUserLimit === undefined || perUserLimit === null || perUserLimit === "") {
      errors.push({
        field: "perUserLimit",
        message: "Per-user limit is required when usage limit type is 'multiple-per-user'",
      });
    }
  }

  // Validate maxTotalUsage (conditional)
  if (maxTotalUsage !== undefined && maxTotalUsage !== null && maxTotalUsage !== "") {
    const usage = parseInt(maxTotalUsage);
    if (isNaN(usage) || usage < 1) {
      errors.push({
        field: "maxTotalUsage",
        message: "Maximum total usage must be at least 1",
      });
    } else if (usage > 100000) {
      errors.push({
        field: "maxTotalUsage",
        message: "Maximum total usage cannot exceed 100,000",
      });
    }
  }

  // If updating to 'max-total', ensure maxTotalUsage is provided
  if (usageLimitType === "max-total") {
    if (maxTotalUsage === undefined || maxTotalUsage === null || maxTotalUsage === "") {
      errors.push({
        field: "maxTotalUsage",
        message: "Maximum total usage is required when usage limit type is 'max-total'",
      });
    }
  }

  // Validate startsAt (optional) - NO "must be in future" check
  if (startsAt !== undefined) {
    const startDate = new Date(startsAt);
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: "startsAt",
        message: "Start date must be a valid date",
      });
    }
    // NO future date validation (allows updating to any valid date)
  }

  // Validate expiresAt (optional)
  if (expiresAt !== undefined) {
    const expireDate = new Date(expiresAt);
    if (isNaN(expireDate.getTime())) {
      errors.push({
        field: "expiresAt",
        message: "Expiry date must be a valid date",
      });
    } else if (startsAt && expireDate <= new Date(startsAt)) {
      errors.push({
        field: "expiresAt",
        message: "Expiry date must be after start date",
      });
    }
  }

  // Validate isActive (optional)
  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.push({
      field: "isActive",
      message: "isActive must be a boolean",
    });
  }

  // Validate minPurchaseAmount (optional)
  if (minPurchaseAmount !== undefined && minPurchaseAmount !== null && minPurchaseAmount !== "") {
    const amount = parseFloat(minPurchaseAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push({
        field: "minPurchaseAmount",
        message: "Minimum purchase amount must be 0 or greater",
      });
    }
  }

  // Validate minItemsRequired (optional)
  if (minItemsRequired !== undefined && minItemsRequired !== null && minItemsRequired !== "") {
    const items = parseInt(minItemsRequired);
    if (isNaN(items) || items < 0) {
      errors.push({
        field: "minItemsRequired",
        message: "Minimum items required must be 0 or greater",
      });
    }
  }

  // Validate applicableCategories (optional)
  if (applicableCategories !== undefined && !Array.isArray(applicableCategories)) {
    errors.push({
      field: "applicableCategories",
      message: "Applicable categories must be an array",
    });
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== COUPON ID VALIDATION ====================
export const validateCouponId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon ID",
      errors: [{ field: "id", message: "Coupon ID must be a valid MongoDB ObjectId" }],
    });
  }

  next();
};

// ==================== USER ID VALIDATION ====================
export const validateUserId = (req, res, next) => {
  const { userId } = req.params;

  if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
      errors: [{ field: "userId", message: "User ID must be a valid MongoDB ObjectId" }],
    });
  }

  next();
};

// ==================== COUPON CODE VALIDATION ====================
export const validateCouponCode = (req, res, next) => {
  const { code } = req.params;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon code",
      errors: [{ field: "code", message: "Coupon code is required" }],
    });
  }

  const trimmedCode = code.trim();
  
  if (trimmedCode.length < 3 || trimmedCode.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon code",
      errors: [{ field: "code", message: "Coupon code must be between 3 and 20 characters" }],
    });
  }

  if (!/^[A-Z0-9]+$/i.test(trimmedCode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon code",
      errors: [{ field: "code", message: "Coupon code must contain only letters and numbers" }],
    });
  }

  next();
};