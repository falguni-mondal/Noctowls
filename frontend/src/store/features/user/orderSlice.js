import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";
import { logoutUser, deleteAccount } from "./authSlice";

// ==================== ASYNC THUNKS ====================

// Create order
export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/order/create", orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  "order/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/order/verify-payment", paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Payment verification failed"
      );
    }
  }
);

// Get all orders
export const getOrders = createAsyncThunk(
  "order/getOrders",
  async ({ page = 1, limit = 10, status }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      if (status) params.append("status", status);

      const response = await userApi.get(`/order?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// Get single order by ID
export const getOrderById = createAsyncThunk(
  "order/getOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await userApi.get(`/order/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order"
      );
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await userApi.post(`/order/${orderId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order"
      );
    }
  }
);

// Track guest order
export const trackGuestOrder = createAsyncThunk(
  "order/trackGuestOrder",
  async ({ orderNumber, email }, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/order/track", {
        orderNumber,
        email,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to track order"
      );
    }
  }
);

// Cancel guest order
export const cancelGuestOrder = createAsyncThunk(
  "order/cancelGuestOrder",
  async ({ orderNumber, email, reason }, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/order/track/cancel", {
        orderNumber,
        email,
        reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order"
      );
    }
  }
);

// Validate coupon
export const validateCoupon = createAsyncThunk(
  "order/validateCoupon",
  async (couponCode, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/order/coupon/validate", {
        couponCode,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid coupon code"
      );
    }
  }
);

// Get order summary (for checkout)
export const getOrderSummary = createAsyncThunk(
  "order/getOrderSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/order/summary");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order summary"
      );
    }
  }
);

// Download invoice
export const downloadInvoice = createAsyncThunk(
  "order/downloadInvoice",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await userApi.get(`/order/${orderId}/invoice`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to download invoice"
      );
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Orders list
  orders: [],
  ordersCount: 0,
  currentOrder: null, // Single order details

  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  },

  // Customer type
  customerType: null, // 'registered' or 'guest'

  // Order summary (for checkout)
  orderSummary: null,

  // Coupon validation
  couponValidation: {
    loading: false,
    error: null,
    isValid: false,
    coupon: null,
    discount: null,
  },

  // Current checkout order (before payment)
  checkoutOrder: null,
  razorpayDetails: null,

  // Guest order tracking
  trackedGuestOrder: null,

  // Invoice
  invoice: null,

  // Loading states
  loading: false, // General loading
  createOrderLoading: false,
  verifyPaymentLoading: false,
  cancelOrderLoading: false,
  summaryLoading: false,
  trackGuestOrderLoading: false,

  // Error states
  error: null,

  // Success messages
  successMessage: null,
};

// ==================== SLICE ====================

const orderSlice = createSlice({
  name: "order",
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

    // Clear coupon validation
    clearCouponValidation: (state) => {
      state.couponValidation = {
        loading: false,
        error: null,
        isValid: false,
        coupon: null,
        discount: null,
      };
    },

    // Clear checkout order
    clearCheckoutOrder: (state) => {
      state.checkoutOrder = null;
      state.razorpayDetails = null;
    },

    // Clear current order
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },

    // Clear tracked guest order
    clearTrackedGuestOrder: (state) => {
      state.trackedGuestOrder = null;
    },

    // Reset order state (on logout)
    resetOrders: (state) => {
      state.orders = [];
      state.ordersCount = 0;
      state.currentOrder = null;
      state.orderSummary = null;
      state.checkoutOrder = null;
      state.razorpayDetails = null;
      state.trackedGuestOrder = null;
      state.invoice = null;
      state.customerType = null;
      state.error = null;
      state.successMessage = null;
      state.couponValidation = {
        loading: false,
        error: null,
        isValid: false,
        coupon: null,
        discount: null,
      };
    },
  },
  extraReducers: (builder) => {
    // ===== CREATE ORDER =====
    builder
      .addCase(createOrder.pending, (state) => {
        state.createOrderLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createOrderLoading = false;
        state.checkoutOrder = action.payload.order;
        state.razorpayDetails = action.payload.razorpay;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createOrderLoading = false;
        state.error = action.payload;
      });

    // ===== VERIFY PAYMENT =====
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.verifyPaymentLoading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifyPaymentLoading = false;
        state.currentOrder = action.payload.order;
        state.successMessage = action.payload.message;
        state.checkoutOrder = null;
        state.razorpayDetails = null;
        state.error = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifyPaymentLoading = false;
        state.error = action.payload;
      });

    // ===== GET ORDERS =====
    builder
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.customerType = action.payload.customerType;
        state.pagination = action.payload.pagination;
        state.ordersCount = action.payload.pagination.totalOrders;
        state.error = null;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET ORDER BY ID =====
    builder
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
        state.error = null;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== CANCEL ORDER =====
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.cancelOrderLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancelOrderLoading = false;
        state.currentOrder = action.payload.order;
        state.successMessage = action.payload.message;

        // Update order in orders list if exists
        const orderIndex = state.orders.findIndex(
          (order) => order._id === action.payload.order.orderId
        );
        if (orderIndex !== -1) {
          // Update the entire order, not just status
          state.orders[orderIndex] = {
            ...state.orders[orderIndex],
            orderStatus: action.payload.order.status,
            cancellation: {
              isCancelled: true,
              refundStatus: action.payload.order.refundStatus,
              refundAmount: action.payload.order.refundAmount,
            },
          };
        }

        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelOrderLoading = false;
        state.error = action.payload;
      });

    // ===== TRACK GUEST ORDER =====
    builder
      .addCase(trackGuestOrder.pending, (state) => {
        state.trackGuestOrderLoading = true;
        state.error = null;
      })
      .addCase(trackGuestOrder.fulfilled, (state, action) => {
        state.trackGuestOrderLoading = false;
        state.trackedGuestOrder = action.payload.order;
        state.error = null;
      })
      .addCase(trackGuestOrder.rejected, (state, action) => {
        state.trackGuestOrderLoading = false;
        state.error = action.payload;
        state.trackedGuestOrder = null;
      });

    // ===== CANCEL GUEST ORDER =====
    builder
      .addCase(cancelGuestOrder.pending, (state) => {
        state.cancelOrderLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(cancelGuestOrder.fulfilled, (state, action) => {
        state.cancelOrderLoading = false;
        state.trackedGuestOrder = action.payload.order;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(cancelGuestOrder.rejected, (state, action) => {
        state.cancelOrderLoading = false;
        state.error = action.payload;
      });

    // ===== VALIDATE COUPON =====
    builder
      .addCase(validateCoupon.pending, (state) => {
        state.couponValidation.loading = true;
        state.couponValidation.error = null;
        state.couponValidation.isValid = false;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.couponValidation.loading = false;
        state.couponValidation.isValid = true;
        state.couponValidation.coupon = action.payload.coupon;
        state.couponValidation.discount = action.payload.discount;
        state.couponValidation.error = null;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.couponValidation.loading = false;
        state.couponValidation.isValid = false;
        state.couponValidation.error = action.payload;
        state.couponValidation.coupon = null;
        state.couponValidation.discount = null;
      });

    // ===== GET ORDER SUMMARY =====
    builder
      .addCase(getOrderSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(getOrderSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.orderSummary = action.payload.summary;
        state.customerType = action.payload.customerType;
        state.error = null;
      })
      .addCase(getOrderSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload;
      });

    // ===== DOWNLOAD INVOICE =====
    builder
      .addCase(downloadInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoice = action.payload.invoice;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(downloadInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ON USER LOGOUT....................................................................
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        // Reset orders to initial state on logout
        Object.assign(state, initialState);
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        // Reset orders to initial state on account deletion
        Object.assign(state, initialState);
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearError,
  clearSuccessMessage,
  clearCouponValidation,
  clearCheckoutOrder,
  clearCurrentOrder,
  clearTrackedGuestOrder,
  resetOrders,
} = orderSlice.actions;

// Selectors
export const selectOrders = (state) => state.order.orders;
export const selectOrdersCount = (state) => state.order.ordersCount;
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectPagination = (state) => state.order.pagination;
export const selectCustomerType = (state) => state.order.customerType;
export const selectOrderSummary = (state) => state.order.orderSummary;
export const selectCouponValidation = (state) => state.order.couponValidation;
export const selectCheckoutOrder = (state) => state.order.checkoutOrder;
export const selectRazorpayDetails = (state) => state.order.razorpayDetails;
export const selectTrackedGuestOrder = (state) => state.order.trackedGuestOrder;
export const selectInvoice = (state) => state.order.invoice;

// Loading selectors
export const selectOrderLoading = (state) => state.order.loading;
export const selectCreateOrderLoading = (state) =>
  state.order.createOrderLoading;
export const selectVerifyPaymentLoading = (state) =>
  state.order.verifyPaymentLoading;
export const selectCancelOrderLoading = (state) =>
  state.order.cancelOrderLoading;
export const selectSummaryLoading = (state) => state.order.summaryLoading;
export const selectTrackGuestOrderLoading = (state) =>
  state.order.trackGuestOrderLoading;

// Error & success selectors
export const selectOrderError = (state) => state.order.error;
export const selectOrderSuccessMessage = (state) => state.order.successMessage;

// Computed selectors
export const selectHasOrders = (state) => state.order.ordersCount > 0;

export const selectOrderById = (orderId) => (state) => {
  return state.order.orders.find((order) => order._id === orderId);
};

export const selectOrdersByStatus = (status) => (state) => {
  return state.order.orders.filter((order) => order.orderStatus === status);
};

export const selectPendingOrders = (state) => {
  return state.order.orders.filter(
    (order) =>
      order.orderStatus === "pending" || order.orderStatus === "confirmed"
  );
};

export const selectCompletedOrders = (state) => {
  return state.order.orders.filter(
    (order) => order.orderStatus === "delivered"
  );
};

export const selectCancelledOrders = (state) => {
  return state.order.orders.filter(
    (order) => order.orderStatus === "cancelled"
  );
};

export const selectIsCouponValid = (state) =>
  state.order.couponValidation.isValid;

export const selectCouponDiscount = (state) => {
  return state.order.couponValidation.discount?.amount || 0;
};

// Reducer
export default orderSlice.reducer;
