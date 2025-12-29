import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Cart from "../../../models/cart-model.js";
import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==================== CREATE ORDER ====================
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user ID or device ID
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const { shippingAddress, paymentMethod, couponCode, guestInfo } = req.body;

    // Validate identifier
    if (!userId && !deviceId) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    // Validate required fields
    if (!shippingAddress || !paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    // Validate guest info for guest orders
    if (!userId && (!guestInfo || !guestInfo.email || !guestInfo.name)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Guest email and name are required",
      });
    }

    // Validate payment method
    if (!["ONLINE", "COD"].includes(paymentMethod)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // 1. Get cart (user or guest)
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 2. Validate cart items (stock, availability)
    const validation = await cart.validateCart();
    if (!validation.isValid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some items in cart are invalid",
        validation: validation.results,
      });
    }

    // 3. Calculate products subtotal
    const productsSubtotal = cart.summary.subtotal;

    // 4. Apply coupon discount (if provided)
    let couponDiscount = 0;
    let validatedCoupon = null;
    let couponDetails = {
      code: null,
      discountType: null,
      discountValue: 0,
      applyType: null,
      discountAmount: 0,
      minPurchaseAmount: 0,
      minItemsRequired: 0,
      applicableCategories: [],
    };

    if (couponCode) {
      try {
        // Find and validate coupon
        validatedCoupon = await Coupon.findValidCoupon(couponCode);

        if (!validatedCoupon) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: "Invalid or expired coupon",
          });
        }

        // Validate coupon for this cart (use userId OR deviceId, not both)
        validatedCoupon.validateForCart(
          cart,
          userId,
          userId ? null : deviceId
        );

        // Calculate discount based on applyType
        if (validatedCoupon.applyType === "each-product") {
          // Apply to each product
          if (validatedCoupon.discountType === "percentage") {
            couponDiscount =
              (productsSubtotal * validatedCoupon.discountValue) / 100;
          } else {
            // Fixed per product
            const eligibleItems = cart.items.filter(
              (item) => !item.isFreeGift
            );
            const totalQuantity = eligibleItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            couponDiscount = validatedCoupon.discountValue * totalQuantity;
          }
        } else {
          // Apply to entire order (each-order)
          if (validatedCoupon.discountType === "percentage") {
            couponDiscount =
              (productsSubtotal * validatedCoupon.discountValue) / 100;
          } else {
            // Fixed for entire order
            couponDiscount = validatedCoupon.discountValue;
          }
        }

        // Don't let discount exceed subtotal
        couponDiscount = Math.min(couponDiscount, productsSubtotal);
        couponDiscount = Math.round(couponDiscount * 100) / 100;

        couponDetails = {
          code: validatedCoupon.code,
          discountType: validatedCoupon.discountType,
          discountValue: validatedCoupon.discountValue,
          applyType: validatedCoupon.applyType,
          discountAmount: couponDiscount,
          minPurchaseAmount: validatedCoupon.minPurchaseAmount,
          minItemsRequired: validatedCoupon.minItemsRequired,
          applicableCategories: validatedCoupon.applicableCategories,
        };
      } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    // 5. Calculate subtotal after coupon
    const subtotalAfterCoupon = productsSubtotal - couponDiscount;

    // 6. Add COD fee if applicable (NOT affected by coupon)
    const codFee = paymentMethod === "COD" ? 50 : 0;

    // 7. Calculate final total
    const finalTotal = subtotalAfterCoupon + codFee;

    // 8. Create Razorpay order
    const razorpayAmount = paymentMethod === "ONLINE" ? finalTotal : codFee;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(razorpayAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId ? userId.toString() : null,
        deviceId: userId ? null : deviceId,
        paymentMethod: paymentMethod,
        customerType: userId ? "registered" : "guest",
      },
    });

    // 9. Prepare order items from cart
    const orderItems = cart.items
      .filter((item) => !item.isFreeGift)
      .map((item) => ({
        product: item.product._id,
        productName: item.name,
        productImage: item.image,
        category: item.category,
        quantity: item.quantity,
        size: {
          value: item.size.value,
          label: item.size.label,
          skuCode: item.size.skuCode,
        },
        originalPrice: item.originalPrice,
        discount: item.discount,
        price: item.price,
        itemTotal: item.price * item.quantity,
      }));

    // 10. Create order in database
    const order = await Order.create(
      [
        {
          user: userId || null,
          deviceId: userId ? null : deviceId,
          guestInfo: userId
            ? {}
            : {
                email: guestInfo.email.toLowerCase(),
                name: guestInfo.name,
                phone: shippingAddress.phone,
              },
          items: orderItems,
          freeGifts: {
            eligible: cart.freeGifts.eligible,
            highestTier: cart.freeGifts.highestTier,
            totalTiers: cart.freeGifts.totalTiers,
            gifts: cart.freeGifts.gifts,
          },
          shippingAddress: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            landmark: shippingAddress.landmark || "",
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
          },
          payment: {
            method: paymentMethod,
            status: "pending",
            razorpayOrderId: razorpayOrder.id,
            amountPaidOnline: razorpayAmount,
            amountPaidOnDelivery:
              paymentMethod === "COD" ? subtotalAfterCoupon : 0,
          },
          coupon: couponDetails,
          pricing: {
            productsSubtotal,
            couponDiscount,
            subtotalAfterCoupon,
            codFee,
            shippingCharges: 0,
            tax: 0,
            finalTotal,
          },
          orderStatus: "pending",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
      ],
      { session }
    );

    // 11. If coupon used, increment usage
    if (validatedCoupon) {
      await validatedCoupon.incrementUsageForUser(
        userId,
        userId ? null : deviceId
      );
    }

    // 12. Reserve stock (decrease product stock)
    for (const item of cart.items) {
      if (item.isFreeGift) continue;

      const product = await Product.findById(item.product._id).session(
        session
      );

      if (!product) {
        throw new Error(`Product ${item.name} not found`);
      }

      const sizeIndex = product.sizes.findIndex(
        (s) => s.value === item.size.value
      );

      if (sizeIndex !== -1) {
        if (product.sizes[sizeIndex].stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        product.sizes[sizeIndex].stock -= item.quantity;
        await product.save({ session });
      }
    }

    await session.commitTransaction();

    // 13. Return response with Razorpay details
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order[0]._id,
        orderNumber: order[0].orderNumber,
        status: order[0].orderStatus,
        customerType: order[0].customerType,
        items: order[0].items.length,
        freeGifts: order[0].freeGifts,
        pricing: order[0].pricing,
        payment: {
          method: order[0].payment.method,
          amountPaidOnline: order[0].payment.amountPaidOnline,
          amountPaidOnDelivery: order[0].payment.amountPaidOnDelivery,
        },
      },
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayAmount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      breakdown: {
        productsSubtotal,
        couponDiscount,
        subtotalAfterCoupon,
        codFee,
        finalTotal,
        payNow: razorpayAmount,
        payOnDelivery: paymentMethod === "COD" ? subtotalAfterCoupon : 0,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ==================== VERIFY PAYMENT ====================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

    // Get user ID or device ID
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
      });
    }

    // 1. Find order (support both user and guest)
    const query = { _id: orderId };
    if (userId) {
      query.user = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2. Verify Razorpay signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature !== expectedSign) {
      // Payment verification failed
      order.payment.status = "failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // 3. Payment verified successfully - update order
    await order.completePayment({
      razorpayPaymentId,
      razorpaySignature,
    });

    // 4. Clear cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });
    if (cart) {
      await cart.clearCart();
    }

    // 5. Generate invoice
    await order.generateInvoiceNumber();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        paymentStatus: order.payment.status,
        customerType: order.customerType,
        invoiceNumber: order.invoice.invoiceNumber,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// ==================== GET ORDERS ====================
export const getOrders = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId && !deviceId) {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    const orders = await Order.getOrders(
      { userId, deviceId },
      { page: parseInt(page), limit: parseInt(limit), status }
    );

    const query = {};
    if (userId) {
      query.user = userId;
    } else {
      query.deviceId = deviceId;
    }
    if (status) query.orderStatus = status;

    const totalOrders = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      orders,
      customerType: userId ? "registered" : "guest",
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ==================== GET ORDER BY ID ====================
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { orderId } = req.params;

    const query = { _id: orderId };
    if (userId) {
      query.user = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    const order = await Order.findOne(query).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ==================== CANCEL ORDER ====================
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a cancellation reason (minimum 10 characters)",
      });
    }

    const query = { _id: orderId };
    if (userId) {
      query.user = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
        currentStatus: order.orderStatus,
      });
    }

    // Cancel order
    await order.cancelOrder(userId ? "user" : "guest", reason);

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIndex = product.sizes.findIndex(
          (s) => s.value === item.size.value
        );
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock += item.quantity;
          await product.save();
        }
      }
    }

    // Decrement coupon usage
    if (order.coupon && order.coupon.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });

      if (coupon) {
        await coupon.decrementUsageForUser(userId, userId ? null : deviceId);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        refundStatus: order.cancellation.refundStatus,
        refundAmount: order.cancellation.refundAmount,
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// ==================== TRACK GUEST ORDER ====================
export const trackGuestOrder = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(400).json({
        success: false,
        message: "Order number and email are required",
      });
    }

    // Find guest order by order number and email
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      "guestInfo.email": email.toLowerCase().trim(),
      user: null, // Must be a guest order
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check your order number and email.",
      });
    }

    // Return order details (excluding sensitive info)
    return res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        items: order.items,
        freeGifts: order.freeGifts,
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        tracking: order.tracking,
        payment: {
          method: order.payment.method,
          status: order.payment.status,
        },
        statusTimestamps: order.statusTimestamps,
        canBeCancelled: order.canBeCancelled,
        cancellation: order.cancellation,
      },
    });
  } catch (error) {
    console.error("Error tracking guest order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track order",
      error: error.message,
    });
  }
};

