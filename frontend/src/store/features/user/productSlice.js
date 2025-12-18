import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";

// ==================== ASYNC THUNKS ====================

export const getAllProducts = createAsyncThunk(
  "product/getAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/products/");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

export const getOneProduct = createAsyncThunk(
  "product/getOneProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userApi.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product"
      );
    }
  }
);

export const validateProductStock = createAsyncThunk(
  "product/validateStock",
  async ({ productId, size, requestedQuantity }, { rejectWithValue }) => {
    try {
      const response = await userApi.post(
        `/products/${productId}/validate-stock`,
        {
          size,
          requestedQuantity,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to validate stock"
      );
    }
  }
);

// Initial state
const initialState = {
  // All Products
  products: [],
  productsLoading: false,
  productsError: null,

  // Single Product
  product: null,
  productReviews: [],
  productLoading: false,
  productError: null,

  // Stock Validation
  stockValidation: {
    loading: false,
    error: null,
    data: null,
  },

  // UI States
  totalProducts: 0,
};

// ==================== SLICE ====================

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    // Clear current product
    clearProduct: (state) => {
      state.product = null;
      state.productReviews = [];
      state.productError = null;
    },

    // Clear all products
    clearProducts: (state) => {
      state.products = [];
      state.productsError = null;
    },

    // Clear all errors
    clearErrors: (state) => {
      state.productsError = null;
      state.productError = null;
    },

    // Clear stock validation
    clearStockValidation: (state) => {
      state.stockValidation = {
        loading: false,
        error: null,
        data: null,
      };
    },
  },
  extraReducers: (builder) => {
    // ===== GET ALL PRODUCTS =====
    builder
      .addCase(getAllProducts.pending, (state) => {
        state.productsLoading = true;
        state.productsError = null;
      })
      .addCase(getAllProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload.productGroups;
        state.totalProducts = action.payload.count;
        state.productsError = null;
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.productsLoading = false;
        state.productsError = action.payload;
        state.products = [];
      });

    // ===== GET ONE PRODUCT =====
    builder
      .addCase(getOneProduct.pending, (state) => {
        state.productLoading = true;
        state.productError = null;
      })
      .addCase(getOneProduct.fulfilled, (state, action) => {
        state.productLoading = false;
        state.product = action.payload.product;
        state.productReviews = action.payload.reviews;
        state.productError = null;
      })
      .addCase(getOneProduct.rejected, (state, action) => {
        state.productLoading = false;
        state.productError = action.payload;
        state.product = null;
        state.productReviews = [];
      });

    // ===== VALIDATE STOCK =====
    builder
      .addCase(validateProductStock.pending, (state) => {
        state.stockValidation.loading = true;
        state.stockValidation.error = null;
      })
      .addCase(validateProductStock.fulfilled, (state, action) => {
        state.stockValidation.loading = false;
        state.stockValidation.data = action.payload.data;
        state.stockValidation.error = null;
      })
      .addCase(validateProductStock.rejected, (state, action) => {
        state.stockValidation.loading = false;
        state.stockValidation.error = action.payload;
        state.stockValidation.data = null;
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const { clearProduct, clearProducts, clearErrors, clearStockValidation } =
  productSlice.actions;

// Reducer
export default productSlice.reducer;
