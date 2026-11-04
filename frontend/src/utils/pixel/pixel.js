import ReactPixel from "react-facebook-pixel";
import userApi from "../../configs/userAxiosConfig";

const pixelId = import.meta.env.VITE_META_PIXEL_ID;
const AM_STORAGE_KEY = "_meta_am_user";

const options = {
  autoConfig: true,
  debug: false,
};

// Official Meta Standard Events list
const STANDARD_META_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
]);

// Read browser cookie (`_fbp`, `_fbc`, or `device_id`)
const getBrowserCookie = (name) => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
};

// Build or retrieve `_fbc` click ID (falls back to URL `?fbclid=` on initial landing)
const getFbcValue = () => {
  const cookieFbc = getBrowserCookie("_fbc");
  if (cookieFbc) return cookieFbc;
  if (typeof window === "undefined") return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${fbc}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`;
      return fbc;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return undefined;
};

// Normalize phone to digits with country code (default '91' for India)
const normalizePhone = (phone, defaultCountryCode = "91") => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return undefined;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
};

// Format user data for Meta Pixel Manual Advanced Matching (`fbq('init', pixelId, advancedMatching)`)
export const formatAdvancedMatching = (rawUser = {}) => {
  let cached = {};
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(AM_STORAGE_KEY);
      if (stored) cached = JSON.parse(stored) || {};
    } catch {
      cached = {};
    }
  }

  if (!rawUser || typeof rawUser !== "object") {
    return { country: "in", ...cached };
  }

  const email = (rawUser.email || rawUser.em || "")
    .toString()
    .trim()
    .toLowerCase();
  const phone = normalizePhone(rawUser.phone || rawUser.ph);

  const fullName = (rawUser.fullName || rawUser.name || "").toString().trim();
  let fn = (rawUser.firstName || rawUser.fn || "").toString().trim().toLowerCase();
  let ln = (rawUser.lastName || rawUser.ln || "").toString().trim().toLowerCase();
  if (!fn && fullName) {
    const parts = fullName.toLowerCase().split(/\s+/);
    fn = parts[0] || "";
    ln = parts.length > 1 ? parts.slice(1).join("") : "";
  }
  fn = fn.replace(/[^a-z]/g, "");
  ln = ln.replace(/[^a-z]/g, "");

  const ct = (rawUser.city || rawUser.ct || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const st = (rawUser.state || rawUser.st || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const zp = (rawUser.pincode || rawUser.zp || "")
    .toString()
    .trim()
    .replace(/\s+/g, "");
  const externalId =
    rawUser.externalId ||
    rawUser.external_id ||
    rawUser._id ||
    rawUser.id ||
    getBrowserCookie("device_id");

  const merged = {
    country: "in",
    ...cached,
    ...(email && { em: email }),
    ...(phone && { ph: phone }),
    ...(fn && { fn }),
    ...(ln && { ln }),
    ...(ct && { ct }),
    ...(st && { st }),
    ...(zp && { zp }),
    ...(externalId && { external_id: String(externalId) }),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(AM_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage quota errors
    }
  }

  return merged;
};

// Synchronize logged-in or checkout customer details with Manual Advanced Matching
export const syncPixelUser = (userData) => {
  if (!userData) {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(AM_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    return;
  }
  const advancedMatching = formatAdvancedMatching(userData);
  if (pixelId && typeof window !== "undefined") {
    try {
      if (window.fbq) {
        window.fbq("init", pixelId, advancedMatching);
      } else {
        ReactPixel.init(pixelId, advancedMatching, options);
      }
    } catch {
      // Blocked by client extension
    }
  }
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

// Initialize Pixel with Manual Advanced Matching
export const initPixel = (userData = {}) => {
  if (pixelId) {
    try {
      const advancedMatching = formatAdvancedMatching(userData);
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("init", pixelId, advancedMatching);
      } else {
        ReactPixel.init(pixelId, advancedMatching, options);
      }
    } catch (err) {
      console.warn("Meta Pixel init blocked by client extension:", err);
    }
  } else {
    console.warn("⚠️ Meta Pixel ID is missing in .env file");
  }
};

// Relay event to first-party backend CAPI endpoint (cannot be blocked by ad blockers)
const sendToBackendCapi = (event, data = {}, eventId, userData = {}) => {
  if (typeof window === "undefined") return;
  const cachedUser = formatAdvancedMatching(userData);

  userApi
    .post("/meta/event", {
      eventName: event,
      eventId,
      eventSourceUrl: window.location.href,
      customData: data,
      userData: {
        ...(cachedUser.em && { email: cachedUser.em }),
        ...(cachedUser.ph && { phone: cachedUser.ph }),
        ...(cachedUser.fn && { firstName: cachedUser.fn }),
        ...(cachedUser.ln && { lastName: cachedUser.ln }),
        ...(cachedUser.ct && { city: cachedUser.ct }),
        ...(cachedUser.st && { state: cachedUser.st }),
        ...(cachedUser.zp && { pincode: cachedUser.zp }),
        ...(cachedUser.external_id && { externalId: cachedUser.external_id }),
        ...userData,
      },
      fbp: getBrowserCookie("_fbp"),
      fbc: getFbcValue(),
    })
    .catch(() => {
      // Silently ignore network errors on analytics relay
    });
};

// Track Standard Events (automatically routes non-standard names like ViewCart to trackCustom)
export const trackEvent = (event, data = {}, customEventId, userData = {}) => {
  if (!STANDARD_META_EVENTS.has(event)) {
    return trackCustomEvent(event, data, customEventId, userData);
  }

  const eventId = customEventId || createMetaEventId(event, data);

  if (userData && Object.keys(userData).length > 0) {
    syncPixelUser(userData);
  }

  // 1. Browser Pixel (with eventID as 4th argument for deduplication)
  if (pixelId && typeof window !== "undefined") {
    try {
      if (window.fbq) {
        window.fbq("track", event, data, { eventID: eventId });
      }
    } catch {
      // Blocked by ad blocker; server CAPI below still delivers the event
    }
  }

  // 2. First-Party Backend Conversions API (Ad-Blocker Proof)
  sendToBackendCapi(event, data, eventId, userData);

  return eventId;
};

// Track Custom Events (e.g., ViewCart)
export const trackCustomEvent = (
  event,
  data = {},
  customEventId,
  userData = {}
) => {
  const eventId = customEventId || createMetaEventId(event, data);

  if (userData && Object.keys(userData).length > 0) {
    syncPixelUser(userData);
  }

  if (pixelId && typeof window !== "undefined") {
    try {
      if (window.fbq) {
        window.fbq("trackCustom", event, data, { eventID: eventId });
      }
    } catch {
      // Blocked by ad blocker
    }
  }

  sendToBackendCapi(event, data, eventId, userData);

  return eventId;
};