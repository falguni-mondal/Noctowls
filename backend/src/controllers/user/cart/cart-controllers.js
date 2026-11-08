import Cart from "../../../models/cart-model.js";
import Product from "../../../models/product-model.js";
import Coupon from "../../../models/coupon-model.js";
import cookieOptions from "../../../utils/cookie-options.js";
import { randomUUID } from "crypto";

// Helper to safely extract string ID whether `item.product` is populated or an ObjectId
const extractProductId = (prodRef) => {
  if (!prodRef) return "";
  if (typeof prodRef === "object" && prodRef._id) {
    return String(prodRef._id);
  }
  return String(prodRef);
};

// robust cookie handling for guest persistence
const getCartIdentifier = (req, res) => {
  const userId = req.user || null;
  let deviceId = null;

  // ONLY need deviceId if user is NOT logged in
  if (!userId) {
    deviceId = req.cookies.device_id;

    if (!deviceId) {
      deviceId = randomUUID();
    }

    res.cookie("device_id", deviceId, {
      ...cookieOptions,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }

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

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await Cart.deleteMany({
      items: { $size: 0 },
      createdAt: { $lte: twoMinutesAgo },
    });

    const cart = await Cart.findOne(
      userId ? { user: userId } : { deviceId }
    ).populate("items.product");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          coupon: { isApplied: false },
          freeGifts: { eligible: false, gifts: [] },
          summary: {
            totalQuantity: 0,
            itemsCount: 0,
            subtotal: 0,
            couponDiscount: 0,
            total: 0,
          },
        },
        isGuest: !userId,
        freeGiftsDescription: "Add more items to unlock free gifts!",
        nextTierInfo: {
          itemsNeeded: 1,
          nextTier: 1,
          progress: 0,
          message: "Add 1 item to get 1 Anime Keychain + 5 Stickers FREE!",
        },
      });
    }

    await cart.cleanInvalidItems();
    await cart.populate("items.product");

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

    if (!productId || !sizeValue || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, size, and quantity are required",
      });
    }

    const parsedQuantity = Number(quantity);
    if (parsedQuantity < 1 || !Number.isInteger(parsedQuantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This product is not available for purchase",
      });
    }

    const normalizedSize = String(sizeValue).toLowerCase().trim();
    const sizeData =
      product.sizes.find((s) => s.value === normalizedSize) ||
      product.sizes.find((s) => s.stock > 0) ||
      product.sizes[0];

    if (!sizeData) {
      return res.status(404).json({
        success: false,
        message: "Size not found for this product",
      });
    }

    if (sizeData.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "This product is out of stock",
        availableStock: 0,
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });
    await cart.cleanInvalidItems();

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
      quantity: parsedQuantity,
      originalPrice: sizeData.originalPrice,
      price: sizeData.numPrice,
      discount: sizeData.discount,
      isFreeGift: false,
    });

    await cart.populate("items.product");

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

    const parsedQuantity = Number(quantity);
    if (
      quantity === undefined ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required (0 or positive integer)",
      });
    }

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    if (item.isFreeGift) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify free gift items",
      });
    }

    if (parsedQuantity === 0) {
      await cart.removeItem(itemId);
      await cart.populate("items.product");
      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        cart,
        isGuest: !userId,
        freeGiftsDescription: cart.getFreeGiftsDescription(),
        nextTierInfo: cart.getNextTierInfo(),
      });
    }

    const productId = extractProductId(item.product);
    const product = await Product.findById(productId);
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

    await cart.updateItemQuantity(itemId, parsedQuantity);
    await cart.populate("items.product");

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

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    if (item.isFreeGift) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove free gift items",
      });
    }

    await cart.removeItem(itemId);
    await cart.populate("items.product");

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

// ==================== APPLY COUPON (WITH BUILT-IN VALIDATION) ====================
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

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);
    if (nonGiftItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply coupon to empty cart",
      });
    }

    if (cart.coupon.isApplied) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cart.coupon.code}" is already applied. Remove it first to apply a different coupon.`,
        appliedCoupon: cart.coupon.code,
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    try {
      coupon.validateForCart(cart, userId, deviceId);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    await cart.applyCoupon(code, userId, deviceId);
    await cart.populate("items.product");

    const totalDiscount = cart.coupon.totalDiscount;

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${totalDiscount}`,
      cart,
      isGuest: !userId,
      discount: {
        code: coupon.code,
        amount: totalDiscount,
        type: coupon.discountType,
        value: coupon.discountValue,
        applyType: coupon.applyType,
      },
      pricing: {
        subtotal: cart.summary.subtotal,
        couponDiscount: totalDiscount,
        total: cart.summary.total,
      },
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
    await cart.populate("items.product");

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

// ==================== VALIDATE COUPON ====================
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

    const cart = await Cart.getOrCreateCart({ userId, deviceId });

    if (cart.items.filter((item) => !item.isFreeGift).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    try {
      coupon.validateForCart(cart, userId, deviceId);

      const nonGiftItems = cart.items.filter((item) => !item.isFreeGift);
      const productsSubtotal = nonGiftItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      let potentialDiscount = 0;

      if (coupon.applyType === "each-product") {
        if (coupon.discountType === "fixed") {
          const totalQuantity = nonGiftItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          potentialDiscount = coupon.discountValue * totalQuantity;
        } else {
          nonGiftItems.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal * coupon.discountValue) / 100;
            potentialDiscount += itemDiscount;
          });
        }
      } else {
        if (coupon.discountType === "fixed") {
          potentialDiscount = coupon.discountValue;
        } else {
          potentialDiscount = (productsSubtotal * coupon.discountValue) / 100;
        }
      }

      potentialDiscount = Math.min(potentialDiscount, productsSubtotal);
      potentialDiscount = Math.round(potentialDiscount * 100) / 100;

      const remainingUses = coupon.getUserRemainingUses(userId, deviceId);

      return res.status(200).json({
        success: true,
        message: "Coupon is valid",
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          applyType: coupon.applyType,
          usageLimitType: coupon.usageLimitType,
          remainingUses,
          minPurchaseAmount: coupon.minPurchaseAmount,
          minItemsRequired: coupon.minItemsRequired,
          expiresAt: coupon.expiresAt,
        },
        potentialDiscount,
        currentTotal: productsSubtotal,
        newTotal: productsSubtotal - potentialDiscount,
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

// ==================== VALIDATE CART ====================
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

    if (cart.items.filter((item) => !item.isFreeGift).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    await cart.populate("items.product");

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
              discountType: cart.coupon.discountType,
              discountValue: cart.coupon.discountValue,
              applyType: cart.coupon.applyType,
              discount: cart.coupon.totalDiscount,
            }
          : null,
        freeGifts: cart.freeGifts.eligible
          ? {
              highestTier: cart.freeGifts.highestTier,
              totalTiers: cart.freeGifts.totalTiers,
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

// Cleanup expired guest carts
export const cleanupExpiredCarts = async (req, res) => {
  try {
    const now = new Date();

    const result = await Cart.deleteMany({
      deviceId: { $ne: null },
      user: null,
      expiresAt: { $lte: now },
    });

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired guest carts`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up carts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cleanup expired carts",
      error: error.message,
    });
  }
};