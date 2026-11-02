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
  async (productData, { rejectWithValue }) => {
    try {
      const res = await adminApi.post("/products/add", productData);
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
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      const res = await adminApi.put(
        `/products/update/${productId}`,
        productData
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

// Async Thunk for Reordering Products via Drag-and-Drop
export const reorderAdminProducts = createAsyncThunk(
  "adminProducts/reorderAdminProducts",
  async (
    { category, orderedProductIds, resetToLatest = false },
    { rejectWithValue }
  ) => {
    try {
      const response = await adminApi.put("/products/reorder", {
        category,
        orderedProductIds,
        resetToLatest,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product sequence"
      );
    }
  }
);

// Async Thunk for Inventory Export
export const exportInventory = createAsyncThunk(
  "adminProducts/exportInventory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/products/export");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export inventory"
      );
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

    // Reorder Products (Drag-and-Drop Sequence)
    reorder: {
      loading: false,
      savingCategory: null,
      error: null,
    },

    // EXPORT INVENTORY State
    export: {
      loading: false,
      data: null,
      error: null,
    },
  },

  reducers: {
    clearAdminProduct: (state) => {
      state.adminProduct = null;
      state.adminProductReviews = [];
      state.adminProductError = null;
    },

    clearAdminProducts: (state) => {
      state.adminProducts = [];
      state.adminProductsError = null;
    },

    clearErrors: (state) => {
      state.adminProductsError = null;
      state.adminProductError = null;
    },

    resetAddProductState: (state) => {
      state.add.loading = false;
      state.add.success = null;
      state.add.error = null;
    },

    resetUpdateProductState: (state) => {
      state.update.loading = false;
      state.update.success = null;
      state.update.error = null;
    },

    resetExportState: (state) => {
      state.export.loading = false;
      state.export.data = null;
      state.export.error = null;
    },

    // Optimistic in-place reorder for instant drag-and-drop UI feedback
    optimisticReorderCategoryProducts: (state, action) => {
      const { category, reorderedProducts } = action.payload || {};
      if (!category || !Array.isArray(reorderedProducts)) return;

      const groupIndex = state.adminProducts.findIndex(
        (grp) => grp.category === category
      );
      if (groupIndex !== -1) {
        state.adminProducts[groupIndex].products = reorderedProducts.map(
          (prod, idx) => ({
            ...prod,
            displayOrder: idx,
          })
        );
      }
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
        state.adminProducts = action.payload.productGroups || [];
        state.totalAdminProducts = action.payload.totalProducts || 0;
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

        const updatedProd = action.payload?.product;
        if (updatedProd) {
          const targetId = String(updatedProd._id || updatedProd.id);
          if (
            state.adminProduct &&
            String(state.adminProduct._id || state.adminProduct.id) === targetId
          ) {
            state.adminProduct = updatedProd;
          }
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

    // ===== REORDER PRODUCTS (DRAG & DROP) =====
    builder
      .addCase(reorderAdminProducts.pending, (state, action) => {
        state.reorder.loading = true;
        state.reorder.savingCategory = action.meta?.arg?.category || null;
        state.reorder.error = null;
      })
      .addCase(reorderAdminProducts.fulfilled, (state) => {
        state.reorder.loading = false;
        state.reorder.savingCategory = null;
        state.reorder.error = null;
      })
      .addCase(reorderAdminProducts.rejected, (state, action) => {
        state.reorder.loading = false;
        state.reorder.savingCategory = null;
        state.reorder.error =
          action.payload || "Failed to update product sequence";
      });

    // EXPORT INVENTORY
    builder
      .addCase(exportInventory.pending, (state) => {
        state.export.loading = true;
        state.export.data = null;
        state.export.error = null;
      })
      .addCase(exportInventory.fulfilled, (state, action) => {
        state.export.loading = false;
        state.export.data = action.payload.data;
        state.export.error = null;
      })
      .addCase(exportInventory.rejected, (state, action) => {
        state.export.loading = false;
        state.export.data = null;
        state.export.error = action.payload || "Failed to export inventory";
      });
  },
});

export const {
  clearAdminProduct,
  clearAdminProducts,
  clearErrors,
  resetAddProductState,
  resetUpdateProductState,
  resetExportState,
  optimisticReorderCategoryProducts,
} = adminProductSlice.actions;

export default adminProductSlice.reducer;