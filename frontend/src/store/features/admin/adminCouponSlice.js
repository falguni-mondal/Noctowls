import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

// Create coupon
export const createCoupon = createAsyncThunk(
  "adminCoupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await adminApi.post("/coupons", couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create coupon" }
      );
    }
  }
);

// Get all coupons (with filters, pagination, search)
export const getAllCoupons = createAsyncThunk(
  "adminCoupons/getAllCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, status, sortBy, order, search } = params;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(sortBy && { sortBy }),
        ...(order && { order }),
        ...(search && { search }),
      });

      const response = await adminApi.get(`/coupons?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch coupons" }
      );
    }
  }
);

// Get active coupons
export const getActiveCoupons = createAsyncThunk(
  "adminCoupons/getActiveCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/coupons/active");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch active coupons" }
      );
    }
  }
);

// Get coupon by ID
export const getCouponById = createAsyncThunk(
  "adminCoupons/getCouponById",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await adminApi.get(`/coupons/${couponId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch coupon" }
      );
    }
  }
);

// Get coupon statistics
export const getCouponStats = createAsyncThunk(
  "adminCoupons/getCouponStats",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await adminApi.get(`/coupons/${couponId}/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch coupon statistics" }
      );
    }
  }
);

// Update coupon
export const updateCoupon = createAsyncThunk(
  "adminCoupons/updateCoupon",
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      const response = await adminApi.put(`/coupons/${id}`, couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update coupon" }
      );
    }
  }
);

// Delete coupon
export const deleteCoupon = createAsyncThunk(
  "adminCoupons/deleteCoupon",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await adminApi.delete(`/coupons/${couponId}`);
      return { ...response.data, couponId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete coupon" }
      );
    }
  }
);

// Toggle coupon status
export const toggleCouponStatus = createAsyncThunk(
  "adminCoupons/toggleCouponStatus",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await adminApi.patch(`/coupons/${couponId}/toggle`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to toggle coupon status" }
      );
    }
  }
);

// Cleanup expired coupons
export const cleanupExpiredCoupons = createAsyncThunk(
  "adminCoupons/cleanupExpiredCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.post("/coupons/cleanup");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to cleanup expired coupons" }
      );
    }
  }
);

// Get dashboard statistics
export const getCouponDashboardStats = createAsyncThunk(
  "adminCoupons/getCouponDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/coupons/dashboard-stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch dashboard statistics" }
      );
    }
  }
);

// Get coupon usage for user or guest
export const getCouponUsage = createAsyncThunk(
  "adminCoupons/getCouponUsage",
  async ({ userId, deviceId }, { rejectWithValue }) => {
    try {
      // Validate: exactly one identifier required
      if (!userId && !deviceId) {
        return rejectWithValue({
          message: "Either userId or deviceId is required"
        });
      }

      if (userId && deviceId) {
        return rejectWithValue({
          message: "Cannot provide both userId and deviceId. Choose one."
        });
      }

      // Build query with only the provided identifier
      const queryParams = new URLSearchParams();
      
      if (userId) {
        queryParams.append('userId', userId);
      } else {
        queryParams.append('deviceId', deviceId);
      }
      
      const response = await adminApi.get(`/coupons/usage?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch coupon usage" }
      );
    }
  }
);

