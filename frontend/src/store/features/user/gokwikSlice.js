import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Holds the user data returned from GoKwik (Name, Phone, Address)
  prefilledData: null, 
  
  // Flag to know if the user verified their phone via OTP
  isVerified: false, 
  
  // Track if the GoKwik modal is currently opening/processing
  isLoading: false,
};

const gokwikSlice = createSlice({
  name: "gokwik",
  initialState,
  reducers: {
    // ✅ Action 1: Save Verified Data
    // Call this when GoKwik returns success
    setGokwikData: (state, action) => {
      state.prefilledData = action.payload; // { name, mobile, address, email... }
      state.isVerified = true;
      state.isLoading = false;
    },

    // ✅ Action 2: Clear Data
    // Call this on Logout or Order Completion
    clearGokwikData: (state) => {
      state.prefilledData = null;
      state.isVerified = false;
      state.isLoading = false;
    },

    // Optional: UI Helper
    setGokwikLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const { setGokwikData, clearGokwikData, setGokwikLoading } = gokwikSlice.actions;

// --- SELECTORS ---
export const selectGokwikData = (state) => state.gokwik.prefilledData;
export const selectIsGokwikVerified = (state) => state.gokwik.isVerified;
export const selectGokwikLoading = (state) => state.gokwik.isLoading;

export default gokwikSlice.reducer;