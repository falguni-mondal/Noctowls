import Cart from "../../../models/cart-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";
import cookieOptions from "../../../utils/cookie-options.js";
import { randomUUID } from "crypto";

// Helper to get cart identifier
const getCartIdentifier = (req, res) => {
  const userId = req.user || null;
  let deviceId = null;

  // ONLY use deviceId if user is NOT logged in
  if (!userId) {
    const reqDeviceId = req.cookies.device_id;
    deviceId = reqDeviceId || randomUUID();

    // Set cookie only for guest users
    if (!reqDeviceId) {
      res.cookie("device_id", deviceId, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
  }
  // If userId exists, deviceId remains null

  return { userId, deviceId };
};

// ==================== GET CART ====================
export const getCart = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    return res.status(200).json({
      success: true,
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// ==================== ADD TO CART ====================
export const addToCart = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);
    const { productId, sizeValue, quantity } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    // Validate input
    if (!productId || !sizeValue || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, size, and quantity are required",
      });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Find product
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
        message: "This product is not available for purchase",
      });
    }

    // Find size
    const sizeData = product.sizes.find(
      (s) => s.value === sizeValue.toLowerCase().trim()
    );
    if (!sizeData) {
      return res.status(404).json({
        success: false,
        message: "Size not found for this product",
      });
    }

    // Check stock availability
    if (sizeData.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "This product is out of stock",
        availableStock: 0,
      });
    }

    if (sizeData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${sizeData.stock} items available in stock`,
        availableStock: sizeData.stock,
      });
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) =>
        !item.isFreeGift &&
        item.product.toString() === productId &&
        item.size.value === sizeValue.toLowerCase().trim()
    );

    // Validate total quantity (existing + new)
    if (existingItem) {
      const totalQuantity = existingItem.quantity + quantity;
      if (sizeData.stock < totalQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more. Only ${
            sizeData.stock - existingItem.quantity
          } items available`,
          availableStock: sizeData.stock,
          currentCartQuantity: existingItem.quantity,
        });
      }
    }

    // Add item to cart
    await cart.addItem({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      category: product.category,
      size: {
        value: sizeData.value,
        label: sizeData.label || sizeData.value.toUpperCase(),
        skuCode: sizeData.skuCode,
      },
      quantity,
      originalPrice: sizeData.originalPrice,
      price: sizeData.numPrice,
      discount: sizeData.discount,
      isFreeGift: false,
    });

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

// ==================== UPDATE CART ITEM QUANTITY ====================
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    // Validate quantity
    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required (0 or positive integer)",
      });
    }

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Find item
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Check if it's a free gift
    if (item.isFreeGift) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify free gift items",
      });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cart.removeItem(itemId);
      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        cart,
        isGuest: !userId,
        freeGiftsDescription: cart.getFreeGiftsDescription(),
        nextTierInfo: cart.getNextTierInfo(),
      });
    }

    // Validate stock for new quantity
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This product is no longer available",
      });
    }

    const sizeData = product.sizes.find((s) => s.value === item.size.value);
    if (!sizeData) {
      return res.status(404).json({
        success: false,
        message: "Size not available",
      });
    }

    if (sizeData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${sizeData.stock} items available in stock`,
        availableStock: sizeData.stock,
      });
    }

    // Update quantity
    await cart.updateItemQuantity(itemId, quantity);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cart item",
      error: error.message,
    });
  }
};

// ==================== REMOVE ITEM FROM CART ====================
export const removeCartItem = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);
    const { itemId } = req.params;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Find item
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Check if it's a free gift
    if (item.isFreeGift) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove free gift items",
      });
    }

    await cart.removeItem(itemId);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// ==================== APPLY COUPON ====================
export const applyCoupon = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);
    const { code } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Check if cart is empty
    if (cart.items.filter((item) => !item.isFreeGift).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply coupon to empty cart",
      });
    }

    // Check if a coupon is already applied
    if (cart.coupon.isApplied) {
      return res.status(400).json({
        success: false,
        message: `Remove existing coupon "${cart.coupon.code}" first`,
      });
    }

    // Find and validate coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    try {
      // Validate coupon for this cart
      coupon.validateForCart(cart);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    // Apply coupon to cart
    await cart.applyCoupon(code);

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${cart.coupon.totalDiscount}`,
      cart,
      isGuest: !userId,
      couponDiscount: cart.coupon.totalDiscount,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to apply coupon",
    });
  }
};