// Validate coupon for user OR guest
export const validateCouponForUser = createAsyncThunk(
  "adminCoupons/validateCouponForUser",
  async ({ code, userId, deviceId }, { rejectWithValue }) => {
    try {
      // Validate: code is required
      if (!code) {
        return rejectWithValue({
          message: "Coupon code is required"
        });
      }

      // Validate: exactly one identifier required
      if (!userId && !deviceId) {
        return rejectWithValue({
          message: "Either userId or deviceId is required"
        });
      }

      if (userId && deviceId) {
        return rejectWithValue({
          message: "Cannot provide both userId and deviceId. Choose one."
        });
      }

      // Build query with only the provided identifier
      const queryParams = new URLSearchParams();
      
      if (userId) {
        queryParams.append('userId', userId);
      } else {
        queryParams.append('deviceId', deviceId);
      }
      
      const response = await adminApi.get(`/coupons/validate/${code}?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to validate coupon" }
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Coupons list
  coupons: [],
  activeCoupons: [],
  
  // Selected coupon (for view/edit)
  selectedCoupon: null,
  currentCoupon: null,
  
  // Coupon statistics
  couponStats: null,
  
  // Dashboard statistics (added exhausted, recentCoupons, usageByType)
  dashboardStats: {
    overview: {
      totalCoupons: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      upcomingCoupons: 0,
      exhaustedCoupons: 0, 
      totalUsage: 0,
      uniqueUsers: 0,
    },
    mostUsedCoupons: [],
    recentCoupons: [], 
    usageByType: {}, 
  },
  
  // Coupon usage data (for user/guest lookup)
  couponUsage: null,
  
  // Coupon validation result
  validationResult: null,
  
  // Pagination
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  
  // Loading states
  loading: false,
  actionLoading: false,
  statsLoading: false,
  dashboardLoading: false,
  usageLoading: false, 
  validationLoading: false, 
  
  // Error states
  error: null,
  
  // Success message
  successMessage: null,
  
  // Filters
  filters: {
    status: null, // 'active', 'inactive', 'expired', 'upcoming', 'exhausted' ✅ UPDATED
    search: "",
    sortBy: "createdAt",
    order: "desc",
  },
};

// ==================== SLICE ====================

const adminCouponSlice = createSlice({
  name: "adminCoupons",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    // Clear selected coupon
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
      state.currentCoupon = null;
    },
    
    // Clear coupon stats
    clearCouponStats: (state) => {
      state.couponStats = null;
    },
    
    // ✅ NEW: Clear coupon usage
    clearCouponUsage: (state) => {
      state.couponUsage = null;
    },
    
    // ✅ NEW: Clear validation result
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    
    // Set filters
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        status: null,
        search: "",
        sortBy: "createdAt",
        order: "desc",
      };
    },
    
    // Reset state
    resetCouponState: () => initialState,
  },
  extraReducers: (builder) => {
    // ===== CREATE COUPON =====
    builder
      .addCase(createCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || "Coupon created successfully";
        state.coupons.unshift(action.payload.coupon);
        state.pagination.total += 1;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== GET ALL COUPONS =====
    builder
      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET ACTIVE COUPONS =====
    builder
      .addCase(getActiveCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCoupons = action.payload.coupons;
      })
      .addCase(getActiveCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET COUPON BY ID =====
    builder
      .addCase(getCouponById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedCoupon = null;
        state.currentCoupon = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCoupon = action.payload.coupon;
        state.currentCoupon = action.payload.coupon;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedCoupon = null;
        state.currentCoupon = null;
      });

    // ===== GET COUPON STATS =====
    builder
      .addCase(getCouponStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(getCouponStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.couponStats = action.payload.stats;
      })
      .addCase(getCouponStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });

    // ===== UPDATE COUPON =====
    builder
      .addCase(updateCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || "Coupon updated successfully";
        
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload.coupon._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload.coupon;
        }
        
        if (state.selectedCoupon?._id === action.payload.coupon._id) {
          state.selectedCoupon = action.payload.coupon;
          state.currentCoupon = action.payload.coupon;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== DELETE COUPON =====
    builder
      .addCase(deleteCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || "Coupon deleted successfully";
        
        state.coupons = state.coupons.filter(
          (c) => c._id !== action.payload.couponId
        );
        state.pagination.total -= 1;
        
        if (state.selectedCoupon?._id === action.payload.couponId) {
          state.selectedCoupon = null;
          state.currentCoupon = null;
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== TOGGLE COUPON STATUS =====
    builder
      .addCase(toggleCouponStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || "Coupon status updated";
        
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload.coupon._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload.coupon;
        }
        
        if (state.selectedCoupon?._id === action.payload.coupon._id) {
          state.selectedCoupon = action.payload.coupon;
          state.currentCoupon = action.payload.coupon;
        }
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== CLEANUP EXPIRED COUPONS =====
    builder
      .addCase(cleanupExpiredCoupons.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(cleanupExpiredCoupons.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || "Expired coupons cleaned up";
      })
      .addCase(cleanupExpiredCoupons.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ===== GET DASHBOARD STATS =====
    builder
      .addCase(getCouponDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(getCouponDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload.stats;
      })
      .addCase(getCouponDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      });

    // GET COUPON USAGE
    builder
      .addCase(getCouponUsage.pending, (state) => {
        state.usageLoading = true;
        state.error = null;
        state.couponUsage = null;
      })
      .addCase(getCouponUsage.fulfilled, (state, action) => {
        state.usageLoading = false;
        state.couponUsage = action.payload;
      })
      .addCase(getCouponUsage.rejected, (state, action) => {
        state.usageLoading = false;
        state.error = action.payload;
      });

    // VALIDATE COUPON FOR USER
    builder
      .addCase(validateCouponForUser.pending, (state) => {
        state.validationLoading = true;
        state.error = null;
        state.validationResult = null;
      })
      .addCase(validateCouponForUser.fulfilled, (state, action) => {
        state.validationLoading = false;
        state.validationResult = action.payload;
      })
      .addCase(validateCouponForUser.rejected, (state, action) => {
        state.validationLoading = false;
        state.error = action.payload;
        state.validationResult = null;
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearError,
  clearSuccessMessage,
  clearSelectedCoupon,
  clearCouponStats,
  clearCouponUsage, 
  clearValidationResult,
  setFilters,
  resetFilters,
  resetCouponState,
} = adminCouponSlice.actions;

// Selectors
export const selectAllCoupons = (state) => state.adminCoupons.coupons;
export const selectActiveCoupons = (state) => state.adminCoupons.activeCoupons;
export const selectSelectedCoupon = (state) => state.adminCoupons.selectedCoupon;
export const selectCurrentCoupon = (state) => state.adminCoupons.currentCoupon;
export const selectCouponStats = (state) => state.adminCoupons.couponStats;
export const selectDashboardStats = (state) => state.adminCoupons.dashboardStats;
export const selectCouponUsage = (state) => state.adminCoupons.couponUsage;
export const selectValidationResult = (state) => state.adminCoupons.validationResult;
export const selectPagination = (state) => state.adminCoupons.pagination;
export const selectFilters = (state) => state.adminCoupons.filters;
export const selectLoading = (state) => state.adminCoupons.loading;
export const selectActionLoading = (state) => state.adminCoupons.actionLoading;
export const selectStatsLoading = (state) => state.adminCoupons.statsLoading;
export const selectDashboardLoading = (state) => state.adminCoupons.dashboardLoading;
export const selectUsageLoading = (state) => state.adminCoupons.usageLoading;
export const selectValidationLoading = (state) => state.adminCoupons.validationLoading;
export const selectError = (state) => state.adminCoupons.error;
export const selectSuccessMessage = (state) => state.adminCoupons.successMessage;

// Reducer
export default adminCouponSlice.reducer;