import User from "../../../models/user-model.js";
import Order from "../../../models/order-model.js";
import Cart from "../../../models/cart-model.js";
import Address from "../../../models/address-model.js";

// ==================== GET ALL USERS (LIST) ====================
export const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status, // 'verified', 'unverified'
            startDate,
            endDate,
            sortBy = "newest"
        } = req.query;

        const query = {};

        // 1. Search (Name, Email, Phone)
        if (search) {
            const searchRegex = new RegExp(search, "i");
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }

        // 2. Role Filter
        if (role && role !== "all") {
            query.role = role;
        }

        // 3. Status Filter (Verified/Unverified)
        if (status) {
            if (status === "verified") query.isVerified = true;
            if (status === "unverified") query.isVerified = false;
        }

        // 4. Date Range Filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.createdAt = { $gte: start, $lte: end };
        }

        // 5. Sorting Logic
        let sortOptions = { createdAt: -1 }; // Default: Newest
        switch (sortBy) {
            case "oldest": sortOptions = { createdAt: 1 }; break;
            case "name_asc": sortOptions = { name: 1 }; break;
            case "name_desc": sortOptions = { name: -1 }; break;
        }

        // Execute Query
        const users = await User.find(query)
            .select("-password -verificationCode -verificationCodeTime") // Exclude sensitive data
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                totalUsers: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error("Get All Users Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

// ==================== GET SINGLE USER DETAILS ====================
export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Fetch Basic User Info (Populate Wishlist)
        const user = await User.findById(userId)
            .select("-password -verificationCode")
            .populate({
                path: "wishlist",
                select: "name price images category stock", // Minified product details for wishlist
            });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. Run parallel queries for related data
        const [orders, cart, addresses, stats] = await Promise.all([
            // A. Fetch Order History
            Order.find({ user: userId })
                .sort({ createdAt: -1 }),

            // B. Fetch Current Cart
            Cart.findOne({ user: userId }).populate("items.product", "name images price stock"),

            // C. Fetch Saved Addresses
            Address.find({ user: userId }),

            // D. Aggregate Total Spend & Order Count
            Order.aggregate([
                { $match: { user: user._id, orderStatus: { $ne: "cancelled" } } },
                {
                    $group: {
                        _id: null,
                        totalSpent: { $sum: "$pricing.finalTotal" },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Construct the detailed response
        const userOverview = {
            profile: user,
            stats: {
                totalSpent: stats[0]?.totalSpent || 0,
                ordersCount: stats[0]?.totalOrders || 0,
                addressesCount: addresses.length,
            },
            addresses,
            cart: cart ? cart.items : [],
            wishlist: user.wishlist || [],
            orders: orders, // Provide full list, frontend can slice/paginate if needed
        };

        return res.status(200).json({
            success: true,
            data: userOverview,
        });

    } catch (error) {
        console.error("Get User Details Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user details",
            error: error.message,
        });
    }
};

// ==================== DELETE USER (Optional) ====================
// Useful if you want admin to be able to ban/delete users
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: "Cannot delete admin accounts" });

        await User.findByIdAndDelete(userId);

        // Optional: Clean up cart/addresses? 
        // Usually better to keep orders for financial records but nullify the user link

        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}