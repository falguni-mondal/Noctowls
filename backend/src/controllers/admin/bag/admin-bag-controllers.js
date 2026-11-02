import Cart from "../../../models/cart-model.js";
import User from "../../../models/user-model.js";
import Product from "../../../models/product-model.js";

/**
 * Helper: Extract creation timestamp (ms) from a document or subdocument,
 * falling back to the embedded timestamp in its MongoDB ObjectId (`_id`).
 */
const getDocTimestamp = (doc, preferUpdated = false) => {
  if (!doc) return 0;
  if (preferUpdated && doc.updatedAt) {
    const t = new Date(doc.updatedAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (doc.createdAt) {
    const t = new Date(doc.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const rawId = String(doc._id || doc.id || "");
  if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
    return parseInt(rawId.substring(0, 8), 16) * 1000;
  }
  return 0;
};

/**
 * Sort cart items so the latest added non-gift item is 1st, while free gifts stay at the end.
 */
const sortCartItemsLatestFirst = (items = []) => {
  if (!Array.isArray(items) || items.length <= 1) return items || [];
  const indexed = items.map((item, idx) => ({ item, idx }));
  const regular = indexed.filter(
    ({ item }) => !(item.isFreeGift || item.price === 0)
  );
  const gifts = indexed.filter(
    ({ item }) => item.isFreeGift || item.price === 0
  );

  regular.sort((a, b) => {
    const timeDiff =
      getDocTimestamp(b.item, true) - getDocTimestamp(a.item, true);
    if (timeDiff !== 0) return timeDiff;
    const idA = String(a.item?._id || "");
    const idB = String(b.item?._id || "");
    if (idA && idB && idA !== idB) return idB.localeCompare(idA);
    // Fallback: if items were pushed sequentially in the same millisecond, reverse index puts latest first
    return b.idx - a.idx;
  });

  return [...regular.map((x) => x.item), ...gifts.map((x) => x.item)];
};

// ==================== GET ALL ACTIVE BAGS ====================
export const getAllBags = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const query = {
      items: { $exists: true, $not: { $size: 0 } }, // Ensure cart is not empty
    };

    // --- Search Logic ---
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // 1. Find Users matching Name, Email, or Phone
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      }).select("_id");
      const userIds = users.map((user) => user._id);

      // 2. Find Products matching Name or Category (for indirect lookup)
      const products = await Product.find({
        $or: [{ name: searchRegex }, { category: searchRegex }],
      }).select("_id");
      const productIds = products.map((p) => p._id);

      // 3. Construct Main Query
      query.$or = [
        { user: { $in: userIds } },
        { "items.product": { $in: productIds } },
        { "items.size.skuCode": searchRegex },
        { "items.name": searchRegex },
      ];
    }

    // --- Execute Query (Latest First: updatedAt -> createdAt -> _id) ---
    const bags = await Cart.find(query)
      .populate("user", "name email phone image")
      .populate({
        path: "items.product",
        select: "name images price category slug",
      })
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const count = await Cart.countDocuments(query);

    // --- Calculate Bag Totals & Sort Each Bag's Items Latest-First ---
    const activeBags = bags
      .map((bag) => {
        const bagObj = bag.toObject();
        let bagTotal = 0;
        let itemCount = 0;

        if (Array.isArray(bagObj.items)) {
          bagObj.items = sortCartItemsLatestFirst(bagObj.items);
          bagObj.items.forEach((item) => {
            if (item.product && !item.isFreeGift && item.price !== 0) {
              const price =
                item.price !== undefined ? item.price : item.product.price;
              bagTotal += (price || 0) * item.quantity;
              itemCount += item.quantity;
            }
          });
        }

        return {
          ...bagObj,
          calculatedTotal: bagTotal,
          totalItems: itemCount,
        };
      })
      .sort((a, b) => {
        const diff = getDocTimestamp(b, true) - getDocTimestamp(a, true);
        if (diff !== 0) return diff;
        return String(b._id).localeCompare(String(a._id));
      });

    return res.status(200).json({
      success: true,
      bags: activeBags,
      pagination: {
        totalBags: count,
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
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
      bagId,
    });
  } catch (error) {
    console.error("Delete Bag Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};