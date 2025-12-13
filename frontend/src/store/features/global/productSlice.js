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

// Initial state
const initialState = {
  // All Products
  products: [],
  productsLoading: false,
  productsError: null,

  // Single Product
  currentProduct: null,
  currentProductReviews: [],
  productLoading: false,
  productError: null,

  // UI States
  totalProducts: 0,
};


// ==================== SLICE ====================

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    // Clear current product
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.currentProductReviews = [];
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
        state.products = action.payload.products;
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
        state.currentProduct = action.payload.product;
        state.currentProductReviews = action.payload.reviews;
        state.productError = null;
      })
      .addCase(getOneProduct.rejected, (state, action) => {
        state.productLoading = false;
        state.productError = action.payload;
        state.currentProduct = null;
        state.currentProductReviews = [];
      });
  },
});

// ==================== EXPORTS ====================

// Actions
export const { clearCurrentProduct, clearProducts, clearErrors } =
  productSlice.actions;

// Selectors
export const selectAllProducts = (state) => state.product.products;
export const selectProductsLoading = (state) => state.product.productsLoading;
export const selectProductsError = (state) => state.product.productsError;
export const selectTotalProducts = (state) => state.product.totalProducts;

export const selectCurrentProduct = (state) => state.product.currentProduct;
export const selectCurrentProductReviews = (state) => state.product.currentProductReviews;
export const selectProductLoading = (state) => state.product.productLoading;
export const selectProductError = (state) => state.product.productError;

// Reducer
export default productSlice.reducer;