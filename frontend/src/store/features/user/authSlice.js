import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";

// ---------------------- API CALLS ----------------------

// CHECK USER
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get(`/auth/me`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || null);
    }
  }
);

// LOGIN USER
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.post(`/auth/login`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// RESEND OTP
export const otpSender = createAsyncThunk(
  "auth/otpSender",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get(`/auth/otp`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// VERIFY OTP
export const otpVerifier = createAsyncThunk(
  "auth/otpVerifier",
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.post(`/auth/verify`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// LOGOUT
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get(`/auth/logout`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// DELETE ACCOUNT
export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.delete(`/auth/delete`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// ---------------------- SLICE ----------------------

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle", // 'idle' | 'loading' | 'success' | 'failed'
    error: null,
    nextResendAt: null,

    login: {
      status: "idle",
      error: null,
    },
    otpSender: {
      status: "idle",
      error: null,
    },
    otpVerifier: {
      status: "idle",
      error: null,
    },
  },

  reducers: {
    // ✅ NEW: Clear all errors
    clearAuthErrors: (state) => {
      state.error = null;
      state.login.error = null;
      state.otpSender.error = null;
      state.otpVerifier.error = null;
    },

    // ✅ NEW: Clear login state (for new login attempt)
    resetLoginState: (state) => {
      state.login.status = "idle";
      state.login.error = null;
      state.otpSender.status = "idle";
      state.otpSender.error = null;
      state.otpVerifier.status = "idle";
      state.otpVerifier.error = null;
      state.nextResendAt = null;
    },

    // ✅ NEW: Manual user update (for profile edits)
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ---------------------- CHECK USER ----------------------
      .addCase(checkAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload || null;
        state.status = "success";
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.user = null;
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------------------- LOGIN ----------------------
      .addCase(loginUser.pending, (state) => {
        state.login.status = "loading";
        state.login.error = null;
        state.nextResendAt = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.status = "success";
        state.user = action.payload.user;
        state.nextResendAt = action.payload.nextResendAt;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
        state.nextResendAt = null;
      })

      // ---------------------- OTP SENDER ----------------------
      .addCase(otpSender.pending, (state) => {
        state.otpSender.status = "loading";
        state.otpSender.error = null;
      })
      .addCase(otpSender.fulfilled, (state, action) => {
        state.otpSender.status = "success";
        state.otpSender.error = null;
        state.nextResendAt = action.payload.nextResendAt;
      })
      .addCase(otpSender.rejected, (state, action) => {
        state.otpSender.status = "failed";
        state.otpSender.error = action.payload;
      })

      // ---------------------- VERIFY OTP ----------------------
      .addCase(otpVerifier.pending, (state) => {
        state.otpVerifier.status = "loading";
        state.otpVerifier.error = null;
      })
      .addCase(otpVerifier.fulfilled, (state, action) => {
        state.otpVerifier.status = "success";
        state.otpVerifier.error = null;
        state.user = action.payload;
        state.nextResendAt = null;
        // ✅ Reset login state after successful verification
        state.login.status = "idle";
        state.otpSender.status = "idle";
      })
      .addCase(otpVerifier.rejected, (state, action) => {
        state.otpVerifier.status = "failed";
        state.otpVerifier.error = action.payload;
      })

      // ---------------------- LOGOUT ----------------------
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
        state.error = null;
        state.login.error = null;
        state.otpSender.error = null;
        state.otpVerifier.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // ✅ Even if logout fails on server, clear local state
        state.user = null;
        state.status = "idle";
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
        state.error = action.payload;
      })

      // ---------------------- DELETE ACCOUNT ----------------------
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
        state.error = null;
        state.login.error = null;
        state.otpSender.error = null;
        state.otpVerifier.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
      });
  },
});

// ---------------------- EXPORTS ----------------------

// Actions
export const { 
  clearAuthErrors, 
  resetLoginState, 
  updateUser 
} = authSlice.actions;

// ✅ NEW: Comprehensive Selectors

// User selectors
export const selectUser = (state) => state.auth.user;
export const selectUserId = (state) => state.auth.user?._id || null;
export const selectUserName = (state) => state.auth.user?.name || "";
export const selectUserEmail = (state) => state.auth.user?.email || "";
export const selectUserPhone = (state) => state.auth.user?.phone || "";

// ✅ CRITICAL: Authentication status selector
export const selectIsAuthenticated = (state) => !!state.auth.user;

// Auth status selectors
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthLoading = (state) => state.auth.status === "loading";
export const selectAuthError = (state) => state.auth.error;

// Login flow selectors
export const selectLoginStatus = (state) => state.auth.login.status;
export const selectIsLoginLoading = (state) => state.auth.login.status === "loading";
export const selectLoginError = (state) => state.auth.login.error;

// OTP selectors
export const selectOtpSenderStatus = (state) => state.auth.otpSender.status;
export const selectIsOtpSending = (state) => state.auth.otpSender.status === "loading";
export const selectOtpSenderError = (state) => state.auth.otpSender.error;

export const selectOtpVerifierStatus = (state) => state.auth.otpVerifier.status;
export const selectIsOtpVerifying = (state) => state.auth.otpVerifier.status === "loading";
export const selectOtpVerifierError = (state) => state.auth.otpVerifier.error;

// Resend timer selector
export const selectNextResendAt = (state) => state.auth.nextResendAt;
export const selectCanResendOtp = (state) => {
  if (!state.auth.nextResendAt) return true;
  return new Date() > new Date(state.auth.nextResendAt);
};

// ✅ NEW: Computed selectors for better UX
export const selectIsInLoginFlow = (state) => {
  return (
    state.auth.login.status === "success" ||
    state.auth.otpSender.status === "loading" ||
    state.auth.otpVerifier.status === "loading"
  );
};

export const selectHasAnyError = (state) => {
  return !!(
    state.auth.error ||
    state.auth.login.error ||
    state.auth.otpSender.error ||
    state.auth.otpVerifier.error
  );
};

// ✅ NEW: Get first available error
export const selectFirstError = (state) => {
  return (
    state.auth.otpVerifier.error ||
    state.auth.otpSender.error ||
    state.auth.login.error ||
    state.auth.error ||
    null
  );
};

export default authSlice.reducer;