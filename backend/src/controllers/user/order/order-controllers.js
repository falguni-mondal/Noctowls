import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Cart from "../../../models/cart-model.js";
import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";
import Address from "../../../models/address-model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: Retry logic for generating invoice to handle duplicate key errors
const generateInvoiceSafe = async (order) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await order.generateInvoiceNumber();
      return; // Success!
    } catch (error) {
      // If error is Duplicate Key (E11000) on invoiceNumber, retry
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern["invoice.invoiceNumber"]
      ) {
        attempts++;
        console.warn(
          `Invoice duplication detected. Retrying... (${attempts}/${maxAttempts})`
        );
        // Wait a random short time (50-200ms) to let the other process finish
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 150 + 50)
        );
      } else {
        throw error; // Throw other errors immediately
      }
    }
  }
  throw new Error(
    "Failed to generate unique invoice number after multiple attempts"
  );
};

// HELPER FUNCTION for Order Number
async function generateUniqueOrderNumber(session) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

  const lastOrder = await Order.findOne({
    orderNumber: new RegExp(`^ORD-${dateStr}`),
  })
    .sort({ orderNumber: -1 })
    .session(session);

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split("-");
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }

  const orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(5, "0")}`;
  return orderNumber;
}

// ==================== CREATE ORDER ====================
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user;
    // Check cookie for device ID (Guest Persistence)
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

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate cart items
    const validation = await cart.validateCart();
    if (!validation.isValid) {
      await session.abortTransaction();
      const invalidItems = validation.results.filter((r) => !r.isValid);
      return res.status(400).json({
        success: false,
        message: "Some items in cart are invalid or out of stock",
        invalidItems: invalidItems.map((item) => ({
          name: item.productName,
          reason: item.reason,
          action: item.action,
          availableStock: item.availableStock,
        })),
      });
    }

    // Calculate products subtotal
    const rawSubtotal = cart.items
      .filter((item) => !item.isFreeGift)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const productsSubtotal = Math.round(rawSubtotal);

    // SECURE COUPON VALIDATION (Active DB Check)
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

    const activeCouponCode =
      couponCode || (cart.coupon.isApplied ? cart.coupon.code : null);

    if (activeCouponCode) {
      try {
        validatedCoupon = await Coupon.findOne({
          code: activeCouponCode.toUpperCase(),
        }).session(session);

        if (!validatedCoupon) {
          if (couponCode) throw new Error("Invalid coupon code");
        } else {
          validatedCoupon.validateForCart(
            cart,
            userId,
            userId ? null : deviceId
          );

          // Re-Apply logic (simplified for calculation)
          let rawDiscount = 0;
          const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);

          if (validatedCoupon.applyType === "each-product") {
            if (validatedCoupon.discountType === "fixed") {
              const totalQuantity = nonGiftItems.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              rawDiscount = validatedCoupon.discountValue * totalQuantity;
            } else {
              nonGiftItems.forEach((item) => {
                const itemTotal = item.price * item.quantity;
                rawDiscount +=
                  (itemTotal * validatedCoupon.discountValue) / 100;
              });
            }
          } else {
            if (validatedCoupon.discountType === "fixed") {
              rawDiscount = validatedCoupon.discountValue;
            } else {
              rawDiscount =
                (productsSubtotal * validatedCoupon.discountValue) / 100;
            }
          }

          couponDiscount = Math.min(rawDiscount, productsSubtotal);
          couponDiscount = Math.round(couponDiscount);

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
        }
      } catch (error) {
        if (couponCode) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: error.message || "Coupon is no longer valid",
          });
        }
      }
    }

    // Calculate Subtotal After Coupon
    const subtotalAfterCoupon = Math.round(productsSubtotal - couponDiscount);

    // Set COD Fee to 49 (was 50)
    const codFee = paymentMethod === "COD" ? 49 : 0;

    // --- GST LOGIC START ---
    const SELLER_STATE = "West Bengal";
    const customerState = shippingAddress.state.trim();
    const normalize = (s) => s?.toLowerCase().replace(/\s+/g, "");
    const isSameState = normalize(customerState) === normalize(SELLER_STATE);

    // Prepare Items with Reverse GST Calculation
    const orderItems = cart.items
      .filter((item) => !item.isFreeGift)
      .map((item) => {
        const inclusivePrice = item.price; // This is the price user sees (including GST)
        const gstRate = item.product.gstRate || 0;
        const hsnCode = item.product.hsnCode || "N/A";

        // Reverse Math: Extract Base Price from Inclusive Price
        const unitBasePrice = inclusivePrice / (1 + gstRate / 100);
        const unitGstAmount = inclusivePrice - unitBasePrice;

        const totalItemBasePrice = unitBasePrice * item.quantity;
        const totalItemGstAmount = unitGstAmount * item.quantity;

        let taxType, cgstAmount, sgstAmount, igstAmount;

        if (isSameState) {
          taxType = "cgst_sgst";
          cgstAmount = totalItemGstAmount / 2;
          sgstAmount = totalItemGstAmount / 2;
          igstAmount = 0;
        } else {
          taxType = "igst";
          cgstAmount = 0;
          sgstAmount = 0;
          igstAmount = totalItemGstAmount;
        }

        return {
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
          price: unitBasePrice, // Store base price in 'price' field
          itemTotal: totalItemBasePrice, // Store base total
          // New GST fields snapshot
          gstRate,
          hsnCode,
          gstAmount: totalItemGstAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          taxType,
          priceWithGST: inclusivePrice * item.quantity,
        };
      });

    // Compute Order-Level GST Totals from snapshot data
    const totalGST = orderItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalCGST = orderItems.reduce(
      (sum, item) => sum + item.cgstAmount,
      0
    );
    const totalSGST = orderItems.reduce(
      (sum, item) => sum + item.sgstAmount,
      0
    );
    const totalIGST = orderItems.reduce(
      (sum, item) => sum + item.igstAmount,
      0
    );

    // productsSubtotal is inclusive, so subTotalTaxable is after extracting tax
    // Formula: subtotalAfterCoupon (Inclusive) / (1 + AverageRate) - simpler to sum base prices
    const subTotalTaxable = orderItems.reduce(
      (sum, item) => sum + item.itemTotal,
      0
    );
    // --- GST LOGIC END ---

    // Calculate Final Total
    // Since productsSubtotal is inclusive, finalTotal = productsSubtotal - discount + codFee
    const finalTotal = Math.round(subtotalAfterCoupon + codFee);

    // Determine Online Payment Amount
    const amountToPayOnline = Math.round(
      paymentMethod === "ONLINE" ? finalTotal : codFee
    );

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountToPayOnline * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId ? userId.toString() : null,
          deviceId: userId ? null : deviceId,
          paymentMethod: paymentMethod,
          customerType: userId ? "registered" : "guest",
        },
      });
    } catch (razorpayError) {
      await session.abortTransaction();
      console.error("Razorpay order creation failed:", razorpayError);
      return res.status(500).json({
        success: false,
        message: "Failed to initialize payment.",
        error: razorpayError.message,
      });
    }

    // Sync Guest Info
    const finalGuestInfo = userId
      ? {}
      : {
          email: guestInfo.email.toLowerCase(),
          name: guestInfo.name,
          phone: shippingAddress.phone,
        };

    // Generate Order Number & Save Address
    const orderNumber = await generateUniqueOrderNumber(session);

    if (userId && shippingAddress) {
      try {
        const existingAddress = await Address.findOne({
          user: userId,
          fullName: {
            $regex: new RegExp(`^${shippingAddress.fullName.trim()}$`, "i"),
          },
          address: {
            $regex: new RegExp(`^${shippingAddress.address.trim()}$`, "i"),
          },
          city: {
            $regex: new RegExp(`^${shippingAddress.city.trim()}$`, "i"),
          },
          pincode: shippingAddress.pincode.trim(),
        });

        if (!existingAddress) {
          const addressCount = await Address.countDocuments({ user: userId });
          if (addressCount < 10) {
            await Address.create({
              user: userId,
              fullName: shippingAddress.fullName,
              phone: shippingAddress.phone,
              address: shippingAddress.address,
              landmark: shippingAddress.landmark || "",
              city: shippingAddress.city,
              state: shippingAddress.state,
              pincode: shippingAddress.pincode,
              addressType: "home",
              isDefault: addressCount === 0,
            });
          }
        }
      } catch (addressError) {
        console.warn("⚠️ Failed to save address:", addressError.message);
      }
    }

    // Create Order Document
    const order = await Order.create(
      [
        {
          user: userId || null,
          deviceId: userId ? null : deviceId,
          orderNumber: orderNumber,
          guestInfo: finalGuestInfo,
          items: orderItems,
          freeGifts: cart.freeGifts,
          shippingAddress,
          payment: {
            method: paymentMethod,
            status: "pending",
            razorpayOrderId: razorpayOrder.id,
            amountPaidOnline: amountToPayOnline,
            amountPaidOnDelivery:
              paymentMethod === "COD" ? finalTotal - amountToPayOnline : 0,
          },
          coupon: couponDetails,
          pricing: {
            productsSubtotal: productsSubtotal,
            couponDiscount,
            subtotalAfterCoupon: subtotalAfterCoupon,
            codFee,
            shippingCharges: 0,
            tax: totalGST,
            finalTotal,
          },
          totalGST,
          totalCGST,
          totalSGST,
          totalIGST,
          subTotal: subTotalTaxable,
          grandTotal: finalTotal,
          orderStatus: "pending",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
      ],
      { session }
    );

    // Atomic Inventory Update
    for (const item of cart.items) {
      if (item.isFreeGift) continue;

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          sizes: {
            $elemMatch: {
              value: item.size.value,
              stock: { $gte: item.quantity }, // Guard
            },
          },
        },
        {
          $inc: {
            "sizes.$.stock": -item.quantity,
            "sizes.$.salesCount": item.quantity,
            totalStock: -item.quantity,
            totalSales: item.quantity,
          },
        },
        { session, new: true }
      );

      if (!updatedProduct) {
        throw new Error(
          `Insufficient stock for ${item.name} (Size: ${item.size.label})`
        );
      }
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order[0]._id,
        orderNumber: order[0].orderNumber,
        status: order[0].orderStatus,
        payment: order[0].payment,
      },
      razorpay: {
        orderId: razorpayOrder.id,
        amount: amountToPayOnline,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      breakdown: {
        productsSubtotal,
        couponDiscount,
        subtotalAfterCoupon,
        codFee,
        totalGST,
        finalTotal,
        payNow: amountToPayOnline,
        payOnDelivery:
          paymentMethod === "COD" ? finalTotal - amountToPayOnline : 0,
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

// ==================== HANDLE RAZORPAY WEBHOOK ====================
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Use req.rawBody (buffer) instead of JSON.stringify
    if (!req.rawBody) {
      console.error("⚠️ Raw body not available. Check express.json setup.");
      return res.status(400).json({ message: "Server misconfiguration" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody) // Use the raw buffer
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠️ Invalid Razorpay Webhook Signature");
      // Security: Return 400 for invalid signature logs
      return res.status(400).json({ message: "Invalid signature" });
    }

    const { event, payload } = req.body;

    // We only care about successful payments
    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      // Find the order
      const order = await Order.findOne({
        "payment.razorpayOrderId": razorpayOrderId,
      });

      if (!order) {
        console.warn(`Webhook received for unknown order: ${razorpayOrderId}`);
        return res.status(404).json({ message: "Order not found" });
      }

      // Idempotency Check
      if (order.payment.status === "completed") {
        return res.status(200).json({ status: "already_processed" });
      }

      // Security Check:
      // Compare against 'amountPaidOnline' (which now includes totalGST from createOrder)
      const expectedAmountPaise = Math.round(
        order.payment.amountPaidOnline * 100
      );

      if (payment.amount !== expectedAmountPaise) {
        console.error(
          `🚨 Webhook Amount Mismatch! Order: ${order.orderNumber}. Expected: ${expectedAmountPaise}, Received: ${payment.amount}`
        );
        order.payment.status = "failed";
        await order.save();
        return res.status(400).json({ message: "Amount mismatch" });
      }

      // Complete Payment
      await order.completePayment({
        razorpayPaymentId,
        razorpaySignature: "webhook_verified_signature",
      });

      // Increment Coupon Usage
      if (order.coupon && order.coupon.code) {
        const coupon = await Coupon.findOne({ code: order.coupon.code });
        if (coupon) {
          await coupon.incrementUsageForUser(
            order.user,
            order.user ? null : order.deviceId
          );
        }
      }

      // Clear Cart
      const cart = await Cart.getOrCreateCart({
        userId: order.user,
        deviceId: order.deviceId,
      });

      if (cart) {
        await cart.clearCart();
      }

      // Generate Invoice
      if (!order.invoice || !order.invoice.invoiceNumber) {
        await generateInvoiceSafe(order);
      }

      console.log(`Webhook verified payment for Order: ${order.orderNumber}`);
      return res.status(200).json({ status: "ok" });
    }

    // Acknowledge other events
    return res.status(200).json({ status: "ignored" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

// ==================== VERIFY PAYMENT (SECURED) ====================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

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

    // Find Order
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

    // Verify Signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature !== expectedSign) {
      order.payment.status = "failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // SECURE AMOUNT CHECK
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
      const expectedAmountPaise = Math.round(
        order.payment.amountPaidOnline * 100
      );

      if (paymentDetails.amount !== expectedAmountPaise) {
        console.error(
          `🚨 Payment Tampering Detected! Order: ${order.orderNumber}. Expected: ${expectedAmountPaise}, Paid: ${paymentDetails.amount}`
        );
        order.payment.status = "failed";
        await order.save();
        return res.status(400).json({
          success: false,
          message: "Payment verification failed. Amount mismatch.",
        });
      }

      if (paymentDetails.status !== "captured") {
        return res.status(400).json({
          success: false,
          message: `Payment is not captured. Status: ${paymentDetails.status}`,
        });
      }
    } catch (gatewayError) {
      console.error("Razorpay Gateway Error:", gatewayError);
      return res.status(500).json({
        success: false,
        message: "Failed to validate payment with gateway.",
      });
    }

    // Complete Payment
    await order.completePayment({ razorpayPaymentId, razorpaySignature });

    // Increment Coupon Usage
    if (order.coupon && order.coupon.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon) {
        await coupon.incrementUsageForUser(userId, userId ? null : deviceId);
      }
    }

    // Clear Cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });
    if (cart) await cart.clearCart();

    // Generate Invoice
    if (!order.invoice || !order.invoice.invoiceNumber) {
      await generateInvoiceSafe(order);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
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
        message: "Please provide a cancellation reason (minimum 10 characters)",
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
    const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(
      userId ? "user" : "guest",
      reason
    );

    // Restore product stock
    for (const item of cancelledOrder.items) {
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
    if (couponToRevert) {
      const coupon = await Coupon.findOne({ code: couponToRevert.code });
      if (coupon) {
        await coupon.decrementUsageForUser(
          couponToRevert.userId,
          couponToRevert.deviceId
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderId: cancelledOrder._id,
        orderNumber: cancelledOrder.orderNumber,
        status: cancelledOrder.orderStatus,
        refundStatus: cancelledOrder.cancellation.refundStatus,
        refundAmount: cancelledOrder.cancellation.refundAmount,
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

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      "guestInfo.email": email.toLowerCase().trim(),
      user: null,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check your order number and email.",
      });
    }

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
        message: "Please provide a cancellation reason (minimum 10 characters)",
      });
    }

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

    const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(
      "guest",
      reason
    );

    // Restore product stock
    for (const item of cancelledOrder.items) {
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
    if (couponToRevert) {
      const coupon = await Coupon.findOne({ code: couponToRevert.code });
      if (coupon) {
        await coupon.decrementUsageForUser(
          couponToRevert.userId,
          couponToRevert.deviceId
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderNumber: cancelledOrder.orderNumber,
        status: cancelledOrder.orderStatus,
        refundStatus: cancelledOrder.cancellation.refundStatus,
        refundAmount: cancelledOrder.cancellation.refundAmount,
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

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const coupon = await Coupon.findValidCoupon(couponCode);

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    try {
      coupon.validateForCart(cart, userId, userId ? null : deviceId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const productsSubtotal = Math.round(cart.summary.subtotal);

    // Apply coupon to temporary cart instance to get discount
    const tempCart = { ...cart.toObject() };
    tempCart.coupon = {
      code: coupon.code,
      isApplied: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      applyType: coupon.applyType,
    };

    // Calculate discount using cart's helper function
    let discount = 0;
    const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);

    if (coupon.applyType === "each-product") {
      if (coupon.discountType === "percentage") {
        discount = (productsSubtotal * coupon.discountValue) / 100;
      } else {
        const totalQuantity = nonGiftItems.reduce(
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

    // Using Math.round() ensures we store/display a whole number
    discount = Math.round(Math.min(discount, productsSubtotal));

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
        subtotalAfterDiscount: Math.round(productsSubtotal - discount),
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

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    await cart.populate("items.product");

    const validation = await cart.validateCart();

    return res.status(200).json({
      success: true,
      summary: {
        items: cart.items.map((item) => ({
          _id: item._id,
          product: {
            _id: item.product?._id,
            name: item.name,
            image: item.image,
          },
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          itemTotal: Math.round(item.itemTotal),
          isFreeGift: item.isFreeGift,
        })),
        freeGifts: cart.freeGifts,
        productsSubtotal: Math.round(cart.summary.subtotal),
        totalItems: cart.summary.itemsCount,
        totalQuantity: cart.summary.totalQuantity,
        couponDiscount: Math.round(cart.summary.couponDiscount),
        appliedCoupon: cart.coupon.isApplied ? cart.coupon : null,
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

    if (!order.invoice.invoiceNumber) {
      await order.generateInvoiceNumber();
    }

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
