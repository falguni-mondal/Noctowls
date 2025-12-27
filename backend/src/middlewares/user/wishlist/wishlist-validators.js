import mongoose from "mongoose";

// ==================== HELPER FUNCTIONS ====================

// Validate MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// ==================== ADD TO WISHLIST VALIDATION ====================
export const validateAddToWishlist = (req, res, next) => {
  const { productId } = req.body;

  // Check if productId exists
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
      errors: [{ field: "productId", message: "Product ID is required" }],
    });
  }

  // Validate ObjectId format
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
      errors: [{ field: "productId", message: "Invalid product ID format" }],
    });
  }

  next();
};

// ==================== TOGGLE WISHLIST VALIDATION ====================
export const validateToggleWishlist = (req, res, next) => {
  const { productId } = req.body;

  // Check if productId exists
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
      errors: [{ field: "productId", message: "Product ID is required" }],
    });
  }

  // Validate ObjectId format
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
      errors: [{ field: "productId", message: "Invalid product ID format" }],
    });
  }

  next();
};

// ==================== REMOVE FROM WISHLIST VALIDATION ====================
export const validateRemoveFromWishlist = (req, res, next) => {
  const { productId } = req.params;

  // Check if productId exists
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
      errors: [{ field: "productId", message: "Product ID is required" }],
    });
  }

  // Validate ObjectId format
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
      errors: [{ field: "productId", message: "Invalid product ID format" }],
    });
  }

  next();
};

// ==================== CHECK PRODUCT IN WISHLIST VALIDATION ====================
export const validateCheckProduct = (req, res, next) => {
  const { productId } = req.params;

  // Check if productId exists
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
      errors: [{ field: "productId", message: "Product ID is required" }],
    });
  }

  // Validate ObjectId format
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
      errors: [{ field: "productId", message: "Invalid product ID format" }],
    });
  }

  next();
};

// ==================== MOVE TO CART VALIDATION ====================
export const validateMoveToCart = (req, res, next) => {
  const { productId, sizeValue, quantity } = req.body;
  const errors = [];

  // Validate productId
  if (!productId) {
    errors.push({ field: "productId", message: "Product ID is required" });
  } else if (!isValidObjectId(productId)) {
    errors.push({ field: "productId", message: "Invalid product ID format" });
  }

  // Validate sizeValue
  if (!sizeValue) {
    errors.push({ field: "sizeValue", message: "Size is required" });
  } else if (typeof sizeValue !== "string") {
    errors.push({ field: "sizeValue", message: "Size must be a string" });
  } else if (sizeValue.trim().length === 0) {
    errors.push({ field: "sizeValue", message: "Size cannot be empty" });
  }

  // Validate quantity (optional)
  if (quantity !== undefined && quantity !== null) {
    const qty = parseInt(quantity);
    
    if (isNaN(qty)) {
      errors.push({ field: "quantity", message: "Quantity must be a number" });
    } else if (qty < 1) {
      errors.push({ field: "quantity", message: "Quantity must be at least 1" });
    } else if (qty > 10) {
      errors.push({ field: "quantity", message: "Quantity cannot exceed 10" });
    }
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