import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../../configs/adminAxiosConfig";

// Fetch All Reviews (Admin)
// Supports filtering by status (pending, accepted, rejected) and pagination
export const fetchAllReviews = createAsyncThunk(
    "adminReviews/fetchAll",
    async ({ status = "", page = 1, limit = 10 }, { rejectWithValue }) => {
        try {
            const response = await adminApi.get("/reviews/all", {
                params: { status, page, limit }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
        }
    }
);

// Update Review Status (Approve/Reject)
export const updateReviewStatus = createAsyncThunk(
    "adminReviews/updateStatus",
    async ({ reviewId, status }, { rejectWithValue }) => {
        try {
            const response = await adminApi.patch(`/reviews/${reviewId}/status`, { status });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update review status");
        }
    }
);


const initialState = {
    reviews: [],
    pagination: {
        total: 0,
        pages: 0,
        current: 1
    },
    
    // Filters
    currentFilter: "all", // 'all', 'pending', 'accepted', 'rejected'

    // Loading States
    loading: false, // For fetching list
    actionLoading: false, // For approve/reject buttons

    // Feedback
    error: null,
    successMessage: null,
};

const adminReviewSlice = createSlice({
    name: "adminReviews",
    initialState,
    reducers: {
        setReviewFilter: (state, action) => {
            state.currentFilter = action.payload;
            state.pagination.current = 1; // Reset to page 1 when filter changes
        },
        clearAdminReviewFeedback: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        // --- FETCH ALL REVIEWS ---
        builder.addCase(fetchAllReviews.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchAllReviews.fulfilled, (state, action) => {
            state.loading = false;
            state.reviews = action.payload.reviews;
            state.pagination = action.payload.pagination;
        });
        builder.addCase(fetchAllReviews.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // --- UPDATE REVIEW STATUS ---
        builder.addCase(updateReviewStatus.pending, (state) => {
            state.actionLoading = true;
            state.error = null;
            state.successMessage = null;
        });
        builder.addCase(updateReviewStatus.fulfilled, (state, action) => {
            state.actionLoading = false;
            state.successMessage = action.payload.message;

            // Optimistic Update: Find the review and update its status locally
            // This prevents needing to re-fetch the whole list immediately
            const updatedReview = action.payload.review;
            const index = state.reviews.findIndex(r => r._id === updatedReview._id);
            
            if (index !== -1) {
                // If we are currently filtering by status (e.g. showing "Pending"), 
                // and the status changed to "Accepted", we should remove it from the list.
                if (state.currentFilter !== "all" && state.currentFilter !== updatedReview.status) {
                    state.reviews.splice(index, 1);
                    state.pagination.total -= 1; // Decrement count
                } else {
                    // Otherwise just update the object
                    state.reviews[index] = updatedReview;
                }
            }
        });
        builder.addCase(updateReviewStatus.rejected, (state, action) => {
            state.actionLoading = false;
            state.error = action.payload;
        });
    },
});

export const { setReviewFilter, clearAdminReviewFeedback } = adminReviewSlice.actions;

// Selectors
export const selectAdminReviews = (state) => state.adminReviews.reviews;
export const selectAdminReviewPagination = (state) => state.adminReviews.pagination;
export const selectAdminReviewFilter = (state) => state.adminReviews.currentFilter;
export const selectAdminReviewLoading = (state) => state.adminReviews.loading;
export const selectAdminReviewActionLoading = (state) => state.adminReviews.actionLoading;

export default adminReviewSlice.reducer;