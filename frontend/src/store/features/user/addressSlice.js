import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";

// ==================== ASYNC THUNKS ====================

// Get all addresses
export const getAddresses = createAsyncThunk(
  "address/getAddresses",
  async ({ type, search } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (search) params.append("search", search);

      const queryString = params.toString();
      const response = await userApi.get(
        `/address${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch addresses"
      );
    }
  }
);

// Get default address
export const getDefaultAddress = createAsyncThunk(
  "address/getDefaultAddress",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/address/default");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch default address"
      );
    }
  }
);

// Get address by ID
export const getAddressById = createAsyncThunk(
  "address/getAddressById",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await userApi.get(`/address/${addressId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch address"
      );
    }
  }
);

// Add new address
export const addAddress = createAsyncThunk(
  "address/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/address", addressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add address"
      );
    }
  }
);

// Update address
export const updateAddress = createAsyncThunk(
  "address/updateAddress",
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const response = await userApi.put(
        `/address/${addressId}`,
        addressData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update address"
      );
    }
  }
);

// Delete address
export const deleteAddress = createAsyncThunk(
  "address/deleteAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await userApi.delete(`/address/${addressId}`);
      return { ...response.data, addressId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete address"
      );
    }
  }
);

// Set default address
export const setDefaultAddress = createAsyncThunk(
  "address/setDefaultAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await userApi.patch(`/address/${addressId}/default`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to set default address"
      );
    }
  }
);

// Get address statistics
export const getAddressStatistics = createAsyncThunk(
  "address/getAddressStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/address/statistics");
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
  // Addresses list
  addresses: [],
  addressesCount: 0,

  // Default address
  defaultAddress: null,

  // Current address (single view/edit)
  currentAddress: null,

  // Address statistics
  statistics: null,

  // Loading states
  loading: false, // General loading
  addAddressLoading: false,
  updateAddressLoading: false,
  deleteAddressLoading: false,
  setDefaultLoading: false,

  // Error states
  error: null,

  // Success messages
  successMessage: null,
};

// ==================== SLICE ====================

