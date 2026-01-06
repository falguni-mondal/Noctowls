import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";
import { logoutUser, deleteAccount } from "./authSlice";
import { verifyPayment } from "./orderSlice";

// ==================== ASYNC THUNKS ====================

// Get cart
export const getCart = createAsyncThunk(
  "cart/getCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/cart");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cart"
      );
    }
  }
);

// Get cart summary
export const getCartSummary = createAsyncThunk(
  "cart/getCartSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/cart/summary");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cart summary"
      );
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, sizeValue, quantity }, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/cart/add", {
        productId,
        sizeValue,
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add item to cart"
      );
    }
  }
);

// Update cart item quantity
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await userApi.put(`/cart/item/${itemId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update cart item"
      );
    }
  }
);

// Remove item from cart
export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await userApi.delete(`/cart/item/${itemId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item from cart"
      );
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.delete("/cart/clear");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear cart"
      );
    }
  }
);

// Validate coupon
export const validateCoupon = createAsyncThunk(
  "cart/validateCoupon",
  async (code, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/cart/coupon/validate", { code });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to validate coupon"
      );
    }
  }
);

// Apply coupon
export const applyCoupon = createAsyncThunk(
  "cart/applyCoupon",
  async (code, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/cart/coupon/apply", { code });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply coupon"
      );
    }
  }
);

// Remove coupon
export const removeCoupon = createAsyncThunk(
  "cart/removeCoupon",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.delete("/cart/coupon/remove");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove coupon"
      );
    }
  }
);

// Validate cart (before checkout)
export const validateCart = createAsyncThunk(
  "cart/validateCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/cart/validate");
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Cart validation failed",
        validationResults: error.response?.data?.validationResults || [],
        cart: error.response?.data?.cart || null,
      });
    }
  }
);

// Get free gifts tiers
export const getFreeGiftsTiers = createAsyncThunk(
  "cart/getFreeGiftsTiers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/cart/free-gifts-tiers");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch free gifts tiers"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Cart data
  cart: null,
  isGuest: true,

  // Cart summary (lightweight)
  summary: null,

  // Free gifts tiers
  freeGiftsTiers: [],

  // Coupon validation
  couponValidation: {
    loading: false,
    error: null,
    data: null,
  },

  // Cart validation (before checkout)
  cartValidation: {
    loading: false,
    error: null,
    isValid: null,
    results: [],
  },

  // Loading states
  loading: false,
  summaryLoading: false,
  actionLoading: false,

  // Error states
  error: null,

  // Success messages
  successMessage: null,
};

