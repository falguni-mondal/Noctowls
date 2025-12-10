import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

export const addProduct = createAsyncThunk(
  "adminProducts/addProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await adminApi.post("/products/add", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      const err = error?.response?.data;

      return rejectWithValue({
        message: err?.message || "Failed to add product",
        errors: err?.errors || null,
        success: err?.success || false
      });
    }
  }
);

const adminProductSlice = createSlice({
  name: "adminProducts",

  initialState: {
    add: {
      loading: false,
      success: null,
      error: null,
    },
  },

  reducers: {
    resetAdminProductState: (state) => {
      state.add.loading = false;
      state.add.success = null;
      state.add.error = null;
    },
  },

  extraReducers: (builder) => {
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
          errors: null 
        };
      });
  },
});

export const { resetAdminProductState } = adminProductSlice.actions;
export default adminProductSlice.reducer;