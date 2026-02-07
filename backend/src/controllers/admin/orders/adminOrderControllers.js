import axios from "axios";
import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";

// ==================== HELPER: WEIGHT CALCULATOR ====================
// Calculates total weight in grams based on your strict product rules
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

  // 2. Helper for Free Gifts (Exact Name Matching)
  const getGiftWeight = (name) => {
    const n = String(name || "").trim();
    switch (n) {
      case "Anime Keychain": return 30;
      case "Anime Figure": return 100;
      case "Anime Katana": return 80;  // Miniature
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

// ==================== HELPER: CREATE REVERSE PICKUP (PRIVATE) ====================
const createReversePickup = async (order) => {
  try {
    const isProd = process.env.DELHIVERY_MODE === "production";
    const baseUrl = isProd
      ? "https://track.delhivery.com"
      : "https://staging-express.delhivery.com";

    console.log(`[Delhivery] Attempting Reverse Pickup for ${order.orderNumber}`);

    // 1. Calculate Weight (Important for pricing)
    const weightGrams = calculateOrderWeight(order.items, order.freeGifts);

    // 2. Prepare Payload
    // Note: Reverse pickup API structure is slightly different from Forward
    const payload = {
      "shipments": [
        {
          "client": process.env.DELHIVERY_PICKUP_NAME, // Your account name
          "order": `${order.orderNumber}-R`, // Append -R so it doesn't conflict with original order ID
          "name": order.shippingAddress.fullName,
          "add": order.shippingAddress.address,
          "city": order.shippingAddress.city,
          "state": order.shippingAddress.state,
          "country": "India",
          "pin": order.shippingAddress.pincode,
          "phone": order.shippingAddress.phone,
          "payment_mode": "Prepaid", // You (Merchant) pay for reverse shipping
          "products_desc": "Return: Anime Merchandise",
          "quantity": order.items.length,
          "weight": weightGrams,
          // DESTINATION (Your Warehouse)
          // The API automatically routes to your registered warehouse based on your Token,
          // but explicit return address ensures clarity.
          "return_name": process.env.DELHIVERY_PICKUP_NAME,
          "return_add": process.env.DELHIVERY_PICKUP_ADD,
          "return_city": process.env.DELHIVERY_PICKUP_CITY,
          "return_pin": process.env.DELHIVERY_PICKUP_PIN,
          "return_phone": process.env.DELHIVERY_PICKUP_PHONE,
          "qc": {
            "item": [
              {
                "image": "", // Optional: URL of product image
                "code": "QC_001",
                "reason": "Product and box should be intact"
              }
            ]
          }
        }
      ],
      "pickup_location": {
        // In Reverse API, "pickup_location" is actually where the courier DROPS the item (Your Warehouse)
        // Confusing naming by Delhivery, but this is how it works for incoming.
        "name": process.env.DELHIVERY_PICKUP_NAME,
        "add": process.env.DELHIVERY_PICKUP_ADD,
        "city": process.env.DELHIVERY_PICKUP_CITY,
        "pin_code": process.env.DELHIVERY_PICKUP_PIN,
        "country": "India",
        "phone": process.env.DELHIVERY_PICKUP_PHONE
      }
    };

    // 3. Format Data
    const params = new URLSearchParams();
    params.append("format", "json");
    params.append("data", JSON.stringify(payload));

    // 4. Call API
    // We use the same endpoint; Delhivery detects it's a reverse flow based on configuration 
    // OR we use the specific incoming endpoint. 
    // Standard practice: Use `api/cmu/create.json` but ensuring the 'client' matches your reverse capability.
    // If your account supports reverse, this works.

    const response = await axios.post(
      `${baseUrl}/api/cmu/create.json`,
      params,
      { headers: { "Authorization": `Token ${process.env.DELHIVERY_API_TOKEN}` } }
    );

    // 5. Check Response
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
    // We re-throw so the Admin Controller knows it failed
    throw new Error(error.message || "Reverse Pickup Failed");
  }
};

// ==================== HELPER: SYNC TO DELHI VERY (RESTORED WORKING VERSION) ====================
const syncToDelhivery = async (order) => {
  try {
    // 1. Basic Checks
    if (order.tracking?.courier === "Delhivery" && order.tracking?.trackingId) {
      console.log(`[Delhivery] Order ${order.orderNumber} already synced.`);
      return { success: true, awb: order.tracking.trackingId, message: "Already shipped" };
    }

    // 2. Configure Environment
    const isProd = process.env.DELHIVERY_MODE === "production";
    const baseUrl = isProd
      ? "https://track.delhivery.com"
      : "https://staging-express.delhivery.com";

    console.log(`[Delhivery] Attempting ship from Location: "${process.env.DELHIVERY_PICKUP_NAME}"`);

    // 3. Calculate Weight (The only new addition to your old code)
    const totalWeightGrams = calculateOrderWeight(order.items, order.freeGifts);

    // 4. Prepare Data Object (Exact structure from your working code)
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
          "return_pin": process.env.DELHIVERY_PICKUP_PIN, // Simplified as per your working code
          "return_name": process.env.DELHIVERY_PICKUP_NAME,
          "products_desc": "Apparel/Merchandise",
          "cod_amount": order.payment.method === "COD" ? (order.pricing.finalTotal - order.payment.amountPaidOnline) : 0,
          "order_date": order.createdAt,
          "total_amount": order.pricing.finalTotal,
          "quantity": order.items.length,
          "weight": totalWeightGrams, // Added weight
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

    // 5. Use URLSearchParams (Crucial Fix)
    const params = new URLSearchParams();
    params.append("format", "json");
    params.append("data", JSON.stringify(shipmentData));

    // 6. API Call
    const response = await axios.post(
      `${baseUrl}/api/cmu/create.json`,
      params,
      {
        headers: {
          "Authorization": `Token ${process.env.DELHIVERY_API_TOKEN}`,
          // Axios automatically sets content-type for URLSearchParams
        }
      }
    );

    // 7. Handle Response
    if (response.data && response.data.packages && response.data.packages.length > 0) {
      const pkg = response.data.packages[0];

      if (pkg.status === "Success") {
        console.log(`✅ [Delhivery] Shipment created. AWB: ${pkg.waybill}`);
        
        order.orderStatus = "shipped";
        order.tracking = {
          trackingId: pkg.waybill,
          courier: "Delhivery",
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
      // If error is true but no package info
      console.error("Delhivery Raw Response:", JSON.stringify(response.data));
      throw new Error(JSON.stringify(response.data));
    }

  } catch (error) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ [Delhivery] Sync Failed:`, msg);
    throw new Error(msg);
  }
};

// ==================== NEW: MANUAL SHIP BUTTON CONTROLLER ====================
export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Find Order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // 2. Validate Status
    // If order is marked shipped AND has an AWB, we block re-shipping.
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

    // 3. Trigger Sync
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

    // 1. Main Order Status Filter
    // Safe check: ignore "all" string from frontend dropdowns
    if (status && status !== "" && status !== "all") {
      query.orderStatus = status;
    }

    // 2. Return Status Filter
    if (returnStatus) {
      if (returnStatus === 'active') {
        query["returnInfo.status"] = { $in: ['requested', 'approved', 'received', 'qc_passed'] };
      } else if (returnStatus === 'history') {
        query["returnInfo.status"] = { $in: ['completed', 'rejected', 'refund_processed'] };
      } else if (returnStatus !== 'all' && returnStatus !== '') {
        query["returnInfo.status"] = returnStatus;
      } else if (returnStatus === 'all') {
        query["returnInfo.status"] = { $ne: 'none' };
      }
    }

    // 3. Date Range Filter
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

    // 4. Search Logic
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

    // 5. Execute Query
    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // 6. Count
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

// ==================== MANAGE RETURN REQUEST (Modified) ====================
export const manageReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid return action" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.returnInfo || order.returnInfo.status === 'none') {
      return res.status(400).json({ message: "No active return request found" });
    }

    // --- AUTOMATION LOGIC ---
    let pickupAWB = null;

    // Only trigger Delhivery if status is being set to 'approved' AND it hasn't been approved before
    if (status === 'approved' && order.returnInfo.status !== 'approved') {
      try {
        const result = await createReversePickup(order);
        pickupAWB = result.awb;
        // Append tracking info to admin note automatically
        const autoNote = `Reverse Pickup Scheduled. AWB: ${result.awb}`;
        order.returnInfo.adminNote = note ? `${note} | ${autoNote}` : autoNote;
      } catch (apiError) {
        return res.status(500).json({
          success: false,
          message: "Failed to schedule Delhivery Reverse Pickup. Please check address/pincode.",
          error: apiError.message
        });
      }
    } else {
      order.returnInfo.adminNote = note || "";
    }

    // Update Status
    order.returnInfo.status = status;

    // Update Timeline
    order.returnInfo.timeline.push({
      status: status === 'completed' ? 'Return Completed' : `Return ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      date: new Date(),
      note: note || (status === 'approved' ? `Approved. Pickup AWB: ${pickupAWB}` : 'Updated by admin')
    });

    if (status === 'rejected') {
      order.returnInfo.isReturnActive = false;
    }

    if (status === 'completed') {
      order.orderStatus = 'returned';
      order.returnInfo.isReturnActive = false;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Return request marked as ${status}`,
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
          "returnInfo.status": { $in: ['requested', 'approved', 'received', 'qc_passed'] }
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