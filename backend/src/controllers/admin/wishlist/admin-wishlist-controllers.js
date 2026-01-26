import Wishlist from "../../../models/wishlist-model.js";
import User from "../../../models/user-model.js";
import Product from "../../../models/product-model.js";

// ==================== GET ALL ACTIVE WISHLISTS ====================
export const getAllWishlists = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {
      items: { $exists: true, $not: { $size: 0 } }
    };

    // --- Search Logic ---
    if (search) {
      const searchRegex = new RegExp(search, "i");
      
      // 1. Find Users
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).select("_id");
      const userIds = users.map(user => user._id);

      // 2. Find Products (Name or Category)
      const products = await Product.find({
        $or: [
            { name: searchRegex },
            { category: searchRegex }
            // If Product model has 'sku', add: { sku: searchRegex }
        ]
      }).select("_id");
      const productIds = products.map(p => p._id);

      // 3. Construct Main Query
      query.$or = [
        { user: { $in: userIds } },               // User matches
        { "items.product": { $in: productIds } }  // Product in wishlist matches
      ];
    }

    // --- Execute Query ---
    const wishlists = await Wishlist.find(query)
      .populate("user", "name email phone image")
      .populate({
        path: "items.product",
        select: "name images price category slug inStock"
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Wishlist.countDocuments(query);

    // --- Format Response ---
    const formattedWishlists = wishlists.map(list => {
      const listObj = list.toObject();
      let totalValue = 0;
      let validItemsCount = 0;

      if (listObj.items) {
        listObj.items.forEach(item => {
          if (item.product) {
            totalValue += (item.product.price || 0);
            validItemsCount++;
          }
        });
      }
      
      return {
        ...listObj,
        totalValue,
        totalItems: validItemsCount
      };
    });

    return res.status(200).json({
      success: true,
      wishlists: formattedWishlists,
      pagination: {
        totalWishlists: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error("Get All Wishlists Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlists",
      error: error.message,
    });
  }
};

// ==================== DELETE WISHLIST ====================
export const deleteWishlist = async (req, res) => {
    try {
        const { wishlistId } = req.params;
        const deletedList = await Wishlist.findByIdAndDelete(wishlistId);

        if (!deletedList) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Wishlist deleted successfully",
            wishlistId 
        });

    } catch (error) {
        console.error("Delete Wishlist Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};