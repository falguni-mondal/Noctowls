import Order from "../../../models/order-model.js";
import Product from "../../../models/product-model.js";

// ==================== GET ALL ORDERS (ADMIN) ====================
// Supports: Pagination, Filtering (Status), Searching (Order ID/Guest Email)
export const getAllAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    // 1. Status Filter
    if (status && status !== "") {
      query.orderStatus = status;
    }

    // 2. Search Logic (Order Number or Guest Email)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { orderNumber: searchRegex },
        { "guestInfo.email": searchRegex },
        { "guestInfo.name": searchRegex },
        // Note: Searching registered user email requires lookup/aggregate, 
        // skipped here for performance unless strictly needed.
      ];
    }

    // 3. Execute Query with Pagination
    const orders = await Order.find(query)
      .populate("user", "name email phone") // Populate registered user details
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // 4. Get Total Count for Pagination
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

    // Validate Status
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
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

    // Logic: If delivering a COD order, mark payment as completed
    if (status === "delivered" && order.payment.method === "COD" && order.payment.status === "pending") {
      order.payment.status = "completed";
      order.payment.amountPaidOnDelivery = order.pricing.subtotalAfterCoupon; // Ensure this matches logic
    }

    // Logic: Handle Cancellation (Restock items)
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        if (item.isFreeGift) continue;
        
        await Product.findOneAndUpdate(
          { _id: item.product, "sizes.value": item.size.value },
          { 
            $inc: { 
              "sizes.$.stock": item.quantity, 
              "sizes.$.salesCount": -item.quantity,
              totalStock: item.quantity,
              totalSales: -item.quantity
            } 
          }
        );
      }
    }

    order.orderStatus = status;
    
    // Optional: Add tracking info if provided
    if (status === "shipped" && req.body.trackingId) {
       // Assuming you might add a tracking schema later
       // order.shipping.trackingId = req.body.trackingId;
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
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow deleting cancelled orders to maintain financial records consistency
    // OR create a hard delete flag logic
    if (order.orderStatus !== "cancelled") {
        return res.status(400).json({ 
            success: false, 
            message: "Only cancelled orders can be deleted to maintain stock/financial integrity." 
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
          totalRevenue: { $sum: "$pricing.finalTotal" }
        }
      }
    ]);

    const totalOrders = stats.reduce((acc, curr) => acc + curr.count, 0);
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalRevenue, 0);

    return res.status(200).json({
      success: true,
      stats: {
        breakdown: stats,
        totalOrders,
        totalRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};