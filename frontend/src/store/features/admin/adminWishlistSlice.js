import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

// Fetch All Wishlists
export const getAllWishlists = createAsyncThunk(
  "adminWishlist/getAll",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/wishlists/all", {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wishlists"
      );
    }
  }
);

// Delete Wishlist
export const deleteWishlist = createAsyncThunk(
  "adminWishlist/delete",
  async (wishlistId, { rejectWithValue }) => {
    try {
      const response = await adminApi.delete(`/wishlists/${wishlistId}`);
      return { ...response.data, wishlistId }; // Return ID to remove from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete wishlist"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  wishlists: [],
  pagination: {
    totalWishlists: 0,
    currentPage: 1,
    totalPages: 1,
  },
  filters: {
    search: ""
  },
  loading: false,
  actionLoading: false,
  error: null,
};

// ==================== SLICE ====================

const adminWishlistSlice = createSlice({
  name: "adminWishlist",
  initialState,
  reducers: {
    setWishlistFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearWishlistErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- GET ALL ---
    builder
      .addCase(getAllWishlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWishlists.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlists = action.payload.wishlists;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllWishlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.wishlists = [];
      });

    // --- DELETE ---
    builder
      .addCase(deleteWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.wishlists = state.wishlists.filter(w => w._id !== action.payload.wishlistId);
        state.pagination.totalWishlists -= 1;
      })
      .addCase(deleteWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================

export const { setWishlistFilter, clearWishlistErrors } = adminWishlistSlice.actions;

export const selectAdminWishlists = (state) => state.adminWishlist.wishlists; // Make sure store.js has 'adminWishlist'
export const selectAdminWishlistPagination = (state) => state.adminWishlist.pagination;
export const selectAdminWishlistFilters = (state) => state.adminWishlist.filters;
export const selectAdminWishlistLoading = (state) => state.adminWishlist.loading;
export const selectAdminWishlistActionLoading = (state) => state.adminWishlist.actionLoading;

export default adminWishlistSlice.reducer;