// ==================== CANCEL GUEST ORDER ====================
export const cancelGuestOrder = async (req, res) => {
  try {
    const { orderNumber, email, reason } = req.body;
    const deviceId = req.cookies.device_id;

    if (!orderNumber || !email || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order number, email, and reason are required",
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a cancellation reason (minimum 10 characters)",
      });
    }

    // Find and verify guest order
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      "guestInfo.email": email.toLowerCase().trim(),
      user: null,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
        currentStatus: order.orderStatus,
      });
    }

    // Cancel order
    await order.cancelOrder("guest", reason);

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIndex = product.sizes.findIndex(
          (s) => s.value === item.size.value
        );
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock += item.quantity;
          await product.save();
        }
      }
    }

    // Decrement coupon usage
    if (order.coupon && order.coupon.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon && deviceId) {
        await coupon.decrementUsageForUser(null, deviceId);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        refundStatus: order.cancellation.refundStatus,
        refundAmount: order.cancellation.refundAmount,
      },
    });
  } catch (error) {
    console.error("Error cancelling guest order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// ==================== VALIDATE COUPON FOR CHECKOUT ====================
export const validateCouponForCheckout = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!userId && !deviceId) {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Find and validate coupon
    const coupon = await Coupon.findValidCoupon(couponCode);

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    // Validate coupon for this cart
    try {
      coupon.validateForCart(cart, userId, userId ? null : deviceId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Calculate discount
    const productsSubtotal = cart.summary.subtotal;
    let discount = 0;

    if (coupon.applyType === "each-product") {
      if (coupon.discountType === "percentage") {
        discount = (productsSubtotal * coupon.discountValue) / 100;
      } else {
        const eligibleItems = cart.items.filter((item) => !item.isFreeGift);
        const totalQuantity = eligibleItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        discount = coupon.discountValue * totalQuantity;
      }
    } else {
      if (coupon.discountType === "percentage") {
        discount = (productsSubtotal * coupon.discountValue) / 100;
      } else {
        discount = coupon.discountValue;
      }
    }

    discount = Math.min(discount, productsSubtotal);
    discount = Math.round(discount * 100) / 100;

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applyType: coupon.applyType,
        minOrderValue: coupon.minPurchaseAmount,
        minItemsRequired: coupon.minItemsRequired,
      },
      discount: {
        amount: discount,
        productsSubtotal,
        subtotalAfterDiscount: productsSubtotal - discount,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

// ==================== GET ORDER SUMMARY (for checkout page) ====================
export const getOrderSummary = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    if (!userId && !deviceId) {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate cart
    const validation = await cart.validateCart();

    return res.status(200).json({
      success: true,
      summary: {
        items: cart.items.map((item) => ({
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.name,
            image: item.image,
          },
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          itemTotal: item.itemTotal,
          isFreeGift: item.isFreeGift,
        })),
        freeGifts: cart.freeGifts,
        productsSubtotal: cart.summary.subtotal,
        totalItems: cart.summary.itemsCount,
        totalQuantity: cart.summary.totalQuantity,
      },
      validation: {
        isValid: validation.isValid,
        results: validation.results,
      },
      customerType: userId ? "registered" : "guest",
    });
  } catch (error) {
    console.error("Error fetching order summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order summary",
      error: error.message,
    });
  }
};

// ==================== DOWNLOAD INVOICE ====================
export const downloadInvoice = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { orderId } = req.params;

    const query = { _id: orderId };
    if (userId) {
      query.user = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication or device identification required",
      });
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only delivered orders can download invoice
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Invoice is only available for delivered orders",
      });
    }

    // Generate invoice if not already generated
    if (!order.invoice.invoiceNumber) {
      await order.generateInvoiceNumber();
    }

    // Here you would implement PDF generation
    // For now, returning invoice data
    return res.status(200).json({
      success: true,
      message: "Invoice data",
      invoice: {
        invoiceNumber: order.invoice.invoiceNumber,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        deliveryDate: order.statusTimestamps.delivered,
        items: order.items,
        freeGifts: order.freeGifts,
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        payment: order.payment,
        customerType: order.customerType,
        guestInfo: order.guestInfo,
      },
    });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download invoice",
      error: error.message,
    });
  }
};