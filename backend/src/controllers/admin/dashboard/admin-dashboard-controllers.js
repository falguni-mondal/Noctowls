import Order from "../../../models/order-model.js";
import User from "../../../models/user-model.js";

// ==================== GET DASHBOARD STATS ====================
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    
    // 1. Define Time Ranges
    // Start of Current Month (e.g., Jan 1st, 00:00:00)
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Previous Month Ranges (for KPI comparison)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // =========================================================================
    // 1. KPI CARDS
    // =========================================================================
    const [currentMonthUsers, lastMonthUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);

    const financialStats = await Order.aggregate([
      { 
        $match: { 
          // Filter financials for the current month
          createdAt: { $gte: startOfCurrentMonth },
          orderStatus: { $nin: ["cancelled", "returned"] } 
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$pricing.finalTotal" },
          totalGST: { $sum: "$pricing.tax" }, 
          estimatedProfit: { $sum: { $multiply: ["$pricing.finalTotal", 0.25] } } 
        }
      }
    ]);

    const currentStats = financialStats[0] || { totalSales: 0, totalGST: 0, estimatedProfit: 0 };

    // =========================================================================
    // 2. ANALYTICS GRAPHS
    // =========================================================================

    // --- A. SALES TREND (Line Chart) ---
    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth }, 
          orderStatus: { $nin: ["cancelled"] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$pricing.finalTotal" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
            _id: 0,
            date: "$_id",
            value: "$sales",
            orders: 1
        }
      }
    ]);

    // --- B. CATEGORY DISTRIBUTION (Pie Chart) ---
    const categoryStats = await Order.aggregate([
      { 
        $match: { 
            orderStatus: { $nin: ["cancelled"] } 
        } 
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          revenue: { $sum: "$items.itemTotal" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $project: {
            _id: 0,
            name: "$_id",
            value: "$revenue"
        }
      }
    ]);

    // --- C. TOP SELLING PRODUCTS (Bar Chart) ---
    const topProducts = await Order.aggregate([
        { 
            $match: { 
                orderStatus: { $nin: ["cancelled"] } 
            } 
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productName",
                sold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.itemTotal" }
            }
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                name: "$_id",
                value: "$sold",
                revenue: 1
            }
        }
    ]);

    // --- D. ORDER STATUS BREAKDOWN ---
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
            _id: 0,
            name: "$_id",
            value: "$count"
        }
      }
    ]);

    // =========================================================================
    // 3. RECENT ORDERS
    // =========================================================================
    const recentOrders = await Order.find()
      .populate("user", "name email image")
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      cards: {
        users: {
          current: currentMonthUsers,
          last: lastMonthUsers,
          growth: lastMonthUsers === 0 ? 100 : ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
        },
        revenue: currentStats.totalSales,
        profit: currentStats.estimatedProfit,
        gst: currentStats.totalGST
      },
      analytics: {
        salesTrend,
        categories: categoryStats,
        topProducts,
        orderStatus: orderStatusStats
      },
      recentOrders
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics",
      error: error.message
    });
  }
};