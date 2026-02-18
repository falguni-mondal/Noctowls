import ReactPixel from 'react-facebook-pixel';

// CHANGE: Use import.meta.env for Vite
const pixelId = import.meta.env.VITE_META_PIXEL_ID; 

const options = {
  autoConfig: true, 
  debug: false, 
};

// Initialize Pixel
export const initPixel = () => {
  if (pixelId) {
    // FIX: init takes 3 arguments: (ID, AdvancedMatching, Options)
    // We pass {} as the second argument since we aren't sending user data on init
    ReactPixel.init(pixelId, {}, options);
    
    // REMOVED: ReactPixel.pageView(); 
    // Why? Because App.jsx already handles the PageView event on load.
    // Keeping it here would double-count your traffic.
  } else {
    console.warn("⚠️ Meta Pixel ID is missing in .env file");
  }
};

// Track Standard Events (Purchase, AddToCart, etc.)
export const trackEvent = (event, data) => {
  if (pixelId) {
    ReactPixel.track(event, data);
  }
};

// Track Custom Events
export const trackCustomEvent = (event, data) => {
  if (pixelId) {
    ReactPixel.trackCustom(event, data);
  }
};