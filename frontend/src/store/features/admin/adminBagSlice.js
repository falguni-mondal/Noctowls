import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

// Fetch All Active Bags
export const getAllBags = createAsyncThunk(
  "adminBag/getAll",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/bags/all", {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bags"
      );
    }
  }
);

// Delete Bag
export const deleteBag = createAsyncThunk(
  "adminBag/delete",
  async (bagId, { rejectWithValue }) => {
    try {
      const response = await adminApi.delete(`/bags/${bagId}`);
      return { ...response.data, bagId }; // Return ID to remove from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete bag"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  bags: [],
  pagination: {
    totalBags: 0,
    currentPage: 1,
    totalPages: 1,
  },
  filters: {
    search: ""
  },
  loading: false,
  actionLoading: false, // New state for delete actions
  error: null,
};

// ==================== SLICE ====================

const adminBagSlice = createSlice({
  name: "adminBag",
  initialState,
  reducers: {
    setBagFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBagErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- GET ALL BAGS ---
    builder
      .addCase(getAllBags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBags.fulfilled, (state, action) => {
        state.loading = false;
        state.bags = action.payload.bags;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllBags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.bags = [];
      });

    // --- DELETE BAG ---
    builder
      .addCase(deleteBag.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteBag.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Remove the deleted bag from the list
        state.bags = state.bags.filter(bag => bag._id !== action.payload.bagId);
        // Update pagination count
        state.pagination.totalBags -= 1;
      })
      .addCase(deleteBag.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================

export const { setBagFilter, clearBagErrors } = adminBagSlice.actions;

export const selectAdminBags = (state) => state.adminBag.bags;
export const selectAdminBagPagination = (state) => state.adminBag.pagination;
export const selectAdminBagFilters = (state) => state.adminBag.filters;
export const selectAdminBagLoading = (state) => state.adminBag.loading;
export const selectAdminBagActionLoading = (state) => state.adminBag.actionLoading;

export default adminBagSlice.reducer;