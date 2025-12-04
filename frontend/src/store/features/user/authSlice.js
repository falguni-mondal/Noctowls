import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../configs/axiosConfig";

// ---------------------- API CALLS ----------------------

// CHECK USER
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/auth/me`);
      return res.data; // user or null
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
      const res = await api.post(`/api/auth/login`, data);
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
      const res = await api.get(`/api/auth/otp`);
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
      const res = await api.post(`/api/auth/verify`, data);
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
      const res = await api.get(`/api/auth/logout`);
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
      const res = await api.delete(`/api/auth/delete`);
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
    status: "idle",
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

  reducers: {},

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
        state.nextResendAt = null; // Clear old timers
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.status = "success";
        state.user = action.payload.user;
        state.nextResendAt = action.payload.nextResendAt;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
        state.nextResendAt = null; // No timer since login failed
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
        state.nextResendAt = null; // No timer after verification
      })
      .addCase(otpVerifier.rejected, (state, action) => {
        state.otpVerifier.status = "failed";
        state.otpVerifier.error = action.payload;
      })

      // ---------------------- LOGOUT ----------------------
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
      })

      // ---------------------- DELETE ACCOUNT ----------------------
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
      });
  },
});

export default authSlice.reducer;
