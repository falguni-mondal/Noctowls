import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";

// ==================== GET ALL ORDERS (ADMIN) ====================
// Supports: Pagination, Status Filtering, Date Range, Search, AND Return Management
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
    if (status && status !== "") {
      query.orderStatus = status;
    }

    // 2. Return Status Filter (For Return Dashboard)
    // Allows fetching "requested", "approved", "completed", or "all" active returns
    if (returnStatus) {
        if (returnStatus === 'active') {
            // Fetch everything that is NOT 'none' and NOT 'completed'/'rejected' if you strictly want "active"
            // Or simpler: fetch where status is 'requested' or 'approved'
            query["returnInfo.status"] = { $in: ['requested', 'approved', 'received', 'qc_passed'] };
        } else if (returnStatus === 'history') {
             query["returnInfo.status"] = { $in: ['completed', 'rejected', 'refund_processed'] };
        } else if (returnStatus !== 'all') {
            // Fetch specific status (e.g. ?returnStatus=requested)
            query["returnInfo.status"] = returnStatus;
        } else {
            // ?returnStatus=all -> Fetch ANY order that has ever had a return interaction
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

    // Because 'returnInfo' is embedded in the Order Schema, 
    // simply finding the order retrieves the return details automatically.
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
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent changing delivered/returned orders back to pending
    if (["delivered", "returned"].includes(order.orderStatus) && !["delivered", "returned"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of a completed order",
      });
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
    if (
      status === "delivered" &&
      order.payment.method === "COD" &&
      order.payment.status === "pending"
    ) {
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

// ==================== NEW: MANAGE RETURN REQUEST ====================
// Used by Admin Order Details page to Approve/Reject/Refund returns
export const manageReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body; // status: approved, rejected, completed

    const validStatuses = ["approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid return action" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Validate current state
    if (!order.returnInfo || order.returnInfo.status === 'none') {
        return res.status(400).json({ message: "No active return request found" });
    }

    // Update Return Info
    order.returnInfo.status = status;
    order.returnInfo.adminNote = note || "";
    
    // Update Timeline
    order.returnInfo.timeline.push({
        status: status === 'completed' ? 'Return Completed' : `Return ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        date: new Date(),
        note: note || (status === 'approved' ? 'Request approved by admin' : 'Request rejected by admin')
    });

    // --- State Logic ---
    
    // 1. If Rejected -> Mark active as false
    if (status === 'rejected') {
        order.returnInfo.isReturnActive = false; 
    }

    // 2. If Completed (Money Refunded) -> Mark Order as Returned
    if (status === 'completed') {
        order.orderStatus = 'returned';
        order.returnInfo.isReturnActive = false;
        
        // Optional: Add logic here if you want to auto-restock returned items
        // For simplicity in this approach, we assume restocking is manual or items are damaged.
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

    // We filter for statuses that require admin attention.
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