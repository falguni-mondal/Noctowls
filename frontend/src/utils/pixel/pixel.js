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
    ReactPixel.init(pixelId, options);
    ReactPixel.pageView(); // Track initial page view
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