import Wishlist from "../../../models/wishlist-model.js";
import Product from "../../../models/product-model.js";
import Cart from "../../../models/cart-model.js";

// ==================== GET WISHLIST ====================
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user;

    // Find or create wishlist
    let wishlist = await Wishlist.findOrCreate(userId);

    // Populate products
    wishlist = await Wishlist.getWithProducts(userId);

    if (!wishlist) {
      wishlist = {
        user: userId,
        items: [],
        itemsCount: 0,
      };
    }

    return res.status(200).json({
      success: true,
      wishlist,
      itemsCount: wishlist.items?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

// ==================== ADD TO WISHLIST ====================
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.body;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).select("_id name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOrCreate(userId);

    // Check if product already exists
    if (wishlist.hasProduct(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    // Add product
    wishlist.addProduct(productId);
    await wishlist.save();

    // Get updated wishlist with products
    wishlist = await Wishlist.getWithProducts(userId);

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
      itemsCount: wishlist.items?.length || 0,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add to wishlist",
      error: error.message,
    });
  }
};

// ==================== REMOVE FROM WISHLIST ====================
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.params;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Find wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    // Check if product exists in wishlist
    if (!wishlist.hasProduct(productId)) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Remove product
    wishlist.removeProduct(productId);
    await wishlist.save();

    // Get updated wishlist with products
    wishlist = await Wishlist.getWithProducts(userId);

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
      itemsCount: wishlist.items?.length || 0,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist",
      error: error.message,
    });
  }
};

// ==================== TOGGLE WISHLIST ====================
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.body;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).select("_id name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOrCreate(userId);

    let message;
    let isInWishlist;

    // Toggle: If exists, remove; if not, add
    if (wishlist.hasProduct(productId)) {
      wishlist.removeProduct(productId);
      message = "Product removed from wishlist";
      isInWishlist = false;
    } else {
      wishlist.addProduct(productId);
      message = "Product added to wishlist";
      isInWishlist = true;
    }

    await wishlist.save();

    // Get updated wishlist with products
    wishlist = await Wishlist.getWithProducts(userId);

    return res.status(200).json({
      success: true,
      message,
      isInWishlist,
      wishlist,
      itemsCount: wishlist.items?.length || 0,
    });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle wishlist",
      error: error.message,
    });
  }
};

// ==================== CHECK IF PRODUCT IN WISHLIST ====================
export const checkProductInWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.params;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const isInWishlist = await Wishlist.isProductInWishlist(userId, productId);

    return res.status(200).json({
      success: true,
      isInWishlist,
      productId,
    });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check wishlist",
      error: error.message,
    });
  }
};

// ==================== CLEAR WISHLIST ====================
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    // Clear all items
    wishlist.clearAll();
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared",
      wishlist: {
        user: userId,
        items: [],
        itemsCount: 0,
      },
    });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
      error: error.message,
    });
  }
};

// ==================== GET WISHLIST ITEMS COUNT ====================
export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user;

    const count = await Wishlist.getItemsCount(userId);

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching wishlist count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist count",
      error: error.message,
    });
  }
};

// ==================== MOVE WISHLIST ITEM TO CART ====================
export const moveToCart = async (req, res) => {
  try {
    const userId = req.user;
    const { productId, sizeValue, quantity = 1 } = req.body;

    // Validate inputs
    if (!productId || !sizeValue) {
      return res.status(400).json({
        success: false,
        message: "Product ID and size are required",
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 10",
      });
    }

    // Check if product exists in wishlist
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist || !wishlist.hasProduct(productId)) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Check if product exists and get full details
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is published
    if (product.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Product is no longer available",
      });
    }

    // Find the selected size
    const sizeObj = product.sizes.find((s) => s.value === sizeValue);

    if (!sizeObj) {
      return res.status(400).json({
        success: false,
        message: "Invalid size selected",
      });
    }

    // Check stock availability
    if (sizeObj.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${sizeObj.stock} ${
          sizeObj.stock === 1 ? "item" : "items"
        } available`,
      });
    }

    // Get or create cart for user
    let cart = await Cart.getOrCreateCart({ userId, deviceId: null });

    // Prepare cart item data
    const cartItemData = {
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "", // First product image
      category: product.category,
      size: {
        value: sizeObj.value,
        label: sizeObj.label || sizeObj.value.toUpperCase(),
        skuCode: sizeObj.skuCode,
      },
      quantity: qty,
      originalPrice: sizeObj.originalPrice,
      price: sizeObj.numPrice,
      discount: sizeObj.discount,
      isFreeGift: false,
    };

    // Add item to cart
    await cart.addItem(cartItemData);

    // Remove product from wishlist
    wishlist.removeProduct(productId);
    await wishlist.save();

    // Get updated wishlist with products
    const updatedWishlist = await Wishlist.getWithProducts(userId);

    // Get updated cart (populate products)
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      message: `${product.name} moved to cart successfully`,
      wishlist: updatedWishlist,
      cart: cart,
      itemsCount: updatedWishlist?.items?.length || 0,
    });
  } catch (error) {
    console.error("Error moving to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to move to cart",
      error: error.message,
    });
  }
};