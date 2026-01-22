import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig"; 

// ==================== ASYNC THUNKS ====================

// 1. Get All Orders (Pagination + Filter + Search + Date Range)
export const getAllAdminOrders = createAsyncThunk(
  "adminOrder/getAll",
  async ({ page = 1, limit = 10, status = "", search = "", startDate = "", endDate = "" }, { rejectWithValue }) => {
    try {
      // Build query string
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      
      // Date Range Params
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await adminApi.get(`/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// 2. Get Single Order Details
export const getAdminOrderById = createAsyncThunk(
  "adminOrder/getById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await adminApi.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details"
      );
    }
  }
);

// 3. Update Order Status
export const updateAdminOrderStatus = createAsyncThunk(
  "adminOrder/updateStatus",
  async ({ orderId, status, trackingId }, { rejectWithValue }) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}`, {
        status,
        trackingId, 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

// 4. Delete Order (Only cancelled)
export const deleteAdminOrder = createAsyncThunk(
  "adminOrder/delete",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await adminApi.delete(`/orders/${orderId}`);
      return { ...response.data, orderId }; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete order"
      );
    }
  }
);

// 5. Get Order Statistics
export const getAdminOrderStats = createAsyncThunk(
  "adminOrder/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/orders/stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statistics"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // List View Data
  orders: [],
  ordersCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  },

  // Detail View Data
  currentOrder: null,

  // Dashboard Data
  stats: null,

  // Loading States
  loading: false, 
  detailsLoading: false, 
  actionLoading: false, 
  statsLoading: false, 

  // Feedback
  error: null,
  successMessage: null,
};

// ==================== SLICE ====================

const adminOrderSlice = createSlice({
  name: "adminOrder",
  initialState,
  reducers: {
    clearAdminOrderErrors: (state) => {
      state.error = null;
    },
    clearAdminSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentAdminOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    // --- GET ALL ORDERS ---
    builder
      .addCase(getAllAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.ordersCount = action.payload.pagination.totalOrders;
      })
      .addCase(getAllAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orders = [];
      });

    // --- GET SINGLE ORDER ---
    builder
      .addCase(getAdminOrderById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(getAdminOrderById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(getAdminOrderById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });

    // --- UPDATE STATUS ---
    builder
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message;

        const index = state.orders.findIndex(
          (o) => o._id === action.payload.order._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }

        if (state.currentOrder?._id === action.payload.order._id) {
          state.currentOrder = action.payload.order;
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // --- DELETE ORDER ---
    builder
      .addCase(deleteAdminOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteAdminOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message;

        state.orders = state.orders.filter(
          (o) => o._id !== action.payload.orderId
        );
        state.ordersCount -= 1;

        if (state.currentOrder?._id === action.payload.orderId) {
          state.currentOrder = null;
        }
      })
      .addCase(deleteAdminOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // --- GET STATS ---
    builder
      .addCase(getAdminOrderStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(getAdminOrderStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(getAdminOrderStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearAdminOrderErrors,
  clearAdminSuccessMessage,
  clearCurrentAdminOrder,
} = adminOrderSlice.actions;

export const selectAdminOrders = (state) => state.adminOrders.orders;
export const selectAdminOrdersPagination = (state) => state.adminOrders.pagination;
export const selectAdminCurrentOrder = (state) => state.adminOrders.currentOrder;
export const selectAdminOrderStats = (state) => state.adminOrders.stats;

export const selectAdminOrdersLoading = (state) => state.adminOrders.loading;
export const selectAdminOrderDetailsLoading = (state) =>
  state.adminOrders.detailsLoading;
export const selectAdminOrderActionLoading = (state) =>
  state.adminOrders.actionLoading;

export const selectAdminOrderError = (state) => state.adminOrders.error;
export const selectAdminOrderSuccessMessage = (state) =>
  state.adminOrders.successMessage;

export default adminOrderSlice.reducer;