import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ---------------------- API CALLS ----------------------

// CHECK ADMIN
export const checkAdmin = createAsyncThunk(
  "adminAuth/checkAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(`/auth/admin`);
      return res.data; // admin or null
    } catch (err) {
      return rejectWithValue(err?.response?.data || null);
    }
  }
);

// LOGIN ADMIN
export const loginAdmin = createAsyncThunk(
  "adminAuth/loginAdmin",
  async (data, { rejectWithValue }) => {
    try {
      const res = await adminApi.post(`/auth/login`, data);
      return res.data; // { admin, nextResendAt }
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// RESEND OTP
export const adminOtpSender = createAsyncThunk(
  "adminAuth/adminOtpSender",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(`/auth/otp`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// VERIFY OTP
export const adminOtpVerifier = createAsyncThunk(
  "adminAuth/adminOtpVerifier",
  async (data, { rejectWithValue }) => {
    try {
      const res = await adminApi.post(`/auth/verify`, data);
      return res.data; // admin object
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// LOGOUT ADMIN
export const logoutAdmin = createAsyncThunk(
  "adminAuth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.get(`/auth/logout`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// ---------------------- SLICE ----------------------

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    admin: null,
    status: "idle",
    error: null,
    nextResendAt: null,

    // nested statuses same as user slice
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
      // ---------------------- CHECK ADMIN ----------------------
      .addCase(checkAdmin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAdmin.fulfilled, (state, action) => {
        state.admin = action.payload || null;
        state.status = "success";
      })
      .addCase(checkAdmin.rejected, (state, action) => {
        state.admin = null;
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------------------- LOGIN ----------------------
      .addCase(loginAdmin.pending, (state) => {
        state.login.status = "loading";
        state.login.error = null;
        state.nextResendAt = null; // reset old timer
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.login.status = "success";
        state.admin = action.payload.admin;
        state.nextResendAt = action.payload.nextResendAt;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
        state.nextResendAt = null;
      })

      // ---------------------- OTP SENDER ----------------------
      .addCase(adminOtpSender.pending, (state) => {
        state.otpSender.status = "loading";
        state.otpSender.error = null;
      })
      .addCase(adminOtpSender.fulfilled, (state, action) => {
        state.otpSender.status = "success";
        state.otpSender.error = null;
        state.nextResendAt = action.payload.nextResendAt;
      })
      .addCase(adminOtpSender.rejected, (state, action) => {
        state.otpSender.status = "failed";
        state.otpSender.error = action.payload;
      })

      // ---------------------- OTP VERIFIER ----------------------
      .addCase(adminOtpVerifier.pending, (state) => {
        state.otpVerifier.status = "loading";
        state.otpVerifier.error = null;
      })
      .addCase(adminOtpVerifier.fulfilled, (state, action) => {
        state.otpVerifier.status = "success";
        state.otpVerifier.error = null;
        state.admin = action.payload;
        state.nextResendAt = null;
      })
      .addCase(adminOtpVerifier.rejected, (state, action) => {
        state.otpVerifier.status = "failed";
        state.otpVerifier.error = action.payload;
      })

      // ---------------------- LOGOUT ----------------------
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.login.status = "idle";
        state.otpSender.status = "idle";
        state.otpVerifier.status = "idle";
        state.nextResendAt = null;
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload;
      });
  },
});

export default adminAuthSlice.reducer;