// ==================== SLICE ====================

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
      state.couponValidation.error = null;
      state.cartValidation.error = null;
    },

    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Clear coupon validation
    clearCouponValidation: (state) => {
      state.couponValidation = {
        loading: false,
        error: null,
        data: null,
      };
    },

    // Clear cart validation
    clearCartValidation: (state) => {
      state.cartValidation = {
        loading: false,
        error: null,
        isValid: null,
        results: [],
      };
    },

    // Reset cart state (on logout)
    resetCart: (state) => {
      Object.assign(state, initialState);
    },

    // Set Cart Data (manual update)
    setCart: (state, action) => {
      state.cart = action.payload;
      state.isGuest = action.payload?.isGuest || false;
    },

    // Update cart item locally (optimistic update)
    updateCartItemLocally: (state, action) => {
      const { itemId, quantity } = action.payload;
      if (state.cart && state.cart.items) {
        const item = state.cart.items.find((i) => i._id === itemId);
        if (item && !item.isFreeGift) {
          item.quantity = quantity;
        }
      }
    },

    // Remove cart item locally (optimistic update)
    removeCartItemLocally: (state, action) => {
      const itemId = action.payload;
      if (state.cart && state.cart.items) {
        state.cart.items = state.cart.items.filter(
          (i) => i._id !== itemId || i.isFreeGift
        );
      }
    },
  },

  extraReducers: (builder) => {
    // ===== GET CART =====
    builder
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.error = null;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET CART SUMMARY =====
    builder
      .addCase(getCartSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(getCartSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload.summary;
        state.isGuest = action.payload.isGuest;
        state.error = null;
      })
      .addCase(getCartSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload;
      });

    // ===== ADD TO CART =====
    builder
      .addCase(addToCart.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== UPDATE CART ITEM QUANTITY =====
    builder
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== REMOVE CART ITEM =====
    builder
      .addCase(removeCartItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== CLEAR CART =====
    builder
      .addCase(clearCart.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;
        // Clear coupon validation when cart is cleared
        state.couponValidation = {
          loading: false,
          error: null,
          data: null,
        };
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== VALIDATE COUPON =====
    builder
      .addCase(validateCoupon.pending, (state) => {
        state.couponValidation.loading = true;
        state.couponValidation.error = null;
        state.couponValidation.data = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.couponValidation.loading = false;
        state.couponValidation.data = {
          ...action.payload.coupon,
          potentialDiscount: action.payload.potentialDiscount,
          currentTotal: action.payload.currentTotal,
          newTotal: action.payload.newTotal,
        };
        state.couponValidation.error = null;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.couponValidation.loading = false;
        state.couponValidation.error = action.payload;
        state.couponValidation.data = null;
      });

    // ===== APPLY COUPON =====
    builder
      .addCase(applyCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
        state.couponValidation.loading = true; // ← Show loading in UI
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;

        // Clear validation state after successful apply
        state.couponValidation = {
          loading: false,
          error: null,
          data: null,
        };
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;

        // Store error in coupon validation state
        state.couponValidation = {
          loading: false,
          error: action.payload,
          data: null,
        };
      });

    // ===== REMOVE COUPON =====
    builder
      .addCase(removeCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.successMessage = action.payload.message;
        state.error = null;
        // Clear coupon validation
        state.couponValidation = {
          loading: false,
          error: null,
          data: null,
        };
      })
      .addCase(removeCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== VALIDATE CART =====
    builder
      .addCase(validateCart.pending, (state) => {
        state.cartValidation.loading = true;
        state.cartValidation.error = null;
      })
      .addCase(validateCart.fulfilled, (state, action) => {
        state.cartValidation.loading = false;
        state.cartValidation.isValid = true;
        state.cartValidation.results = [];
        state.cart = action.payload.cart;
        state.isGuest = action.payload.isGuest;
        state.cartValidation.error = null;
      })
      .addCase(validateCart.rejected, (state, action) => {
        state.cartValidation.loading = false;
        state.cartValidation.isValid = false;
        state.cartValidation.error = action.payload.message;

        // Store validation results
        if (action.payload?.validationResults) {
          state.cartValidation.results = action.payload.validationResults;
          state.cart = action.payload.cart; // Also update cart with invalid items
        }
      });

    // ===== GET FREE GIFTS TIERS =====
    builder
      .addCase(getFreeGiftsTiers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFreeGiftsTiers.fulfilled, (state, action) => {
        state.loading = false;
        state.freeGiftsTiers = action.payload.tiers;
        state.error = null;
      })
      .addCase(getFreeGiftsTiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== LISTEN FOR SUCCESSFUL PAYMENT =====
    builder.addCase(verifyPayment.fulfilled, (state) => {
      state.cart = null;
      state.summary = null;
      state.couponValidation = {
        loading: false,
        error: null,
        data: null,
      };
      state.cartValidation = {
        loading: false,
        error: null,
        isValid: null,
        results: [],
      };
    });

    // Listen to logout actions from authSlice
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        // Reset cart to initial state on logout
        Object.assign(state, initialState);
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        // Reset cart to initial state on account deletion
        Object.assign(state, initialState);
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearError,
  clearSuccessMessage,
  clearCouponValidation,
  clearCartValidation,
  resetCart,
  setCart,
  updateCartItemLocally,
  removeCartItemLocally,
} = cartSlice.actions;

// Basic Selectors
export const selectCart = (state) => state.cart.cart;
export const selectCartSummary = (state) => state.cart.summary;
export const selectIsGuest = (state) => state.cart.isGuest;
export const selectCartLoading = (state) => state.cart.loading;
export const selectActionLoading = (state) => state.cart.actionLoading;
export const selectSummaryLoading = (state) => state.cart.summaryLoading;
export const selectCartError = (state) => state.cart.error;
export const selectSuccessMessage = (state) => state.cart.successMessage;
export const selectCouponValidation = (state) => state.cart.couponValidation;
export const selectCartValidation = (state) => state.cart.cartValidation;
export const selectFreeGiftsTiers = (state) => state.cart.freeGiftsTiers;

// Enhanced Computed Selectors

// Cart items (non-gift only)
export const selectCartItems = (state) => {
  return state.cart.cart?.items?.filter((item) => !item.isFreeGift) || [];
};

// Free gift items only
export const selectFreeGiftItems = (state) => {
  return state.cart.cart?.items?.filter((item) => item.isFreeGift) || [];
};

// All items (including free gifts)
export const selectAllCartItems = (state) => {
  return state.cart.cart?.items || [];
};

// Cart counts
export const selectCartItemsCount = (state) => {
  return state.cart.cart?.summary?.itemsCount || 0;
};

export const selectCartTotalQuantity = (state) => {
  return state.cart.cart?.summary?.totalQuantity || 0;
};

// Cart totals
export const selectCartSubtotal = (state) => {
  return state.cart.cart?.summary?.subtotal || 0;
};

export const selectCartCouponDiscount = (state) => {
  return state.cart.cart?.summary?.couponDiscount || 0;
};

export const selectCartTotal = (state) => {
  return state.cart.cart?.summary?.total || 0;
};

// Coupon state
export const selectHasCouponApplied = (state) => {
  return state.cart.cart?.coupon?.isApplied || false;
};

export const selectAppliedCoupon = (state) => {
  if (!state.cart.cart?.coupon?.isApplied) return null;
  return state.cart.cart.coupon;
};

export const selectAppliedCouponCode = (state) => {
  return state.cart.cart?.coupon?.code || null;
};

// Free gifts state
export const selectFreeGiftsEligible = (state) => {
  return state.cart.cart?.freeGifts?.eligible || false;
};

export const selectFreeGiftsData = (state) => {
  return state.cart.cart?.freeGifts || null;
};

export const selectFreeGiftsDescription = (state) => {
  if (!state.cart.cart?.freeGifts?.eligible) {
    return "Add more items to unlock free gifts!";
  }

  const gifts = state.cart.cart.freeGifts.gifts || [];
  if (gifts.length === 0) return "Add more items to unlock free gifts!";

  const giftsText = gifts.map((g) => `${g.quantity} ${g.name}`).join(", ");
  return `🎁 You're getting: ${giftsText} FREE!`;
};

// Cart validation state
export const selectIsCartValid = (state) => {
  return state.cart.cartValidation.isValid === true;
};

export const selectCartValidationResults = (state) => {
  return state.cart.cartValidation.results || [];
};

export const selectHasInvalidItems = (state) => {
  const results = state.cart.cartValidation.results || [];
  return results.some((r) => !r.isValid);
};

// Check if cart is empty
export const selectIsCartEmpty = (state) => {
  const items =
    state.cart.cart?.items?.filter((item) => !item.isFreeGift) || [];
  return items.length === 0;
};

// Get item by ID
export const selectCartItemById = (itemId) => (state) => {
  return state.cart.cart?.items?.find((item) => item._id === itemId) || null;
};

// Check if specific product+size exists in cart
export const selectHasProductInCart = (productId, sizeValue) => (state) => {
  if (!state.cart.cart?.items) return false;
  return state.cart.cart.items.some(
    (item) =>
      !item.isFreeGift &&
      item.product?._id === productId &&
      item.size?.value === sizeValue
  );
};

// Get quantity of specific product+size in cart
export const selectProductQuantityInCart =
  (productId, sizeValue) => (state) => {
    if (!state.cart.cart?.items) return 0;
    const item = state.cart.cart.items.find(
      (item) =>
        !item.isFreeGift &&
        item.product?._id === productId &&
        item.size?.value === sizeValue
    );
    return item?.quantity || 0;
  };

// Check if any cart operation is in progress
export const selectIsAnyCartActionLoading = (state) => {
  return (
    state.cart.loading ||
    state.cart.actionLoading ||
    state.cart.summaryLoading ||
    state.cart.couponValidation.loading ||
    state.cart.cartValidation.loading
  );
};

// Reducer
export default cartSlice.reducer;
