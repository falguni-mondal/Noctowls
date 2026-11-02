import ReactPixel from "react-facebook-pixel";
import userApi from "../../configs/userAxiosConfig";

const pixelId = import.meta.env.VITE_META_PIXEL_ID;

const options = {
  autoConfig: true,
  debug: false,
};

// Read browser cookie (`_fbp` or `_fbc`) for Meta CAPI match quality
const getBrowserCookie = (name) => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
};

// Generate shared event ID so Meta deduplicates browser Pixel + server CAPI events
export const createMetaEventId = (event, data = {}) => {
  if (event === "Purchase" && data?.order_id) {
    return `purchase_${data.order_id}`;
  }
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${event}_${rand}`;
};

// Initialize Pixel
export const initPixel = () => {
  if (pixelId) {
    try {
      ReactPixel.init(pixelId, {}, options);
    } catch (err) {
      console.warn("Meta Pixel init blocked by client extension:", err);
    }
  } else {
    console.warn("⚠️ Meta Pixel ID is missing in .env file");
  }
};

// Relay event to first-party backend CAPI endpoint (cannot be blocked by ad blockers)
const sendToBackendCapi = (event, data = {}, eventId) => {
  if (typeof window === "undefined") return;
  userApi
    .post("/meta/event", {
      eventName: event,
      eventId,
      eventSourceUrl: window.location.href,
      customData: data,
      fbp: getBrowserCookie("_fbp"),
      fbc: getBrowserCookie("_fbc"),
    })
    .catch(() => {
      // Silently ignore network errors on analytics relay
    });
};

// Track Standard Events (Purchase, AddToCart, InitiateCheckout, ViewContent, PageView, etc.)
export const trackEvent = (event, data = {}, customEventId) => {
  const eventId = customEventId || createMetaEventId(event, data);

  // 1. Browser Pixel (with eventID for deduplication)
  if (pixelId && typeof window !== "undefined") {
    try {
      if (window.fbq) {
        window.fbq("track", event, data, { eventID: eventId });
      } else {
        ReactPixel.track(event, data);
      }
    } catch {
      // Blocked by ad blocker; server CAPI below still delivers the event
    }
  }

  // 2. First-Party Backend Conversions API (Ad-Blocker Proof)
  sendToBackendCapi(event, data, eventId);

  return eventId;
};

// Track Custom Events
export const trackCustomEvent = (event, data = {}, customEventId) => {
  const eventId = customEventId || createMetaEventId(event, data);

  if (pixelId && typeof window !== "undefined") {
    try {
      if (window.fbq) {
        window.fbq("trackCustom", event, data, { eventID: eventId });
      } else {
        ReactPixel.trackCustom(event, data);
      }
    } catch {
      // Blocked by ad blocker
    }
  }

  sendToBackendCapi(event, data, eventId);

  return eventId;
};