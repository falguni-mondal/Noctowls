import axios from "axios";
import Razorpay from "razorpay";
import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==================== HELPER: WEIGHT CALCULATOR ====================
const calculateOrderWeight = (items, freeGiftsData) => {
  let totalGrams = 0;

  // 1. Helper for Main Items
  const getItemWeight = (category, sizeValue) => {
    const cat = String(category || "").toLowerCase().trim();
    const size = String(sizeValue || "").toLowerCase().trim();

    if (cat === "deskmat") {
      if (size === "l") return 600;
      if (size === "xl") return 730;
      if (size === "xxl") return 955;
      return 600;
    }
    if (cat === "anime-keychain") return 30;
    if (cat === "anime-figure") return 100;
    if (cat === "anime-katana") {
      if (size === "miniature") return 80;
      if (size === "kids-short") return 330;
      if (size === "full-length") return 700;
      return 80;
    }
    return 500; // Generic fallback
  };

  // 2. Helper for Free Gifts
  const getGiftWeight = (name) => {
    const n = String(name || "").trim();
    switch (n) {
      case "Anime Keychain": return 30;
      case "Anime Figure": return 100;
      case "Anime Katana": return 80;
      case "Stickers": return 10;
      default: return 50;
    }
  };

  // --- PROCESSING ---
  if (items && Array.isArray(items)) {
    items.forEach((item) => {
      const cat = item.category || (item.product && item.product.category);
      const w = getItemWeight(cat, item.size?.value);
      totalGrams += w * item.quantity;
    });
  }

  if (freeGiftsData && freeGiftsData.gifts && Array.isArray(freeGiftsData.gifts)) {
    freeGiftsData.gifts.forEach((gift) => {
      const w = getGiftWeight(gift.name);
      totalGrams += w * (gift.quantity || 1);
    });
  }

  return totalGrams;
};

// ==================== HELPER: DIMENSIONS CALCULATOR ====================
const calculateOrderDimensions = (items, freeGiftsData) => {
  let totalItemsCount = 0;

  if (items && Array.isArray(items)) {
    items.forEach((item) => {
      totalItemsCount += item.quantity || 1;
    });
  }

  if (freeGiftsData && freeGiftsData.gifts && Array.isArray(freeGiftsData.gifts)) {
    freeGiftsData.gifts.forEach((gift) => {
      totalItemsCount += gift.quantity || 1;
    });
  }

  // Fallback to 1 if empty
  totalItemsCount = totalItemsCount > 0 ? totalItemsCount : 1;

  // Rule: Only length is multiplied by the number of products. Breadth and Height remain same.
  return {
    length: 11 * totalItemsCount,
    breadth: 11,
    height: 42
  };
};

// ==================== HELPER: GET PRODUCT DESCRIPTION FOR INVOICE ====================
const getInvoiceProductDescription = (items) => {
  if (!items || items.length === 0) return "Apparel/Merchandise";

  const descArray = items.map(item => {
    const name = item.productName || "Item";
    const sizeVal = item.size?.label || item.size?.value || "";
    const sizeStr = sizeVal ? ` - ${sizeVal}` : "";
    const skuStr = item.size?.skuCode ? ` SKU:${item.size.skuCode}` : "";

    return `${name}${sizeStr}${skuStr}`;
  });

  let productsDescText = descArray.join(" | ");

  // Delhivery API limits products_desc. Safely truncate if it gets too long.
  if (productsDescText.length > 200) {
    productsDescText = productsDescText.substring(0, 197) + "...";
  }

  return productsDescText;
};

