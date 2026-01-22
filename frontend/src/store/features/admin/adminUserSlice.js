import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

// 1. Get All Users (List View)
export const getAllUsers = createAsyncThunk(
  "adminUsers/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = "", 
        role = "", 
        status = "", 
        startDate = "", 
        endDate = "",
        sortBy = "newest"
      } = params;

      // Build Query String
      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("limit", limit);
      if (search) queryParams.append("search", search);
      if (role && role !== "all") queryParams.append("role", role);
      if (status && status !== "all") queryParams.append("status", status);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (sortBy) queryParams.append("sortBy", sortBy);

      const response = await adminApi.get(`/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// 2. Get Single User Details
export const getUserDetails = createAsyncThunk(
  "adminUsers/getDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminApi.get(`/users/${userId}`);
      return response.data; // { success: true, data: { profile, stats, orders... } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details"
      );
    }
  }
);

// 3. Delete User
export const deleteUser = createAsyncThunk(
  "adminUsers/delete",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminApi.delete(`/users/${userId}`);
      return { ...response.data, userId }; // Return ID to remove from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // List Data
  users: [],
  pagination: {
    totalUsers: 0,
    currentPage: 1,
    totalPages: 1,
  },

  // Detail Data
  currentUser: null, // Holds the detailed view (profile, orders, etc.)

  // Filter State (Persisted in Redux for convenience)
  filters: {
    search: "",
    role: "all",
    status: "all",
    dateRange: { start: "", end: "" },
    sortBy: "newest"
  },

  // Loading States
  listLoading: false,
  detailsLoading: false,
  actionLoading: false,

  // Feedback
  error: null,
  successMessage: null,
};

// ==================== SLICE ====================

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    // Update Filters
    setUsersFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Clear Feedback
    clearAdminUserFeedback: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    // Reset Detail View (Clean up when leaving detail page)
    clearCurrentUser: (state) => {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    // --- GET ALL USERS ---
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.listLoading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
        state.users = [];
      });

    // --- GET USER DETAILS ---
    builder
      .addCase(getUserDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentUser = action.payload.data;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });

    // --- DELETE USER ---
    builder
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message;

        // Remove from list if present
        state.users = state.users.filter(u => u._id !== action.payload.userId);
        state.pagination.totalUsers -= 1;

        // If currently viewing this user, clear the view
        if (state.currentUser?.profile?._id === action.payload.userId) {
            state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================

export const { 
  setUsersFilter, 
  clearAdminUserFeedback, 
  clearCurrentUser 
} = adminUsersSlice.actions;

// Selectors
export const selectAdminUsers = (state) => state.adminUsers.users;
export const selectAdminUsersPagination = (state) => state.adminUsers.pagination;
export const selectAdminUserFilters = (state) => state.adminUsers.filters;
export const selectAdminCurrentUser = (state) => state.adminUsers.currentUser;

export const selectAdminUsersLoading = (state) => state.adminUsers.listLoading;
export const selectAdminUserDetailsLoading = (state) => state.adminUsers.detailsLoading;
export const selectAdminUserActionLoading = (state) => state.adminUsers.actionLoading;

export default adminUsersSlice.reducer;