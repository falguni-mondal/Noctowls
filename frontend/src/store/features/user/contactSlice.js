import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig"; 

// Use your configured axios instance if you have one (e.g., import axios from "../../../utils/axios")
// Otherwise, ensure your base URL is set or use the full URL below.

export const submitContactForm = createAsyncThunk(
    "contact/submit",
    async (formData, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            const { data } = await userApi.post(
                `/contact/submit`, // Ensure this matches your backend route
                formData,
                config
            );

            return data;
        } catch (error) {
            // Return specific error message from backend if available
            if (error.response && error.response.data.message) {
                return rejectWithValue(error.response.data.message);
            } else {
                return rejectWithValue(error.message);
            }
        }
    }
);

const contactSlice = createSlice({
    name: "contact",
    initialState: {
        loading: false,
        success: false,
        error: null,
    },
    reducers: {
        // Call this to clear messages after showing a toast/alert
        resetContactState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitContactForm.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(submitContactForm.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
                state.error = null;
            })
            .addCase(submitContactForm.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});

export const { resetContactState } = contactSlice.actions;

// Selectors
export const selectContactLoading = (state) => state.contact.loading;
export const selectContactSuccess = (state) => state.contact.success;
export const selectContactError = (state) => state.contact.error;

export default contactSlice.reducer;