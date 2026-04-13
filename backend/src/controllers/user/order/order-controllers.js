import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Cart from "../../../models/cart-model.js";
import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";
import Address from "../../../models/address-model.js";
import User from "../../../models/user-model.js";
import { sendEmail } from "../../../configs/nodemailer.js";

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

// ==================== HANDLE DELHIVERY WEBHOOK ====================
export const handleDelhiveryWebhook = (req, res) => {
  // 1️⃣ ACK IMMEDIATELY
  res.status(200).send("OK");

  // 2️⃣ PROCESS ASYNC
  setImmediate(async () => {
    try {
      const body = req.body || {};
      const shipment = body.Shipment || body.ScanDetail || body;
      const statusBlock = shipment.Status || {};

      const statusRaw =
        statusBlock.Status ||
        shipment.Status ||
        shipment.ScanType ||
        "";

      const instruction =
        statusBlock.Instructions ||
        shipment.Instructions ||
        "";

      const status = statusRaw.toLowerCase().trim();

      const orderNumberRaw =
        shipment.ReferenceNo ||
        shipment.RefID ||
        shipment.OrderNo ||
        "";

      const awb =
        shipment.AWB ||
        shipment.Waybill ||
        "";

      if (!orderNumberRaw) return;

      const orderNumber = orderNumberRaw.replace(/-R$/i, "").trim();

      const order = await Order.findOne({ orderNumber });
      if (!order) return;

      // -----------------------------
      // IDEMPOTENCY (SAFE & SIMPLE)
      // -----------------------------
      const scanKey = `${awb}-${status}`;
      if (order.lastWebhookScan === scanKey) return;
      order.lastWebhookScan = scanKey;

      // -----------------------------
      // STATUS GROUPS
      // -----------------------------
      const SHIPPED_STATUSES = [
        "manifest",
        "dispatch",
        "in transit",
      ];

      const OFD_STATUSES = [
        "out for delivery",
        "ofd",
      ];

      const DELIVERED_STATUSES = ["delivered"];

      const PICKUP_STATUSES = ["pickup", "picked"];

      // -----------------------------
      // FORWARD SHIPPING
      // -----------------------------
      if (!order.returnInfo?.isReturnActive) {
        // Link tracking
        if (!order.tracking.trackingNumber && awb) {
          order.tracking.trackingNumber = awb;
          order.tracking.courierService = "Delhivery";
        }

        // Mark shipped
        if (
          SHIPPED_STATUSES.some(s => status.includes(s)) &&
          ["confirmed", "processing", "packed"].includes(order.orderStatus)
        ) {
          order.orderStatus = "shipped";
        }

        // Mark out-for-delivery
        if (
          OFD_STATUSES.some(s => status.includes(s)) &&
          order.orderStatus === "shipped"
        ) {
          order.orderStatus = "out-for-delivery";
        }

        // Mark delivered
        if (
          DELIVERED_STATUSES.some(s => status.includes(s)) &&
          order.orderStatus !== "delivered"
        ) {
          order.orderStatus = "delivered";
          order.tracking.actualDelivery = new Date();

          // COD auto-complete
          if (
            order.payment.method === "COD" &&
            order.payment.status === "pending"
          ) {
            order.payment.status = "completed";
            order.payment.paidAt = new Date();
          }
        }
      }

      // -----------------------------
      // REVERSE SHIPPING (RETURNS)
      // -----------------------------
      else {
        // Pickup event
        if (
          PICKUP_STATUSES.some(s => status.includes(s)) ||
          instruction.toLowerCase().includes("pickup")
        ) {
          order.returnInfo.timeline.push({
            status: "Return Picked Up",
            note: `AWB: ${awb}`,
          });
        }

        // Received at warehouse
        if (DELIVERED_STATUSES.some(s => status.includes(s))) {
          order.returnInfo.timeline.push({
            status: "Return Received",
            note: "Item received at warehouse",
          });
        }
      }

      await order.save();
    } catch (err) {
      console.error("[Delhivery Webhook] Async Error:", err);
    }
  });
};

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

    // Set COD Fee to 49
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
          price: unitBasePrice,
          itemTotal: totalItemBasePrice,
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

    // Update User Name Logic
    if (userId) {
      try {
        const user = await User.findById(userId).session(session);
        if (user) {
          // Update name if currently empty
          if (!user.name && shippingAddress.fullName) {
            user.name = shippingAddress.fullName;
          }
          // Optional: Update phone if currently empty
          if (!user.phone && shippingAddress.phone) {
            user.phone = shippingAddress.phone;
          }

          if (user.isModified('name') || user.isModified('phone')) {
            await user.save({ session });
          }
        }
      } catch (userUpdateError) {
        console.warn("⚠️ Failed to update user profile info:", userUpdateError.message);
        // Don't abort transaction for this non-critical error
      }
    }

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

    // ==================== INVENTORY RESERVATION ====================
    // Deduct stock immediately to prevent overselling race conditions
    for (const item of orderItems) {
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          sizes: { $elemMatch: { value: item.size.value } },
        },
        {
          $inc: {
            "sizes.$.stock": -item.quantity,
            totalStock: -item.quantity,
          },
        },
        { session } // Ties it to the transaction. Rolls back safely if aborted!
      );
    }
    // ===============================================================

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

    if (!req.rawBody) {
      console.error("⚠️ Raw body not available. Check express.json setup.");
      return res.status(400).json({ message: "Server misconfiguration" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠️ Invalid Razorpay Webhook Signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

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

      const expectedAmountPaise = Math.round(
        order.payment.amountPaidOnline * 100
      );

      if (payment.amount !== expectedAmountPaise) {
        order.payment.status = "failed";
        await order.save();
        return res.status(400).json({ message: "Amount mismatch" });
      }

      // Complete Payment
      await order.completePayment({
        razorpayPaymentId,
        razorpaySignature: "webhook_verified_signature",
      });

      // ==================== SALES CONFIRMATION ====================
      // Increment Sales Count (Stock was already deducted during checkout)
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          {
            _id: item.product,
            sizes: { $elemMatch: { value: item.size.value } },
          },
          {
            $inc: {
              "sizes.$.salesCount": item.quantity,
              totalSales: item.quantity,
            },
          }
        );
      }
      // ============================================================

      // Coupon Usage
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

      // ==================== SEND EMAILS (WEBHOOK) ====================
      try {
        // 1. Get Customer Email (Check Guest Info first, then User DB)
        let customerEmail = order.guestInfo?.email;
        if (!customerEmail && order.user) {
          const userDoc = await User.findById(order.user);
          if (userDoc) customerEmail = userDoc.email;
        }

        // 2. Generate Item List HTML (Including Size)
        const itemsHtml = order.items.map(item => `
          <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center;">
            <img src="${item.productImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
            <div>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${item.productName}</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #666;">
                Size: <strong>${item.size.label || item.size.value}</strong> | Qty: ${item.quantity}
              </p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #333;">₹${item.itemTotal}</p>
            </div>
          </div>
        `).join('');

        const customerName = order.shippingAddress.fullName || "Customer";
        const orderDate = new Date().toLocaleDateString('en-IN', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        // 3. Define Email Template
        const getEmailHtml = (title, showAdminDetails = false) => `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 5px;">${title}</h2>
            <p style="color: #666; margin-top: 0;">Order #${order.orderNumber}</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${orderDate}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: green;">Paid & Confirmed</span></p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.pricing.finalTotal}</p>
              ${showAdminDetails ? `<p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName} (${customerEmail || 'N/A'})</p>` : ''}
            </div>

            <h3 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 5px;">Order Summary</h3>
            ${itemsHtml}

            <div style="margin-top: 25px; text-align: center;">
              <a href="https://noctowls.com/${showAdminDetails?'admin/orders/':'orders/'}${order._id}" 
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 14px; display: inline-block;">
                View Order Details
              </a>
            </div>
          </div>
        `;

        // 4. Send to Admin
        if (process.env.ADMIN_MAIL) {
          await sendEmail({
            to: process.env.ADMIN_MAIL,
            subject: `[New Order] #${order.orderNumber} by ${customerName}`,
            html: getEmailHtml('New Order Received', true),
          });
          console.log(`📧 Admin email sent for Order: ${order.orderNumber}`);
        }

        // 5. Send to Customer
        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            subject: `Order Confirmed: #${order.orderNumber} - Noctowls`,
            html: getEmailHtml(`Thank you for your order, ${customerName.split(' ')[0]}!`),
          });
          console.log(`📧 Customer email sent to ${customerEmail}`);
        } else {
          console.warn(`⚠️ No customer email found for Order ${order.orderNumber}`);
        }

      } catch (emailError) {
        console.error("Failed to send order emails (Webhook):", emailError.message);
      }
      // ===============================================================

      console.log(`Webhook verified payment for Order: ${order.orderNumber}`);
      return res.status(200).json({ status: "ok" });
    }

    return res.status(200).json({ status: "ignored" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

// ==================== VERIFY PAYMENT (SECURED) ====================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, message: "Missing required payment details" });
    }

    const query = { _id: orderId };
    if (userId) query.user = userId;
    else if (deviceId) query.deviceId = deviceId;
    else return res.status(401).json({ success: false, message: "Authentication required" });

    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Verify Signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature !== expectedSign) {
      order.payment.status = "failed";
      await order.save();
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Amount Check
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
      const expectedAmountPaise = Math.round(order.payment.amountPaidOnline * 100);

      if (paymentDetails.amount !== expectedAmountPaise) {
        order.payment.status = "failed";
        await order.save();
        return res.status(400).json({ success: false, message: "Amount mismatch" });
      }

      if (paymentDetails.status !== "captured") {
        return res.status(400).json({ success: false, message: `Payment not captured: ${paymentDetails.status}` });
      }
    } catch (gatewayError) {
      console.error("Gateway Error:", gatewayError);
      return res.status(500).json({ success: false, message: "Gateway validation failed" });
    }

    // Complete Payment
    await order.completePayment({ razorpayPaymentId, razorpaySignature });

    // ==================== SALES CONFIRMATION ====================
    // Increment Sales Count (Stock was already deducted during checkout)
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          sizes: { $elemMatch: { value: item.size.value } },
        },
        {
          $inc: {
            "sizes.$.salesCount": item.quantity,
            totalSales: item.quantity,
          },
        }
      );
    }
    // ============================================================

    // Coupon
    if (order.coupon && order.coupon.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon) await coupon.incrementUsageForUser(userId, userId ? null : deviceId);
    }

    // Clear Cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });
    if (cart) await cart.clearCart();

    // Invoice
    if (!order.invoice || !order.invoice.invoiceNumber) {
      await generateInvoiceSafe(order);
    }

    // ==================== SEND EMAILS (VERIFY PAYMENT) ====================
    try {
      // 1. Get Customer Email (Check Guest Info first, then User DB)
      let customerEmail = order.guestInfo?.email;
      if (!customerEmail && order.user) {
        const userDoc = await User.findById(order.user);
        if (userDoc) customerEmail = userDoc.email;
      }

      // 2. Generate Item List HTML (Including Size)
      const itemsHtml = order.items.map(item => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center;">
          <img src="${item.productImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
          <div>
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${item.productName}</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #666;">
              Size: <strong>${item.size.label || item.size.value}</strong> | Qty: ${item.quantity}
            </p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #333;">₹${item.itemTotal}</p>
          </div>
        </div>
      `).join('');

      const customerName = order.shippingAddress.fullName || "Customer";
      const orderDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });

      // 3. Define Email Template
      const getEmailHtml = (title, showAdminDetails = false) => `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; margin-bottom: 5px;">${title}</h2>
          <p style="color: #666; margin-top: 0;">Order #${order.orderNumber}</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${orderDate}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: green;">Paid & Confirmed</span></p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.pricing.finalTotal}</p>
            ${showAdminDetails ? `<p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName} (${customerEmail || 'N/A'})</p>` : ''}
          </div>

          <h3 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 5px;">Order Summary</h3>
          ${itemsHtml}

          <div style="margin-top: 25px; text-align: center;">
            <a href="https://noctowls.com/${showAdminDetails?'admin/orders/':'orders/'}${order._id}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 14px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
      `;

      // 4. Send to Admin
      if (process.env.ADMIN_MAIL) {
        await sendEmail({
          to: process.env.ADMIN_MAIL,
          subject: `[New Order] #${order.orderNumber} by ${customerName}`,
          html: getEmailHtml('New Order Received', true),
        });
        console.log(`📧 Admin email sent for Order: ${order.orderNumber}`);
      }

      // 5. Send to Customer
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed: #${order.orderNumber} - Noctowls`,
          html: getEmailHtml(`Thank you for your order, ${customerName.split(' ')[0]}!`),
        });
        console.log(`📧 Customer email sent to ${customerEmail}`);
      } else {
        console.warn(`⚠️ No customer email found for Order ${order.orderNumber}`);
      }

    } catch (emailError) {
      console.error("Failed to send order emails (Verify):", emailError.message);
    }
    // ======================================================================

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

    const query = {};
    if (userId) {
      query.user = userId;
    } else {
      query.deviceId = deviceId;
    }

    // Show the order if payment is NOT pending, OR if payment method is COD.
    query.$or = [
      { "payment.status": { $ne: "pending" } },
      { "payment.method": "COD" }
    ];

    // If a specific status is requested (e.g. "delivered"), add it to the query
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

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

    // [MODIFIED] Removed .lean() so virtuals work correctly
    const order = await Order.findOne(query);

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