const addressSlice = createSlice({
  name: "address",
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

    // Clear current address
    clearCurrentAddress: (state) => {
      state.currentAddress = null;
    },

    // Reset address state (on logout)
    resetAddresses: (state) => {
      state.addresses = [];
      state.addressesCount = 0;
      state.defaultAddress = null;
      state.currentAddress = null;
      state.statistics = null;
      state.error = null;
      state.successMessage = null;
    },

    // Optimistic add address
    optimisticAddAddress: (state, action) => {
      state.addresses.unshift(action.payload);
      state.addressesCount += 1;
    },

    // Optimistic delete address
    optimisticDeleteAddress: (state, action) => {
      const addressId = action.payload;
      state.addresses = state.addresses.filter((addr) => addr._id !== addressId);
      state.addressesCount = Math.max(0, state.addressesCount - 1);
    },

    // Optimistic update address
    optimisticUpdateAddress: (state, action) => {
      const { addressId, addressData } = action.payload;
      const index = state.addresses.findIndex((addr) => addr._id === addressId);
      if (index !== -1) {
        state.addresses[index] = {
          ...state.addresses[index],
          ...addressData,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // ===== GET ADDRESSES =====
    builder
      .addCase(getAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload.addresses;
        state.addressesCount = action.payload.count;
        state.error = null;
      })
      .addCase(getAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== GET DEFAULT ADDRESS =====
    builder
      .addCase(getDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.defaultAddress = action.payload.address;
        state.error = null;
      })
      .addCase(getDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.defaultAddress = null;
      });

    // ===== GET ADDRESS BY ID =====
    builder
      .addCase(getAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAddressById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAddress = action.payload.address;
        state.error = null;
      })
      .addCase(getAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== ADD ADDRESS =====
    builder
      .addCase(addAddress.pending, (state) => {
        state.addAddressLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addAddressLoading = false;
        state.addresses.unshift(action.payload.address);
        state.addressesCount += 1;
        state.successMessage = action.payload.message;

        // Update default address if this is the first address or marked as default
        if (action.payload.address.isDefault) {
          state.defaultAddress = action.payload.address;
          // Unset other defaults
          state.addresses.forEach((addr) => {
            if (addr._id !== action.payload.address._id) {
              addr.isDefault = false;
            }
          });
        }

        state.error = null;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.addAddressLoading = false;
        state.error = action.payload;
      });

    // ===== UPDATE ADDRESS =====
    builder
      .addCase(updateAddress.pending, (state) => {
        state.updateAddressLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.updateAddressLoading = false;
        
        // Update in addresses list
        const index = state.addresses.findIndex(
          (addr) => addr._id === action.payload.address._id
        );
        if (index !== -1) {
          state.addresses[index] = action.payload.address;
        }

        // Update current address if it's the same
        if (state.currentAddress?._id === action.payload.address._id) {
          state.currentAddress = action.payload.address;
        }

        // Update default address if this is the default
        if (action.payload.address.isDefault) {
          state.defaultAddress = action.payload.address;
          // Unset other defaults
          state.addresses.forEach((addr) => {
            if (addr._id !== action.payload.address._id) {
              addr.isDefault = false;
            }
          });
        }

        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.updateAddressLoading = false;
        state.error = action.payload;
      });

    // ===== DELETE ADDRESS =====
    builder
      .addCase(deleteAddress.pending, (state) => {
        state.deleteAddressLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.deleteAddressLoading = false;
        
        // Remove from addresses list
        state.addresses = state.addresses.filter(
          (addr) => addr._id !== action.payload.addressId
        );
        state.addressesCount = Math.max(0, state.addressesCount - 1);

        // Clear default if deleted
        if (state.defaultAddress?._id === action.payload.addressId) {
          state.defaultAddress = null;
        }

        // Clear current if deleted
        if (state.currentAddress?._id === action.payload.addressId) {
          state.currentAddress = null;
        }

        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.deleteAddressLoading = false;
        state.error = action.payload;
      });

    // ===== SET DEFAULT ADDRESS =====
    builder
      .addCase(setDefaultAddress.pending, (state) => {
        state.setDefaultLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.setDefaultLoading = false;
        state.defaultAddress = action.payload.address;

        // Update isDefault for all addresses
        state.addresses.forEach((addr) => {
          addr.isDefault = addr._id === action.payload.address._id;
        });

        // Update current address if it's the same
        if (state.currentAddress?._id === action.payload.address._id) {
          state.currentAddress = action.payload.address;
        }

        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.setDefaultLoading = false;
        state.error = action.payload;
      });

    // ===== GET ADDRESS STATISTICS =====
    builder
      .addCase(getAddressStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAddressStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload.statistics;
        state.error = null;
      })
      .addCase(getAddressStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearError,
  clearSuccessMessage,
  clearCurrentAddress,
  resetAddresses,
  optimisticAddAddress,
  optimisticDeleteAddress,
  optimisticUpdateAddress,
} = addressSlice.actions;

// Selectors
export const selectAddresses = (state) => state.address.addresses;
export const selectAddressesCount = (state) => state.address.addressesCount;
export const selectDefaultAddress = (state) => state.address.defaultAddress;
export const selectCurrentAddress = (state) => state.address.currentAddress;
export const selectAddressStatistics = (state) => state.address.statistics;

// Loading selectors
export const selectAddressLoading = (state) => state.address.loading;
export const selectAddAddressLoading = (state) => state.address.addAddressLoading;
export const selectUpdateAddressLoading = (state) => state.address.updateAddressLoading;
export const selectDeleteAddressLoading = (state) => state.address.deleteAddressLoading;
export const selectSetDefaultLoading = (state) => state.address.setDefaultLoading;

// Error & success selectors
export const selectAddressError = (state) => state.address.error;
export const selectAddressSuccessMessage = (state) => state.address.successMessage;

// Computed selectors
export const selectHasAddresses = (state) => state.address.addressesCount > 0;

export const selectAddressById = (addressId) => (state) => {
  return state.address.addresses.find((addr) => addr._id === addressId);
};

export const selectAddressesByType = (type) => (state) => {
  return state.address.addresses.filter(
    (addr) => addr.addressType === type
  );
};

export const selectHomeAddresses = (state) => {
  return state.address.addresses.filter((addr) => addr.addressType === "home");
};

export const selectWorkAddresses = (state) => {
  return state.address.addresses.filter((addr) => addr.addressType === "work");
};

export const selectOtherAddresses = (state) => {
  return state.address.addresses.filter((addr) => addr.addressType === "other");
};

export const selectHasDefaultAddress = (state) => {
  return !!state.address.defaultAddress;
};

export const selectIsDefaultAddress = (addressId) => (state) => {
  return state.address.defaultAddress?._id === addressId;
};

// Helper selector to check if an address is complete
export const selectIsAddressComplete = (addressId) => (state) => {
  const address = state.address.addresses.find((addr) => addr._id === addressId);
  if (!address) return false;

  return !!(
    address.fullName &&
    address.phone &&
    address.address &&
    address.city &&
    address.state &&
    address.pincode
  );
};

// Get formatted address string
export const selectFormattedAddress = (addressId) => (state) => {
  const address = state.address.addresses.find((addr) => addr._id === addressId);
  if (!address) return "";

  let formatted = address.address;
  if (address.landmark) formatted += `, ${address.landmark}`;
  formatted += `, ${address.city}, ${address.state} - ${address.pincode}`;
  return formatted;
};

// Get short address (for display in lists)
export const selectShortAddress = (addressId) => (state) => {
  const address = state.address.addresses.find((addr) => addr._id === addressId);
  if (!address) return "";

  return `${address.city}, ${address.state} - ${address.pincode}`;
};

// Reducer
export default addressSlice.reducer;