// ==================== HELPER: CREATE REVERSE PICKUP (PRIVATE) ====================
const createReversePickup = async (order) => {
  try {
    const isProd = process.env.DELHIVERY_MODE === "production";
    const baseUrl = isProd
      ? "https://track.delhivery.com"
      : "https://staging-express.delhivery.com";

    console.log(`[Delhivery] Attempting Reverse Pickup for ${order.orderNumber}`);

    const weightGrams = calculateOrderWeight(order.items, order.freeGifts);
    const dimensions = calculateOrderDimensions(order.items, order.freeGifts);

    // Using the same detailed product description for reverse pickup
    const detailedDesc = getInvoiceProductDescription(order.items);
    let returnDesc = `Return: ${detailedDesc}`;
    if (returnDesc.length > 200) returnDesc = returnDesc.substring(0, 197) + "...";

    const payload = {
      "shipments": [
        {
          "client": process.env.DELHIVERY_PICKUP_NAME,
          "order": `${order.orderNumber}-R`,
          "name": order.shippingAddress.fullName,
          "add": order.shippingAddress.address,
          "city": order.shippingAddress.city,
          "state": order.shippingAddress.state,
          "country": "India",
          "pin": order.shippingAddress.pincode,
          "phone": order.shippingAddress.phone,
          "payment_mode": "Prepaid",
          "products_desc": returnDesc,
          "quantity": order.items.length,
          "weight": weightGrams,
          "length": dimensions.length,
          "breadth": dimensions.breadth,
          "height": dimensions.height,
          "return_name": process.env.DELHIVERY_PICKUP_NAME,
          "return_add": process.env.DELHIVERY_PICKUP_ADD,
          "return_city": process.env.DELHIVERY_PICKUP_CITY,
          "return_pin": process.env.DELHIVERY_PICKUP_PIN,
          "return_phone": process.env.DELHIVERY_PICKUP_PHONE,
          "qc": {
            "item": [
              {
                "image": "",
                "code": "QC_001",
                "reason": "Product and box should be intact"
              }
            ]
          }
        }
      ],
      "pickup_location": {
        "name": process.env.DELHIVERY_PICKUP_NAME,
        "add": process.env.DELHIVERY_PICKUP_ADD,
        "city": process.env.DELHIVERY_PICKUP_CITY,
        "pin_code": process.env.DELHIVERY_PICKUP_PIN,
        "country": "India",
        "phone": process.env.DELHIVERY_PICKUP_PHONE
      }
    };

    const params = new URLSearchParams();
    params.append("format", "json");
    params.append("data", JSON.stringify(payload));

    const response = await axios.post(
      `${baseUrl}/api/cmu/create.json`,
      params,
      { headers: { "Authorization": `Token ${process.env.DELHIVERY_API_TOKEN}` } }
    );

    if (response.data && response.data.packages && response.data.packages.length > 0) {
      const pkg = response.data.packages[0];
      if (pkg.status === "Success" || pkg.status === "Scanned") {
        console.log(`✅ [Delhivery] Reverse Pickup Created. AWB: ${pkg.waybill}`);
        return { success: true, awb: pkg.waybill, ref: pkg.refnum };
      } else {
        throw new Error(pkg.remarks || "Reverse API Failed");
      }
    } else {
      throw new Error("Unexpected API Response");
    }

  } catch (error) {
    console.error(`❌ [Delhivery] Reverse Error:`, error.response?.data || error.message);
    throw new Error(error.message || "Reverse Pickup Failed");
  }
};

