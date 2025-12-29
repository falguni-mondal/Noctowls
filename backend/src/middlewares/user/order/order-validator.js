// middleware/orderValidation.js

// ==================== HELPER FUNCTIONS ====================

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (10 digits)
const phoneRegex = /^[0-9]{10}$/;

// Pincode validation (6 digits)
const pincodeRegex = /^[0-9]{6}$/;

// Order number format validation
const orderNumberRegex = /^ORD-\d{8}-\d{5}$/;

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

// ==================== CREATE ORDER VALIDATION ====================
export const validateCreateOrder = (req, res, next) => {
  const errors = [];
  const { shippingAddress, paymentMethod, couponCode, guestInfo } = req.body;

  // 1. Shipping Address Validation
  if (!shippingAddress || typeof shippingAddress !== "object") {
    errors.push({
      field: "shippingAddress",
      message: "Shipping address is required and must be an object",
    });
  } else {
    // Full Name
    if (!shippingAddress.fullName || typeof shippingAddress.fullName !== "string") {
      errors.push({
        field: "shippingAddress.fullName",
        message: "Full name is required",
      });
    } else {
      const trimmedName = shippingAddress.fullName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        errors.push({
          field: "shippingAddress.fullName",
          message: "Full name must be between 2 and 100 characters",
        });
      }
      shippingAddress.fullName = trimmedName;
    }

    // Phone
    if (!shippingAddress.phone || typeof shippingAddress.phone !== "string") {
      errors.push({
        field: "shippingAddress.phone",
        message: "Phone number is required",
      });
    } else if (!phoneRegex.test(shippingAddress.phone.trim())) {
      errors.push({
        field: "shippingAddress.phone",
        message: "Phone number must be 10 digits",
      });
    } else {
      shippingAddress.phone = shippingAddress.phone.trim();
    }

    // Address
    if (!shippingAddress.address || typeof shippingAddress.address !== "string") {
      errors.push({
        field: "shippingAddress.address",
        message: "Address is required",
      });
    } else {
      const trimmedAddress = shippingAddress.address.trim();
      if (trimmedAddress.length < 10 || trimmedAddress.length > 200) {
        errors.push({
          field: "shippingAddress.address",
          message: "Address must be between 10 and 200 characters",
        });
      }
      shippingAddress.address = trimmedAddress;
    }

    // Landmark (optional)
    if (shippingAddress.landmark) {
      if (typeof shippingAddress.landmark !== "string") {
        errors.push({
          field: "shippingAddress.landmark",
          message: "Landmark must be a string",
        });
      } else {
        const trimmedLandmark = shippingAddress.landmark.trim();
        if (trimmedLandmark.length > 100) {
          errors.push({
            field: "shippingAddress.landmark",
            message: "Landmark must not exceed 100 characters",
          });
        }
        shippingAddress.landmark = trimmedLandmark;
      }
    }

    // City
    if (!shippingAddress.city || typeof shippingAddress.city !== "string") {
      errors.push({
        field: "shippingAddress.city",
        message: "City is required",
      });
    } else {
      const trimmedCity = shippingAddress.city.trim();
      if (trimmedCity.length < 2 || trimmedCity.length > 50) {
        errors.push({
          field: "shippingAddress.city",
          message: "City must be between 2 and 50 characters",
        });
      }
      shippingAddress.city = trimmedCity;
    }

    // State
    if (!shippingAddress.state || typeof shippingAddress.state !== "string") {
      errors.push({
        field: "shippingAddress.state",
        message: "State is required",
      });
    } else {
      const trimmedState = shippingAddress.state.trim();
      if (trimmedState.length < 2 || trimmedState.length > 50) {
        errors.push({
          field: "shippingAddress.state",
          message: "State must be between 2 and 50 characters",
        });
      }
      shippingAddress.state = trimmedState;
    }

    // Pincode
    if (!shippingAddress.pincode || typeof shippingAddress.pincode !== "string") {
      errors.push({
        field: "shippingAddress.pincode",
        message: "Pincode is required",
      });
    } else if (!pincodeRegex.test(shippingAddress.pincode.trim())) {
      errors.push({
        field: "shippingAddress.pincode",
        message: "Pincode must be 6 digits",
      });
    } else {
      shippingAddress.pincode = shippingAddress.pincode.trim();
    }
  }

  // 2. Payment Method Validation
  if (!paymentMethod || typeof paymentMethod !== "string") {
    errors.push({
      field: "paymentMethod",
      message: "Payment method is required",
    });
  } else if (!["ONLINE", "COD"].includes(paymentMethod)) {
    errors.push({
      field: "paymentMethod",
      message: "Invalid payment method. Must be ONLINE or COD",
    });
  }

  // 3. Coupon Code Validation (optional)
  if (couponCode !== undefined && couponCode !== null) {
    if (typeof couponCode !== "string") {
      errors.push({
        field: "couponCode",
        message: "Coupon code must be a string",
      });
    } else {
      const trimmedCoupon = couponCode.trim().toUpperCase();
      if (trimmedCoupon.length < 3 || trimmedCoupon.length > 20) {
        errors.push({
          field: "couponCode",
          message: "Coupon code must be between 3 and 20 characters",
        });
      }
      req.body.couponCode = trimmedCoupon;
    }
  }

  // 4. Guest Info Validation (checked in controller, but basic validation here)
  if (guestInfo) {
    if (typeof guestInfo !== "object") {
      errors.push({
        field: "guestInfo",
        message: "Guest info must be an object",
      });
    } else {
      // Email
      if (guestInfo.email) {
        if (typeof guestInfo.email !== "string") {
          errors.push({
            field: "guestInfo.email",
            message: "Guest email must be a string",
          });
        } else if (!emailRegex.test(guestInfo.email.trim())) {
          errors.push({
            field: "guestInfo.email",
            message: "Invalid email format",
          });
        } else {
          guestInfo.email = guestInfo.email.trim().toLowerCase();
        }
      }

      // Name
      if (guestInfo.name) {
        if (typeof guestInfo.name !== "string") {
          errors.push({
            field: "guestInfo.name",
            message: "Guest name must be a string",
          });
        } else {
          const trimmedName = guestInfo.name.trim();
          if (trimmedName.length < 2 || trimmedName.length > 100) {
            errors.push({
              field: "guestInfo.name",
              message: "Guest name must be between 2 and 100 characters",
            });
          }
          guestInfo.name = trimmedName;
        }
      }
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

// ==================== VERIFY PAYMENT VALIDATION ====================
export const validateVerifyPayment = (req, res, next) => {
  const errors = [];
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
    req.body;

  // Razorpay Order ID
  if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
    errors.push({
      field: "razorpayOrderId",
      message: "Razorpay order ID is required and must be a string",
    });
  }

  // Razorpay Payment ID
  if (!razorpayPaymentId || typeof razorpayPaymentId !== "string") {
    errors.push({
      field: "razorpayPaymentId",
      message: "Razorpay payment ID is required and must be a string",
    });
  }

  // Razorpay Signature
  if (!razorpaySignature || typeof razorpaySignature !== "string") {
    errors.push({
      field: "razorpaySignature",
      message: "Razorpay signature is required and must be a string",
    });
  }

  // Order ID
  if (!orderId || typeof orderId !== "string") {
    errors.push({
      field: "orderId",
      message: "Order ID is required",
    });
  } else if (!isValidObjectId(orderId)) {
    errors.push({
      field: "orderId",
      message: "Invalid order ID format",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== ORDER ID VALIDATION ====================
export const validateOrderId = (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
  }

  if (!isValidObjectId(orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID format",
    });
  }

  next();
};

// ==================== CANCEL ORDER VALIDATION ====================
export const validateCancelOrder = (req, res, next) => {
  const errors = [];
  const { orderId } = req.params;
  const { reason } = req.body;

  // Validate Order ID
  if (!orderId) {
    errors.push({
      field: "orderId",
      message: "Order ID is required",
    });
  } else if (!isValidObjectId(orderId)) {
    errors.push({
      field: "orderId",
      message: "Invalid order ID format",
    });
  }

  // Validate Reason
  if (!reason || typeof reason !== "string") {
    errors.push({
      field: "reason",
      message: "Cancellation reason is required",
    });
  } else {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      errors.push({
        field: "reason",
        message: "Reason must be between 10 and 500 characters",
      });
    }
    req.body.reason = trimmedReason;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== COUPON CODE VALIDATION ====================
export const validateCouponCode = (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode || typeof couponCode !== "string") {
    return res.status(400).json({
      success: false,
      message: "Coupon code is required",
    });
  }

  const trimmedCoupon = couponCode.trim().toUpperCase();

  if (trimmedCoupon.length < 3 || trimmedCoupon.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Coupon code must be between 3 and 20 characters",
    });
  }

  req.body.couponCode = trimmedCoupon;
  next();
};

// ==================== GET ORDERS QUERY VALIDATION ====================
export const validateGetOrders = (req, res, next) => {
  const errors = [];
  const { page, limit, status } = req.query;

  // Validate Page
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({
        field: "page",
        message: "Page must be a positive integer",
      });
    } else {
      req.query.page = pageNum;
    }
  }

  // Validate Limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        field: "limit",
        message: "Limit must be between 1 and 100",
      });
    } else {
      req.query.limit = limitNum;
    }
  }

  // Validate Status
  if (status !== undefined) {
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out-for-delivery",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!validStatuses.includes(status)) {
      errors.push({
        field: "status",
        message: `Invalid order status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== GUEST ORDER TRACKING VALIDATION ====================
export const validateGuestOrderTracking = (req, res, next) => {
  const errors = [];
  const { orderNumber, email } = req.body;

  // Validate Order Number
  if (!orderNumber || typeof orderNumber !== "string") {
    errors.push({
      field: "orderNumber",
      message: "Order number is required",
    });
  } else {
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();
    if (!orderNumberRegex.test(trimmedOrderNumber)) {
      errors.push({
        field: "orderNumber",
        message: "Invalid order number format. Expected format: ORD-YYYYMMDD-XXXXX",
      });
    }
    req.body.orderNumber = trimmedOrderNumber;
  }

  // Validate Email
  if (!email || typeof email !== "string") {
    errors.push({
      field: "email",
      message: "Email is required",
    });
  } else {
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      errors.push({
        field: "email",
        message: "Invalid email format",
      });
    }
    req.body.email = trimmedEmail;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== GUEST ORDER CANCELLATION VALIDATION ====================
export const validateGuestOrderCancellation = (req, res, next) => {
  const errors = [];
  const { orderNumber, email, reason } = req.body;

  // Validate Order Number
  if (!orderNumber || typeof orderNumber !== "string") {
    errors.push({
      field: "orderNumber",
      message: "Order number is required",
    });
  } else {
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();
    if (!orderNumberRegex.test(trimmedOrderNumber)) {
      errors.push({
        field: "orderNumber",
        message: "Invalid order number format. Expected format: ORD-YYYYMMDD-XXXXX",
      });
    }
    req.body.orderNumber = trimmedOrderNumber;
  }

  // Validate Email
  if (!email || typeof email !== "string") {
    errors.push({
      field: "email",
      message: "Email is required",
    });
  } else {
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      errors.push({
        field: "email",
        message: "Invalid email format",
      });
    }
    req.body.email = trimmedEmail;
  }

  // Validate Reason
  if (!reason || typeof reason !== "string") {
    errors.push({
      field: "reason",
      message: "Cancellation reason is required",
    });
  } else {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      errors.push({
        field: "reason",
        message: "Reason must be between 10 and 500 characters",
      });
    }
    req.body.reason = trimmedReason;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};