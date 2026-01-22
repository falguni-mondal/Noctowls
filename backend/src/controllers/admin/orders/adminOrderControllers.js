import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";

// ==================== GET ALL ORDERS (ADMIN) ====================
// Supports: Pagination, Filtering (Status, Date), Searching (Order ID/Guest Email)
export const getAllAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;

    const query = {};

    // 1. Status Filter
    if (status && status !== "") {
      query.orderStatus = status;
    }

    // 2. Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Ensure full day coverage

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // 3. Search Logic (Order Number, Guest Email, or Phone)
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

    // 4. Execute Query with Pagination
    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // 5. Get Total Count for Pagination
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

// ... (Rest of the file remains unchanged: getAdminOrderById, updateOrderStatus, etc.)
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

    // Validate Status
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

    // Logic: If order is already delivered, prevent changing back to pending
    if (order.orderStatus === "delivered" && status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of a delivered order",
      });
    }

    // --- CANCELLATION LOGIC (Standardized) ---
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      // Use the model method to handle Refunds (COD logic) & Coupon logic
      const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(
        "admin",
        "Cancelled by Admin"
      );

      // Restore Stock & Revert Sales Count
      for (const item of cancelledOrder.items) {
        if (item.isFreeGift) continue;

        const product = await Product.findById(item.product);
        if (product) {
          const sizeIndex = product.sizes.findIndex(
            (s) => s.value === item.size.value
          );
          if (sizeIndex !== -1) {
            // Restore stock
            product.sizes[sizeIndex].stock += item.quantity;
            
            // Revert sales count (Prevent negative)
            product.sizes[sizeIndex].salesCount = Math.max(
              0, 
              product.sizes[sizeIndex].salesCount - item.quantity
            );
            
            await product.save();
          }
        }
      }

      // Decrement Coupon Usage if applicable
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
        message: "Order cancelled by Admin successfully",
        order: cancelledOrder,
      });
    }

    // --- STANDARD STATUS UPDATE ---

    // Logic: If delivering a COD order, mark payment as completed
    if (
      status === "delivered" &&
      order.payment.method === "COD" &&
      order.payment.status === "pending"
    ) {
      order.payment.status = "completed";
      // Ensure paidOnDelivery matches the pending amount
      // Since it's inclusive tax, amountPaidOnDelivery is (FinalTotal - PaidOnline)
      order.payment.paidAt = new Date();
    }

    order.orderStatus = status;

    // Optional: Add tracking info if provided in body
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

// ==================== DELETE ORDER (Admin Only) ====================
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only allow deleting cancelled orders to maintain financial records consistency
    if (order.orderStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Only cancelled orders can be deleted to maintain stock/financial integrity.",
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

// ==================== GET ORDER STATS (Dashboard) ====================
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          // Gross Sales (Inclusive of Tax)
          totalSales: { $sum: "$pricing.finalTotal" },
          // Net Revenue (Exclusive of Tax)
          netRevenue: { $sum: "$subTotal" },
          // Total Tax Collected
          totalTax: { $sum: "$totalGST" },
        },
      },
    ]);

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