// ==================== CANCEL ORDER (Registered Users) ====================
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a cancellation reason (minimum 10 characters)" });
    }

    const query = { _id: orderId };
    if (userId) query.user = userId;
    else if (deviceId) query.deviceId = deviceId;
    else return res.status(401).json({ success: false, message: "Authentication required" });

    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Cancellation Policy Check
    const nonCancellableStatuses = ['shipped', 'out-for-delivery', 'delivered', 'returned', 'cancelled'];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled. It has already been shipped or processed.",
        currentStatus: order.orderStatus,
      });
    }

    // 1. Process Cancellation
    const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(userId ? "user" : "guest", reason);

    // 2. Restock Inventory
    for (const item of cancelledOrder.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIndex = product.sizes.findIndex((s) => s.value === item.size.value);
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock += item.quantity;
          product.sizes[sizeIndex].salesCount = Math.max(0, product.sizes[sizeIndex].salesCount - item.quantity);
          await product.save();
        }
      }
    }

    // 3. Revert Coupon
    if (couponToRevert) {
      const coupon = await Coupon.findOne({ code: couponToRevert.code });
      if (coupon) await coupon.decrementUsageForUser(couponToRevert.userId, couponToRevert.deviceId);
    }

    // 4. AUTO REFUND LOGIC (Refunds to Source)
    let refundDetails = null;
    const amountToRefund = cancelledOrder.payment.amountPaidOnline;

    if (amountToRefund > 0 && cancelledOrder.payment.razorpayPaymentId) {
      try {
        console.log(`Initiating Refund: ₹${amountToRefund} for Order #${cancelledOrder.orderNumber}`);

        const refund = await razorpay.payments.refund(cancelledOrder.payment.razorpayPaymentId, {
          amount: Math.round(amountToRefund * 100),
          speed: "optimum",
          notes: {
            reason: reason,
            order_number: cancelledOrder.orderNumber,
            type: cancelledOrder.payment.method === "COD" ? "COD_FEE_REFUND" : "FULL_REFUND"
          },
          receipt: `Refund for ${cancelledOrder.orderNumber}`
        });

        cancelledOrder.cancellation.refundStatus = "processing";
        cancelledOrder.cancellation.refundAmount = amountToRefund;
        cancelledOrder.cancellation.refundedAt = new Date();
        await cancelledOrder.save();
        refundDetails = refund;

      } catch (refundError) {
        console.error("❌ Razorpay Refund Failed:", refundError);
        cancelledOrder.cancellation.refundStatus = "failed";
        await cancelledOrder.save();
      }
    } else {
      cancelledOrder.cancellation.refundStatus = "not-applicable";
      await cancelledOrder.save();
    }

    // 5. Send Emails
    try {
      await cancelledOrder.populate("user", "name email");
      const customerEmail = cancelledOrder.customerEmail;
      const customerName = cancelledOrder.customerName;

      let refundMessage = "No refund is applicable for this order.";

      if (amountToRefund > 0) {
        const label = cancelledOrder.payment.method === "COD" ? "COD Confirmation Fee" : "Order Amount";

        if (cancelledOrder.cancellation.refundStatus === "processing") {
          refundMessage = `✅ <strong>Refund Initiated:</strong> The ${label} of ₹${amountToRefund} has been refunded to your source account.`;
        } else if (cancelledOrder.cancellation.refundStatus === "failed") {
          refundMessage = `⚠️ <strong>Refund Pending:</strong> We could not auto-process your refund of ₹${amountToRefund}. Our team will process it manually.`;
        }
      }

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Cancelled - #${cancelledOrder.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #d32f2f;">Order Cancelled</h2>
              <p>Hi ${customerName},</p>
              <p>Your order <strong>#${cancelledOrder.orderNumber}</strong> has been cancelled.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Reason:</strong> ${reason}</p>
                <p style="margin-top: 10px;">${refundMessage}</p>
                ${refundDetails ? `<p style="font-size: 12px; color: #666;">Refund Ref: ${refundDetails.id}</p>` : ''}
              </div>
              <p>Regards,<br/>Team Noctowls</p>
            </div>
          `,
        });
      }

      await sendEmail({
        to: process.env.ADMIN_MAIL,
        subject: `[Alert] Order Cancelled - #${cancelledOrder.orderNumber}`,
        html: `<div style="font-family: Arial, sans-serif;"><h3>Order Cancelled by Customer</h3><p><strong>Order:</strong> ${cancelledOrder.orderNumber}</p><p><strong>Refund Status:</strong> ${cancelledOrder.cancellation.refundStatus.toUpperCase()}</p><p><strong>Refund Amount:</strong> ₹${amountToRefund}</p>${cancelledOrder.cancellation.refundStatus === 'failed' ? '<p style="color: red; font-weight: bold;">⚠️ AUTO REFUND FAILED</p>' : ''}</div>`
      });
    } catch (e) { console.error("Email fail", e); }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderId: cancelledOrder._id,
        status: cancelledOrder.orderStatus,
        refundStatus: cancelledOrder.cancellation.refundStatus,
        refundAmount: amountToRefund,
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order", error: error.message });
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

    // [MODIFIED] Removed .lean()
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      "guestInfo.email": email.toLowerCase().trim(),
      user: null,
    });

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
        // Include virtuals implicitly if backend supports toJSON({virtuals:true})
        // OR explicitly return fields if needed
        returnInfo: order.returnInfo,
        canBeReturned: order.canBeReturned, // Explicitly return virtual if needed
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

    if (!orderNumber || !email || !reason) {
      return res.status(400).json({ success: false, message: "Order number, email, and reason are required" });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a cancellation reason (min 10 chars)" });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      "guestInfo.email": email.toLowerCase().trim(),
      user: null,
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Check Eligibility
    const nonCancellableStatuses = ['shipped', 'out-for-delivery', 'delivered', 'returned', 'cancelled'];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage." });
    }

    // 1. Process Cancellation
    const { order: cancelledOrder, couponToRevert } = await order.cancelOrder("guest", reason);

    // 2. Restock
    for (const item of cancelledOrder.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIndex = product.sizes.findIndex((s) => s.value === item.size.value);
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock += item.quantity;
          product.sizes[sizeIndex].salesCount = Math.max(0, product.sizes[sizeIndex].salesCount - item.quantity);
          await product.save();
        }
      }
    }

    // 3. Revert Coupon
    if (couponToRevert) {
      const coupon = await Coupon.findOne({ code: couponToRevert.code });
      if (coupon) await coupon.decrementUsageForUser(couponToRevert.userId, couponToRevert.deviceId);
    }

    // 4. AUTO REFUND LOGIC
    let refundDetails = null;
    const amountToRefund = cancelledOrder.payment.amountPaidOnline;

    if (amountToRefund > 0 && cancelledOrder.payment.razorpayPaymentId) {
      try {
        console.log(`Initiating Guest Refund: ₹${amountToRefund} for Order #${cancelledOrder.orderNumber}`);
        const refund = await razorpay.payments.refund(cancelledOrder.payment.razorpayPaymentId, {
          amount: Math.round(amountToRefund * 100),
          speed: "optimum",
          notes: {
            reason: reason,
            order_number: cancelledOrder.orderNumber,
            type: cancelledOrder.payment.method === "COD" ? "COD_FEE_REFUND" : "FULL_REFUND"
          },
          receipt: `Refund for ${cancelledOrder.orderNumber}`
        });

        cancelledOrder.cancellation.refundStatus = "processing";
        cancelledOrder.cancellation.refundAmount = amountToRefund;
        cancelledOrder.cancellation.refundedAt = new Date();
        await cancelledOrder.save();
        refundDetails = refund;
      } catch (refundError) {
        console.error("❌ Guest Refund Failed:", refundError);
        cancelledOrder.cancellation.refundStatus = "failed";
        await cancelledOrder.save();
      }
    } else {
      cancelledOrder.cancellation.refundStatus = "not-applicable";
      await cancelledOrder.save();
    }

    // 5. EMAILS
    try {
      const customerEmail = cancelledOrder.guestInfo.email;
      const customerName = cancelledOrder.guestInfo.name;
      let refundMessage = "No refund is applicable.";

      if (amountToRefund > 0) {
        const label = cancelledOrder.payment.method === "COD" ? "COD Confirmation Fee" : "Order Amount";
        if (cancelledOrder.cancellation.refundStatus === "processing") {
          refundMessage = `✅ <strong>Refund Initiated:</strong> The ${label} of ₹${amountToRefund} has been refunded to your source account.`;
        } else if (cancelledOrder.cancellation.refundStatus === "failed") {
          refundMessage = `⚠️ <strong>Refund Pending:</strong> Auto-refund failed. Admin will process manually.`;
        }
      }

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Cancelled - #${cancelledOrder.orderNumber}`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"><h2 style="color: #d32f2f;">Order Cancelled</h2><p>Hi ${customerName},</p><p>Your order <strong>#${cancelledOrder.orderNumber}</strong> has been cancelled.</p><div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Reason:</strong> ${reason}</p><p style="margin-top: 10px;">${refundMessage}</p>
          ${refundDetails ? `<p style="font-size: 12px; color: #666;">Refund Ref: ${refundDetails.id}</p>` : ''}</div></div>`
        });
      }

      await sendEmail({
        to: process.env.ADMIN_MAIL,
        subject: `[Alert] Guest Order Cancelled - #${cancelledOrder.orderNumber}`,
        html: `<div style="font-family: Arial, sans-serif;"><h3>Guest Order Cancelled</h3><p><strong>Order:</strong> ${cancelledOrder.orderNumber}</p><p><strong>Refund Status:</strong> ${cancelledOrder.cancellation.refundStatus}</p><p><strong>Amount:</strong> ₹${amountToRefund}</p></div>`
      });

    } catch (e) { console.error("Email fail", e); }

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
    return res.status(500).json({ success: false, message: "Failed to cancel order", error: error.message });
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

