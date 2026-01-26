import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

export const fetchDashboardStats = createAsyncThunk(
  "adminDashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load dashboard data"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  stats: {
    users: { current: 0, last: 0, growth: 0 },
    revenue: 0,
    profit: 0,
    gst: 0
  },
  analytics: {
    salesTrend: [],
    categories: [],
    topProducts: [],
    orderStatus: []
  },
  recentOrders: [],
  loading: false,
  error: null,
};

// ==================== SLICE ====================

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    clearDashboardErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.cards;
        state.analytics = action.payload.analytics;
        state.recentOrders = action.payload.recentOrders;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardErrors } = adminDashboardSlice.actions;

// Selectors
export const selectDashboardStats = (state) => state.adminDashboard.stats;
export const selectDashboardAnalytics = (state) => state.adminDashboard.analytics;
export const selectDashboardRecentOrders = (state) => state.adminDashboard.recentOrders;
export const selectDashboardLoading = (state) => state.adminDashboard.loading;

export default adminDashboardSlice.reducer;