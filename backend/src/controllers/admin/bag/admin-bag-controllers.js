import Cart from "../../../models/cart-model.js";
import User from "../../../models/user-model.js";
import Product from "../../../models/product-model.js";

// ==================== GET ALL ACTIVE BAGS ====================
export const getAllBags = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {
      items: { $exists: true, $not: { $size: 0 } } // Ensure cart is not empty
    };

    // --- Search Logic ---
    if (search) {
      const searchRegex = new RegExp(search, "i");
      
      // 1. Find Users matching Name, Email, or Phone
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).select("_id");
      const userIds = users.map(user => user._id);

      // 2. Find Products matching Name or Category (for indirect lookup)
      const products = await Product.find({
        $or: [
            { name: searchRegex },
            { category: searchRegex }
        ]
      }).select("_id");
      const productIds = products.map(p => p._id);

      // 3. Construct Main Query
      query.$or = [
        { user: { $in: userIds } },
        { "items.product": { $in: productIds } },
        { "items.size.skuCode": searchRegex },
        { "items.name": searchRegex }
      ];
    }

    // --- Execute Query ---
    const bags = await Cart.find(query)
      .populate("user", "name email phone image")
      .populate({
        path: "items.product",
        select: "name images price category slug"
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Cart.countDocuments(query);

    // --- Calculate Bag Totals ---
    const activeBags = bags.map(bag => {
      const bagObj = bag.toObject();
      let bagTotal = 0;
      let itemCount = 0;

      if (bagObj.items) {
        bagObj.items.forEach(item => {
          if (item.product) {
            const price = item.price !== undefined ? item.price : item.product.price;
            bagTotal += (price || 0) * item.quantity;
            itemCount += item.quantity;
          }
        });
      }
      
      return {
        ...bagObj,
        calculatedTotal: bagTotal,
        totalItems: itemCount
      };
    });

    return res.status(200).json({
      success: true,
      bags: activeBags,
      pagination: {
        totalBags: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error("Get All Bags Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active bags",
      error: error.message,
    });
  }
};

// ==================== DELETE BAG ====================
export const deleteBag = async (req, res) => {
    try {
        const { bagId } = req.params;
        const deletedBag = await Cart.findByIdAndDelete(bagId);

        if (!deletedBag) {
            return res.status(404).json({ success: false, message: "Bag not found" });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Bag deleted successfully",
            bagId 
        });

    } catch (error) {
        console.error("Delete Bag Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};