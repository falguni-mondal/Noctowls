import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../configs/userAxiosConfig";

// Fetch ALL Product Reviews
export const fetchProductReviews = createAsyncThunk(
    "reviews/fetchProductReviews",
    async ({ productId, sortBy = "Featured" }, { rejectWithValue }) => {
        try {
            const response = await userApi.get(`/reviews/product/${productId}`, {
                params: { sortBy }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
        }
    }
);

// NEW: Fetch Recent Reviews (Limit 5)
export const fetchRecentReviews = createAsyncThunk(
    "reviews/fetchRecentReviews",
    async ({ productId, sortBy = "Featured" }, { rejectWithValue }) => {
        try {
            const response = await userApi.get(`/reviews/product/${productId}/recent`, {
                params: { sortBy }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch recent reviews");
        }
    }
);

// Check Eligibility
export const checkReviewEligibility = createAsyncThunk(
    "reviews/checkEligibility",
    async (productId, { rejectWithValue }) => {
        try {
            const response = await userApi.get(`/reviews/eligibility/${productId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Eligibility check failed");
        }
    }
);

export const submitReview = createAsyncThunk(
    "reviews/submitReview",
    async ({ productId, formData }, { rejectWithValue }) => {
        try {
            const response = await userApi.post(`/reviews/${productId}`, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit review");
        }
    }
);

export const updateReview = createAsyncThunk(
    "reviews/updateReview",
    async ({ reviewId, formData }, { rejectWithValue }) => {
        try {
            const response = await userApi.put(`/reviews/${reviewId}`, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update review");
        }
    }
);

const initialState = {
    reviews: [],
    stats: null, 
    
    eligibility: {
        canReview: false,
        hasReviewed: false,
        existingReview: null,
        message: "",
        loading: false
    },

    fetchLoading: false,
    submitLoading: false,
    error: null,
    successMessage: null,
};

const reviewSlice = createSlice({
    name: "reviews",
    initialState,
    reducers: {
        clearReviewFeedback: (state) => {
            state.error = null;
            state.successMessage = null;
        },
        resetReviewState: (state) => {
            state.reviews = [];
            state.stats = null;
            state.eligibility = initialState.eligibility;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // --- FETCH ALL REVIEWS ---
        builder.addCase(fetchProductReviews.pending, (state) => {
            state.fetchLoading = true;
            state.error = null;
        });
        builder.addCase(fetchProductReviews.fulfilled, (state, action) => {
            state.fetchLoading = false;
            state.reviews = action.payload.reviews;
            state.stats = action.payload.stats;
        });
        builder.addCase(fetchProductReviews.rejected, (state, action) => {
            state.fetchLoading = false;
            state.error = action.payload;
        });

        // --- FETCH RECENT REVIEWS ---
        builder.addCase(fetchRecentReviews.pending, (state) => {
            state.fetchLoading = true;
            state.error = null;
        });
        builder.addCase(fetchRecentReviews.fulfilled, (state, action) => {
            state.fetchLoading = false;
            state.reviews = action.payload.reviews;
            state.stats = action.payload.stats;
        });
        builder.addCase(fetchRecentReviews.rejected, (state, action) => {
            state.fetchLoading = false;
            state.error = action.payload;
        });

        // --- CHECK ELIGIBILITY ---
        builder.addCase(checkReviewEligibility.pending, (state) => {
            state.eligibility.loading = true;
        });
        builder.addCase(checkReviewEligibility.fulfilled, (state, action) => {
            state.eligibility.loading = false;
            state.eligibility.canReview = action.payload.canReview;
            state.eligibility.hasReviewed = action.payload.hasReviewed;
            state.eligibility.existingReview = action.payload.review || null;
            state.eligibility.message = action.payload.message;
        });
        builder.addCase(checkReviewEligibility.rejected, (state) => {
            state.eligibility.loading = false;
            state.eligibility.canReview = false; 
        });

        // --- SUBMIT REVIEW ---
        builder.addCase(submitReview.pending, (state) => {
            state.submitLoading = true;
            state.error = null;
            state.successMessage = null;
        });
        builder.addCase(submitReview.fulfilled, (state, action) => {
            state.submitLoading = false;
            state.successMessage = action.payload.message;
            state.eligibility.hasReviewed = true; 
            state.eligibility.canReview = false;
            state.eligibility.existingReview = action.payload.review;
        });
        builder.addCase(submitReview.rejected, (state, action) => {
            state.submitLoading = false;
            state.error = action.payload;
        });

        // --- UPDATE REVIEW ---
        builder.addCase(updateReview.pending, (state) => {
            state.submitLoading = true;
            state.error = null;
        });
        builder.addCase(updateReview.fulfilled, (state, action) => {
            state.submitLoading = false;
            state.successMessage = action.payload.message;
            state.eligibility.existingReview = action.payload.review;
        });
        builder.addCase(updateReview.rejected, (state, action) => {
            state.submitLoading = false;
            state.error = action.payload;
        });
    },
});

export const { clearReviewFeedback, resetReviewState } = reviewSlice.actions;

export const selectProductReviews = (state) => state.reviews.reviews;
export const selectReviewStats = (state) => state.reviews.stats;
export const selectReviewEligibility = (state) => state.reviews.eligibility;
export const selectReviewLoading = (state) => state.reviews.fetchLoading;
export const selectSubmitLoading = (state) => state.reviews.submitLoading;
export const selectReviewError = (state) => state.reviews.error;
export const selectReviewSuccess = (state) => state.reviews.successMessage;

export default reviewSlice.reducer;