// ==================== HELPER: SYNC TO DELHIVERY (FORWARD) ====================
const syncToDelhivery = async (order) => {
  try {
    if (order.tracking?.courier === "Delhivery" && order.tracking?.trackingId) {
      console.log(`[Delhivery] Order ${order.orderNumber} already synced.`);
      return { success: true, awb: order.tracking.trackingId, message: "Already shipped" };
    }

    const isProd = process.env.DELHIVERY_MODE === "production";
    const baseUrl = isProd
      ? "https://track.delhivery.com"
      : "https://staging-express.delhivery.com";

    console.log(`[Delhivery] Attempting ship from Location: "${process.env.DELHIVERY_PICKUP_NAME}"`);

    const totalWeightGrams = calculateOrderWeight(order.items, order.freeGifts);
    const dimensions = calculateOrderDimensions(order.items, order.freeGifts);
    const invoiceProductsDesc = getInvoiceProductDescription(order.items);

    const shipmentData = {
      "shipments": [
        {
          "name": order.shippingAddress.fullName,
          "add": order.shippingAddress.address,
          "pin": order.shippingAddress.pincode,
          "city": order.shippingAddress.city,
          "state": order.shippingAddress.state,
          "country": "India",
          "phone": order.shippingAddress.phone,
          "order": order.orderNumber,
          "payment_mode": order.payment.method === "COD" ? "COD" : "Prepaid",
          "return_pin": process.env.DELHIVERY_PICKUP_PIN,
          "return_name": process.env.DELHIVERY_PICKUP_NAME,
          "products_desc": invoiceProductsDesc,
          "cod_amount": order.payment.method === "COD" ? (order.pricing.finalTotal - order.payment.amountPaidOnline) : 0,
          "order_date": order.createdAt,
          "total_amount": order.pricing.finalTotal,
          "quantity": order.items.length,
          "weight": totalWeightGrams,
          "length": dimensions.length,
          "breadth": dimensions.breadth,
          "height": dimensions.height,
          "waybill": "",
        }
      ],
      "pickup_location": {
        "name": process.env.DELHIVERY_PICKUP_NAME,
        "add": process.env.DELHIVERY_PICKUP_ADD,
        "city": process.env.DELHIVERY_PICKUP_CITY,
        "pin_code": process.env.DELHIVERY_PICKUP_PIN,
        "country": "India",
        "phone": process.env.DELHIVERY_PICKUP_PHONE
      }
    };

    const params = new URLSearchParams();
    params.append("format", "json");
    params.append("data", JSON.stringify(shipmentData));

    const response = await axios.post(
      `${baseUrl}/api/cmu/create.json`,
      params,
      {
        headers: {
          "Authorization": `Token ${process.env.DELHIVERY_API_TOKEN}`,
        }
      }
    );

    if (response.data && response.data.packages && response.data.packages.length > 0) {
      const pkg = response.data.packages[0];

      if (pkg.status === "Success") {
        console.log(`✅ [Delhivery] Shipment created. AWB: ${pkg.waybill}`);

        order.orderStatus = "shipped";
        order.tracking = {
          trackingNumber: pkg.waybill,
          courierService: "Delhivery",
          trackingUrl: `https://www.delhivery.com/track/package/${pkg.waybill}`
        };

        if (!order.statusTimestamps) order.statusTimestamps = {};
        order.statusTimestamps.shipped = new Date();

        await order.save();
        return { success: true, awb: pkg.waybill };
      } else {
        const errorMsg = pkg.remarks || "Delhivery API Error";
        throw new Error(errorMsg);
      }
    } else {
      console.error("Delhivery Raw Response:", JSON.stringify(response.data));
      throw new Error(JSON.stringify(response.data));
    }

  } catch (error) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ [Delhivery] Sync Failed:`, msg);
    throw new Error(msg);
  }
};

// ==================== MANUAL SHIP BUTTON CONTROLLER ====================
export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderStatus === "shipped" && order.tracking?.trackingId) {
      return res.status(400).json({
        success: false,
        message: "Order is already shipped",
        awb: order.tracking.trackingId
      });
    }
    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot ship a cancelled order" });
    }

    const result = await syncToDelhivery(order);

    return res.status(200).json({
      success: true,
      message: result.message || "Order shipped successfully",
      awb: result.awb
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Shipping failed",
      error: error.message
    });
  }
};

// ==================== GET ALL ORDERS (ADMIN) ====================
export const getAllAdminOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      returnStatus,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status && status !== "" && status !== "all") {
      query.orderStatus = status;
    }

    if (returnStatus) {
      if (returnStatus === 'active') {
        query["returnInfo.status"] = { $in: ['requested', 'approved', 'picked', 'received', 'qc_passed'] };
      } else if (returnStatus === 'history') {
        query["returnInfo.status"] = { $in: ['completed', 'rejected'] };
      } else if (returnStatus !== 'all' && returnStatus !== '') {
        query["returnInfo.status"] = returnStatus;
      } else if (returnStatus === 'all') {
        query["returnInfo.status"] = { $ne: 'none' };
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { orderNumber: searchRegex },
        { "guestInfo.email": searchRegex },
        { "guestInfo.name": searchRegex },
        { "shippingAddress.phone": searchRegex },
        { "shippingAddress.fullName": searchRegex },
      ];
    }

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        totalOrders: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get All Admin Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ==================== GET SINGLE ORDER DETAILS ====================
export const getAdminOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name image");

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
    console.error("Get Admin Order By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
};

// ==================== UPDATE ORDER STATUS ====================
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending", "confirmed", "processing", "packed", "shipped",
      "out-for-delivery", "delivered", "cancelled", "returned",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["delivered", "returned"].includes(order.orderStatus) && !["delivered", "returned"].includes(status)) {
      return res.status(400).json({ success: false, message: "Cannot change status of a completed order" });
    }

    // --- CANCELLATION LOGIC ---
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(
        "admin",
        "Cancelled by Admin"
      );

      // Restore Stock
      for (const item of cancelledOrder.items) {
        if (item.isFreeGift) continue;
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

      // Revert Coupon
      if (couponToRevert) {
        const coupon = await Coupon.findOne({ code: couponToRevert.code });
        if (coupon) {
          await coupon.decrementUsageForUser(couponToRevert.userId, couponToRevert.deviceId);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Order cancelled by Admin successfully",
        order: cancelledOrder,
      });
    }

    // --- STANDARD UPDATE ---
    if (status === "delivered" && order.payment.method === "COD" && order.payment.status === "pending") {
      order.payment.status = "completed";
      order.payment.paidAt = new Date();
    }

    order.orderStatus = status;

    if (status === "shipped" && req.body.tracking) {
      if (req.body.tracking.trackingNumber)
        order.tracking.trackingNumber = req.body.tracking.trackingNumber;
      if (req.body.tracking.courier)
        order.tracking.courierService = req.body.tracking.courier;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

// ==================== MANAGE RETURN REQUEST (COMPLETED LOGIC) ====================
export const manageReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    // Allowed statuses for admin action
    // "picked" is typically set by webhook, but admin can manually set it if needed.
    const validStatuses = ["approved", "rejected", "picked", "received", "qc_passed", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid return action" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.returnInfo || order.returnInfo.status === 'none') {
      return res.status(400).json({ message: "No active return request found" });
    }

    // --- 1. APPROVAL LOGIC (Trigger Logistics) ---
    // Runs when Admin selects "approved"
    let pickupAWB = null;
    if (status === 'approved' && order.returnInfo.status !== 'approved') {
      try {
        const result = await createReversePickup(order);
        pickupAWB = result.awb;
        const autoNote = `Reverse Pickup Scheduled. AWB: ${result.awb}`;
        order.returnInfo.adminNote = note ? `${note} | ${autoNote}` : autoNote;
      } catch (apiError) {
        return res.status(500).json({
          success: false,
          message: "Failed to schedule Delhivery Reverse Pickup. Check address/pincode.",
          error: apiError.message
        });
      }
    } else {
      if (note) order.returnInfo.adminNote = note;
    }

    // --- 2. REFUND TRIGGER (The "Refund" Button logic) ---
    // Runs ONLY when Admin selects "completed"
    if (status === 'completed' && order.returnInfo.status !== 'completed') {

      // GUARD: Ensure order has been picked up before allowing refund
      const allowedPreviousStatuses = ['picked', 'received', 'qc_passed'];
      if (!allowedPreviousStatuses.includes(order.returnInfo.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot refund yet. Status must be 'picked', 'received' or 'qc_passed' first."
        });
      }

      // --- SCENARIO A: ONLINE PAYMENT (Auto Refund Full Amount) ---
      if (order.payment.method === 'ONLINE') {
        const amountToRefund = order.payment.amountPaidOnline;

        if (amountToRefund > 0 && order.payment.razorpayPaymentId) {
          try {
            console.log(`Initiating Auto-Refund (Online): ₹${amountToRefund}`);

            await razorpay.payments.refund(order.payment.razorpayPaymentId, {
              amount: Math.round(amountToRefund * 100),
              speed: "optimum", // Instant refund
              notes: {
                reason: "Return Completed",
                order_number: order.orderNumber,
                type: "RETURN_REFUND_ONLINE"
              },
              receipt: `Return Refund for ${order.orderNumber}`
            });

            // Success: Update DB
            order.cancellation.refundStatus = "processing";
            order.cancellation.refundAmount = amountToRefund;
            order.cancellation.refundedAt = new Date();

          } catch (refundError) {
            console.error("❌ Online Refund Failed:", refundError);
            return res.status(500).json({
              success: false,
              message: "Failed to initiate Razorpay refund. Check Razorpay Dashboard.",
              error: refundError.message
            });
          }
        }
      }

      // --- SCENARIO B: COD PAYMENT (Manual Refund - Product Cost Only) ---
      else if (order.payment.method === 'COD') {
        // Refund = Final Total - COD Fee (₹49)
        // The COD fee is retained by the store.
        const codFee = order.pricing.codFee || 0;
        const finalTotal = order.pricing.finalTotal || 0;
        const refundAmount = Math.max(0, finalTotal - codFee);

        console.log(`Manual Refund Logged (COD): ₹${refundAmount}. Fee ₹${codFee} deducted.`);

        // DB Update Only (No Razorpay call)
        order.cancellation.refundStatus = "completed"; // Indicates Admin transferred money manually
        order.cancellation.refundAmount = refundAmount;
        order.cancellation.refundedAt = new Date();
      }

      // Close the Order
      order.orderStatus = 'returned';
      order.returnInfo.isReturnActive = false;
    }

    // --- 3. SAVE STATUS & TIMELINE ---
    order.returnInfo.status = status;

    order.returnInfo.timeline.push({
      status: status === 'completed' ? 'Return Completed & Refund Processed' : `Return ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      date: new Date(),
      note: note || (status === 'approved' ? `Approved. Pickup AWB: ${pickupAWB}` : 'Updated by admin')
    });

    if (status === 'rejected') {
      order.returnInfo.isReturnActive = false;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Return updated to ${status}`,
      order
    });

  } catch (error) {
    console.error("Manage Return Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update return status",
      error: error.message
    });
  }
};

// ==================== DELETE ORDER (Admin Only) ====================
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled orders can be deleted to maintain stock/financial integrity.",
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

// ==================== GET ORDER STATS ====================
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          totalSales: { $sum: "$pricing.finalTotal" },
          netRevenue: { $sum: "$subTotal" },
          totalTax: { $sum: "$totalGST" },
        },
      },
    ]);

    const returnStats = await Order.aggregate([
      {
        $match: {
          "returnInfo.status": { $in: ['requested', 'approved', 'picked', 'received', 'qc_passed'] }
        }
      },
      { $count: "totalReturns" }
    ]);

    const totalReturnRequests = returnStats[0]?.totalReturns || 0;

    const totalOrders = stats.reduce((acc, curr) => acc + curr.count, 0);
    const totalSales = stats.reduce((acc, curr) => acc + curr.totalSales, 0);
    const totalTax = stats.reduce((acc, curr) => acc + curr.totalTax, 0);
    const netRevenue = stats.reduce((acc, curr) => acc + curr.netRevenue, 0);

    return res.status(200).json({
      success: true,
      stats: {
        breakdown: stats,
        totalOrders,
        totalSales: Math.round(totalSales),
        totalTax: Math.round(totalTax),
        netRevenue: Math.round(netRevenue),
        totalReturnRequests
      },
    });
  } catch (error) {
    console.error("Get Order Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};