// ==================== REMOVE COUPON ====================
export const removeCoupon = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (!cart.coupon.isApplied) {
      return res.status(400).json({
        success: false,
        message: "No coupon applied to cart",
      });
    }

    const removedCouponCode = cart.coupon.code;
    await cart.removeCoupon();

    return res.status(200).json({
      success: true,
      message: `Coupon "${removedCouponCode}" removed successfully`,
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove coupon",
      error: error.message,
    });
  }
};

// ==================== VALIDATE COUPON (Before Applying) ====================
export const validateCoupon = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);
    const { code } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    // Get cart
    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Check if cart is empty
    if (cart.items.filter((item) => !item.isFreeGift).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    try {
      // Validate coupon
      coupon.validateForCart(cart);

      // Calculate potential discount
      const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);
      const totalQuantity = nonGiftItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const potentialDiscount = coupon.discountPerItem * totalQuantity;

      return res.status(200).json({
        success: true,
        message: "Coupon is valid",
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountPerItem: coupon.discountPerItem,
          potentialDiscount,
          expiresAt: coupon.expiresAt,
          remainingUses: coupon.remainingUses,
        },
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

// ==================== CLEAR CART ====================
export const clearCart = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is already empty",
      });
    }

    await cart.clearCart();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
      isGuest: !userId,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

// ==================== VALIDATE CART (Check Stock Before Checkout) ====================
export const validateCart = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    // Check if cart is empty
    if (cart.items.filter((item) => !item.isFreeGift).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate cart items against current stock
    const validationResult = await cart.validateCart();

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Some items in your cart are not available",
        validationResults: validationResult.results,
        cart,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All items are available",
      cart,
      isGuest: !userId,
      freeGiftsDescription: cart.getFreeGiftsDescription(),
      nextTierInfo: cart.getNextTierInfo(),
    });
  } catch (error) {
    console.error("Error validating cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate cart",
      error: error.message,
    });
  }
};

// ==================== GET FREE GIFTS TIERS INFO ====================
export const getFreeGiftsTiers = async (req, res) => {
  try {
    const tiers = Cart.getFreeGiftsTiers();

    return res.status(200).json({
      success: true,
      tiers,
    });
  } catch (error) {
    console.error("Error fetching free gifts tiers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch free gifts information",
      error: error.message,
    });
  }
};

// ==================== GET CART SUMMARY ====================
export const getCartSummary = async (req, res) => {
  try {
    const { userId, deviceId } = getCartIdentifier(req, res);

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Unable to identify cart. Please refresh the page.",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);

    return res.status(200).json({
      success: true,
      summary: {
        totalItems: nonGiftItems.length,
        totalQuantity: cart.summary.totalQuantity,
        subtotal: cart.summary.subtotal,
        couponDiscount: cart.summary.couponDiscount,
        total: cart.summary.total,
        savings: cart.summary.couponDiscount,
        appliedCoupon: cart.coupon.isApplied
          ? {
              code: cart.coupon.code,
              discount: cart.coupon.totalDiscount,
            }
          : null,
        freeGifts: cart.freeGifts.eligible
          ? {
              tier: cart.freeGifts.tier,
              gifts: cart.freeGifts.gifts,
              description: cart.getFreeGiftsDescription(),
            }
          : null,
        nextTierInfo: cart.getNextTierInfo(),
      },
      isGuest: !userId,
    });
  } catch (error) {
    console.error("Error fetching cart summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart summary",
      error: error.message,
    });
  }
};