// ==================== NEW: REQUEST RETURN ====================
export const requestReturn = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies.device_id;
    const { orderId } = req.params;
    const { reason, type, bankDetails } = req.body; // type: 'refund' or 'exchange'

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ message: "A valid reason is required" });
    }

    const query = { _id: orderId };
    if (userId) query.user = userId;
    else query.deviceId = deviceId;

    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1. Eligibility Check (Delivered Only)
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({ message: "Order must be delivered to request a return" });
    }

    // 2. Active Return Check
    if (order.returnInfo && order.returnInfo.isReturnActive) {
      return res.status(400).json({ message: "A return request is already active for this order" });
    }

    // 3. Time Window Check (7 Days) - Optional Double Check
    const deliveryDate = order.statusTimestamps.delivered;
    if (deliveryDate) {
      const daysDiff = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) return res.status(400).json({ message: "Return period has expired" });
    }

    // 4. MANDATORY BANK DETAILS CHECK FOR COD REFUNDS
    if (order.payment.method === "COD" && type === "refund") {
      if (
        !bankDetails ||
        !bankDetails.accountNumber ||
        !bankDetails.ifscCode ||
        !bankDetails.accountHolderName
      ) {
        return res.status(400).json({
          success: false,
          message: "Bank details (Account No, IFSC, Name) are required for COD refunds."
        });
      }
    }

    // Format Reason with Bank Details if provided
    let finalReason = reason;
    if (bankDetails && type === "refund") {
      finalReason += `\n\n[Bank Details]\nHolder: ${bankDetails.accountHolderName}\nAcc: ${bankDetails.accountNumber}\nIFSC: ${bankDetails.ifscCode}\nBank: ${bankDetails.bankName || 'N/A'}`;
    }

    // Update Return Info
    order.returnInfo = {
      isReturnActive: true,
      type: type || 'refund',
      status: 'requested',
      reason: finalReason,
      timeline: [
        {
          status: 'Return Requested',
          date: new Date(),
          note: type === 'exchange' ? 'Exchange requested by user' : 'Refund requested by user'
        }
      ]
    };

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return requested successfully",
      order
    });

  } catch (error) {
    console.error("Return Request Error:", error);
    return res.status(500).json({ message: "Failed to submit return request" });
  }
};