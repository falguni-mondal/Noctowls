import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";

// ==================== ASYNC THUNKS ====================

// Get wishlist
export const getWishlist = createAsyncThunk(
  "wishlist/getWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/wishlist");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wishlist"
      );
    }
  }
);

// Get wishlist count
export const getWishlistCount = createAsyncThunk(
  "wishlist/getWishlistCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/wishlist/count");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wishlist count"
      );
    }
  }
);

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/wishlist/add", { productId });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add to wishlist"
      );
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userApi.delete(`/wishlist/remove/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove from wishlist"
      );
    }
  }
);

// Toggle wishlist (add if not exists, remove if exists)
export const toggleWishlist = createAsyncThunk(
  "wishlist/toggleWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/wishlist/toggle", { productId });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle wishlist"
      );
    }
  }
);

// Check if product is in wishlist
export const checkProductInWishlist = createAsyncThunk(
  "wishlist/checkProductInWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userApi.get(`/wishlist/check/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to check wishlist"
      );
    }
  }
);

// Clear wishlist
export const clearWishlist = createAsyncThunk(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.delete("/wishlist/clear");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear wishlist"
      );
    }
  }
);

// Move item to cart
export const moveToCart = createAsyncThunk(
  "wishlist/moveToCart",
  async ({ productId, sizeValue, quantity = 1 }, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.post("/wishlist/move-to-cart", {
        productId,
        sizeValue,
        quantity,
      });

      // Update cart in Redux if cart slice exists
      if (response.data.cart) {
        // Import cart actions dynamically to avoid circular dependency
        const { setCart } = await import("./cartSlice");
        dispatch(setCart(response.data.cart));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to move to cart"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Wishlist data
  wishlist: null,
  items: [],
  itemsCount: 0,

  // Product check cache (for faster lookups)
  productCheckCache: {}, // { productId: boolean }

  // Loading states
  loading: false,
  actionLoading: false, // For add, remove, toggle actions
  checkLoading: false, // For checking product in wishlist
  moveToCartLoading: false, // For move to cart action

  // Error states
  error: null,

  // Success messages
  successMessage: null,
};

// ==================== SLICE ====================

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Update product check cache
    updateProductCheckCache: (state, action) => {
      const { productId, isInWishlist } = action.payload;
      state.productCheckCache[productId] = isInWishlist;
    },

    // Clear product check cache
    clearProductCheckCache: (state) => {
      state.productCheckCache = {};
    },

    // Reset wishlist state (on logout)
    resetWishlist: (state) => {
      state.wishlist = null;
      state.items = [];
      state.itemsCount = 0;
      state.productCheckCache = {};
      state.error = null;
      state.successMessage = null;
    },

    // Optimistic update - add to wishlist
    optimisticAddToWishlist: (state, action) => {
      const productId = action.payload;
      state.productCheckCache[productId] = true;
      state.itemsCount += 1;
    },

    // Optimistic update - remove from wishlist
    optimisticRemoveFromWishlist: (state, action) => {
      const productId = action.payload;
      state.productCheckCache[productId] = false;
      state.itemsCount = Math.max(0, state.itemsCount - 1);
      state.items = state.items.filter(
        (item) => item.product._id !== productId
      );
    },

    // Set wishlist (used by move to cart to update wishlist)
    setWishlist: (state, action) => {
      state.wishlist = action.payload;
      state.items = action.payload?.items || [];
      state.itemsCount = action.payload?.items?.length || 0;

      // Update cache
      state.productCheckCache = {};
      if (state.items.length > 0) {
        state.items.forEach((item) => {
          const productId = item.product?._id || item.product;
          state.productCheckCache[productId] = true;
        });
      }
    },
  },
  extraReducers: (builder) => {
    // ===== GET WISHLIST =====
    builder
      .addCase(getWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload.wishlist;
        state.items = action.payload.wishlist?.items || [];
        state.itemsCount = action.payload.itemsCount || 0;

        // Update cache with current wishlist items
        state.productCheckCache = {};
        if (state.items.length > 0) {
          state.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            state.productCheckCache[productId] = true;
          });
        }

        state.error = null;
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET WISHLIST COUNT =====
    builder
      .addCase(getWishlistCount.pending, (state) => {
        // Don't set loading to true for count fetch (silent operation)
        state.error = null;
      })
      .addCase(getWishlistCount.fulfilled, (state, action) => {
        state.itemsCount = action.payload.count || 0;
        state.error = null;
      })
      .addCase(getWishlistCount.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ===== ADD TO WISHLIST =====
    builder
      .addCase(addToWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.wishlist = action.payload.wishlist;
        state.items = action.payload.wishlist?.items || [];
        state.itemsCount = action.payload.itemsCount || 0;
        state.successMessage = action.payload.message;

        // Update cache
        if (action.payload.wishlist?.items) {
          state.productCheckCache = {};
          action.payload.wishlist.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            state.productCheckCache[productId] = true;
          });
        }

        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== REMOVE FROM WISHLIST =====
    builder
      .addCase(removeFromWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.wishlist = action.payload.wishlist;
        state.items = action.payload.wishlist?.items || [];
        state.itemsCount = action.payload.itemsCount || 0;
        state.successMessage = action.payload.message;

        // Update cache
        state.productCheckCache = {};
        if (action.payload.wishlist?.items) {
          action.payload.wishlist.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            state.productCheckCache[productId] = true;
          });
        }

        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== TOGGLE WISHLIST =====
    builder
      .addCase(toggleWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.wishlist = action.payload.wishlist;
        state.items = action.payload.wishlist?.items || [];
        state.itemsCount = action.payload.itemsCount || 0;
        state.successMessage = action.payload.message;

        // Update cache
        state.productCheckCache = {};
        if (action.payload.wishlist?.items) {
          action.payload.wishlist.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            state.productCheckCache[productId] = true;
          });
        }

        state.error = null;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== CHECK PRODUCT IN WISHLIST =====
    builder
      .addCase(checkProductInWishlist.pending, (state) => {
        state.checkLoading = true;
        state.error = null;
      })
      .addCase(checkProductInWishlist.fulfilled, (state, action) => {
        state.checkLoading = false;

        // Update cache
        const { productId, isInWishlist } = action.payload;
        state.productCheckCache[productId] = isInWishlist;

        state.error = null;
      })
      .addCase(checkProductInWishlist.rejected, (state, action) => {
        state.checkLoading = false;
        state.error = action.payload;
      });

    // ===== CLEAR WISHLIST =====
    builder
      .addCase(clearWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.wishlist = action.payload.wishlist;
        state.items = [];
        state.itemsCount = 0;
        state.productCheckCache = {};
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== MOVE TO CART =====
    builder
      .addCase(moveToCart.pending, (state) => {
        state.moveToCartLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.moveToCartLoading = false;
        
        // Update wishlist
        state.wishlist = action.payload.wishlist;
        state.items = action.payload.wishlist?.items || [];
        state.itemsCount = action.payload.wishlist?.items?.length || 0;
        state.successMessage = action.payload.message;

        // Update cache
        state.productCheckCache = {};
        if (action.payload.wishlist?.items) {
          action.payload.wishlist.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            state.productCheckCache[productId] = true;
          });
        }

        state.error = null;
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.moveToCartLoading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearError,
  clearSuccessMessage,
  updateProductCheckCache,
  clearProductCheckCache,
  resetWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
  setWishlist,
} = wishlistSlice.actions;

// Selectors
export const selectWishlist = (state) => state.wishlist.wishlist;
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistItemsCount = (state) => state.wishlist.itemsCount;
export const selectWishlistLoading = (state) => state.wishlist.loading;
export const selectWishlistActionLoading = (state) => state.wishlist.actionLoading;
export const selectWishlistCheckLoading = (state) => state.wishlist.checkLoading;
export const selectWishlistMoveToCartLoading = (state) => state.wishlist.moveToCartLoading;
export const selectWishlistError = (state) => state.wishlist.error;
export const selectWishlistSuccessMessage = (state) => state.wishlist.successMessage;
export const selectProductCheckCache = (state) => state.wishlist.productCheckCache;

// Computed selectors
export const selectIsProductInWishlist = (productId) => (state) => {
  return state.wishlist.productCheckCache[productId] || false;
};

export const selectWishlistItemByProductId = (productId) => (state) => {
  return state.wishlist.items.find(
    (item) => (item.product?._id || item.product) === productId
  );
};

export const selectHasWishlistItems = (state) => {
  return state.wishlist.itemsCount > 0;
};

// Reducer
export default wishlistSlice.reducer;