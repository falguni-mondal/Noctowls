import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// ==================== ASYNC THUNKS ====================

export const getAllAdminProducts = createAsyncThunk(
  "adminProducts/getAllAdminProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/products/");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

export const getOneAdminProduct = createAsyncThunk(
  "adminProducts/getOneAdminProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await adminApi.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product"
      );
    }
  }
);

export const addProduct = createAsyncThunk(
  "adminProducts/addProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await adminApi.post("/products/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      const err = error?.response?.data;

      return rejectWithValue({
        message: err?.message || "Failed to add product",
        errors: err?.errors || null,
        success: err?.success || false,
      });
    }
  }
);

export const updateProduct = createAsyncThunk(
  "adminProducts/updateProduct",
  async ({ productId, formData }, { rejectWithValue }) => {
    try {
      const res = await adminApi.put(
        `/products/update/${productId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } catch (error) {
      const err = error?.response?.data;
      return rejectWithValue({
        message: err?.message || "Failed to update product",
        errors: err?.errors || null,
        success: err?.success || false,
      });
    }
  }
);

// ==================== SLICE ====================

const adminProductSlice = createSlice({
  name: "adminProducts",

  initialState: {
    // All Products
    adminProducts: [],
    adminProductsLoading: false,
    adminProductsError: null,

    // Single Product
    adminProduct: null,
    adminProductReviews: [],
    adminProductLoading: false,
    adminProductError: null,

    // UI States
    totalAdminProducts: 0,

    // Add Product
    add: {
      loading: false,
      success: null,
      error: null,
    },

    // Update Product
    update: {
      loading: false,
      success: null,
      error: null,
    },
  },

  reducers: {
    // Clear current product
    clearAdminProduct: (state) => {
      state.adminProduct = null;
      state.adminProductReviews = [];
      state.adminProductError = null;
    },

    // Clear all products
    clearAdminProducts: (state) => {
      state.adminProducts = [];
      state.adminProductsError = null;
    },

    // Clear all errors
    clearErrors: (state) => {
      state.adminProductsError = null;
      state.adminProductError = null;
    },

    // Clear Add Product State
    resetAddProductState: (state) => {
      state.add.loading = false;
      state.add.success = null;
      state.add.error = null;
    },

    // Clear Update Product State
    resetUpdateProductState: (state) => {
      state.update.loading = false;
      state.update.success = null;
      state.update.error = null;
    },
  },

  extraReducers: (builder) => {
    // ===== GET ALL PRODUCTS =====
    builder
      .addCase(getAllAdminProducts.pending, (state) => {
        state.adminProductsLoading = true;
        state.adminProductsError = null;
      })
      .addCase(getAllAdminProducts.fulfilled, (state, action) => {
        state.adminProductsLoading = false;
        state.adminProducts = action.payload.productGroups;
        state.totalAdminProducts = action.payload.totalProducts;
        state.adminProductsError = null;
      })
      .addCase(getAllAdminProducts.rejected, (state, action) => {
        state.adminProductsLoading = false;
        state.adminProductsError = action.payload;
        state.adminProducts = [];
      });

    // ===== GET ONE PRODUCT =====
    builder
      .addCase(getOneAdminProduct.pending, (state) => {
        state.adminProductLoading = true;
        state.adminProductError = null;
      })
      .addCase(getOneAdminProduct.fulfilled, (state, action) => {
        state.adminProductLoading = false;
        state.adminProduct = action.payload.product;
        state.adminProductReviews = action.payload.reviews;
        state.adminProductError = null;
      })
      .addCase(getOneAdminProduct.rejected, (state, action) => {
        state.adminProductLoading = false;
        state.adminProductError = action.payload;
        state.adminProduct = null;
        state.adminProductReviews = [];
      });

    // ===== ADD PRODUCT =====
    builder
      .addCase(addProduct.pending, (state) => {
        state.add.loading = true;
        state.add.success = null;
        state.add.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.add.loading = false;
        state.add.success = action.payload;
        state.add.error = null;
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.add.loading = false;
        state.add.success = null;
        state.add.error = action.payload || {
          message: "Something went wrong",
          errors: null,
        };
      });

    // ===== UPDATE PRODUCT =====
    builder
      .addCase(updateProduct.pending, (state) => {
        state.update.loading = true;
        state.update.success = null;
        state.update.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.update.loading = false;
        state.update.success = action.payload;
        state.update.error = null;

        // Update the product in adminProducts array if it exists
        const index = state.adminProducts.findIndex(
          (p) => p._id === action.payload.product._id
        );
        if (index !== -1) {
          state.adminProducts[index] = action.payload.product;
        }

        // Update current product if viewing it
        if (state.adminProduct?._id === action.payload.product._id) {
          state.adminProduct = action.payload.product;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.update.loading = false;
        state.update.success = null;
        state.update.error = action.payload || {
          message: "Something went wrong",
          errors: null,
        };
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const {
  clearAdminProduct,
  clearAdminProducts,
  clearErrors,
  resetAddProductState,
  resetUpdateProductState,
} = adminProductSlice.actions;

// Reducer
export default adminProductSlice.reducer;
