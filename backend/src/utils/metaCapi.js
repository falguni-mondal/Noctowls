import crypto from "crypto";
import axios from "axios";

const META_GRAPH_VERSION = "v21.0";

// Short-lived cache of recently sent server event IDs to prevent duplicate CAPI emissions
// (e.g., when both verifyPayment, /api/meta/event, and Razorpay webhook fire for the same Purchase)
const recentServerEvents = new Map();
const DEDUP_TTL_MS = 60 * 1000;

const cleanupRecentEvents = () => {
  const now = Date.now();
  for (const [id, ts] of recentServerEvents.entries()) {
    if (now - ts > DEDUP_TTL_MS) {
      recentServerEvents.delete(id);
    }
  }
};

// Allowed standard custom_data parameters per Meta Conversions API specification
const ALLOWED_CUSTOM_DATA_KEYS = new Set([
  "value",
  "currency",
  "content_name",
  "content_category",
  "content_ids",
  "contents",
  "content_type",
  "order_id",
  "predicted_ltv",
  "num_items",
  "search_string",
  "status",
  "delivery_category",
]);

/**
 * Normalizes and SHA-256 hashes user PII per Meta Conversions API specifications.
 */
const hashSha256 = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

const normalizePhone = (phone, defaultCountryCode = "91") => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return undefined;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
};

/**
 * Cleans IPv6-mapped IPv4 addresses (`::ffff:1.2.3.4` -> `1.2.3.4`) and filters out loopback IPs
 * so Meta CAPI never rejects `client_ip_address`.
 */
const normalizeClientIp = (rawIp) => {
  if (!rawIp || typeof rawIp !== "string") return undefined;
  let ip = rawIp.split(",")[0].trim();
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return undefined;
  }
  return ip;
};

/**
 * Sanitizes `custom_data` so non-standard fields (e.g., `payment_type`, `type`) or restricted
 * fields (`num_items` on non-InitiateCheckout events) never trigger a 400 error from Meta Graph API.
 */
const sanitizeCustomData = (eventName, customData = {}) => {
  if (!customData || typeof customData !== "object") return {};
  const cleaned = {};

  for (const [key, val] of Object.entries(customData)) {
    if (val === undefined || val === null || val === "") continue;
    if (!ALLOWED_CUSTOM_DATA_KEYS.has(key)) continue;
    if (key === "num_items" && eventName !== "InitiateCheckout") continue;

    if (key === "value") {
      const numVal = Number(val);
      if (!Number.isNaN(numVal)) cleaned.value = numVal;
    } else if (key === "num_items") {
      const numItems = Number(val);
      if (!Number.isNaN(numItems)) cleaned.num_items = numItems;
    } else if (key === "currency") {
      cleaned.currency = String(val).trim().toUpperCase();
    } else if (key === "content_ids" && Array.isArray(val)) {
      cleaned.content_ids = val.filter(Boolean).map((id) => String(id));
    } else if (key === "order_id") {
      cleaned.order_id = String(val);
    } else {
      cleaned[key] = val;
    }
  }

  return cleaned;
};

/**
 * Sends a server-to-server event to Meta Conversions API (CAPI).
 * Supports deduplication with browser Meta Pixel via shared `eventId`.
 * Fails gracefully (never throws) so business/checkout flows are never interrupted.
 */
export const sendMetaCapiEvent = async ({
  eventName,
  eventId,
  eventSourceUrl,
  customData = {},
  userData = {},
  req = null,
}) => {
  try {
    const pixelId =
      process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT_CODE;

    if (!pixelId || !accessToken || !eventName) {
      return {
        sent: false,
        reason: "Missing META_PIXEL_ID or META_ACCESS_TOKEN",
      };
    }

    // Prevent duplicate server-side emissions for the exact same eventId (e.g., Purchase)
    if (eventId) {
      cleanupRecentEvents();
      const dedupKey = `${eventName}:${eventId}`;
      if (recentServerEvents.has(dedupKey)) {
        return { sent: false, reason: "Duplicate server event suppressed" };
      }
      recentServerEvents.set(dedupKey, Date.now());
    }

    const rawIp =
      userData.ipAddress ||
      req?.headers?.["x-forwarded-for"] ||
      req?.ip ||
      undefined;
    const clientIp = normalizeClientIp(rawIp);

    const clientUserAgent =
      userData.userAgent || req?.headers?.["user-agent"] || undefined;

    const fbp = userData.fbp || req?.cookies?._fbp || undefined;
    const fbc = userData.fbc || req?.cookies?._fbc || undefined;
    const externalIdRaw =
      userData.externalId ||
      req?.user ||
      req?.cookies?.device_id ||
      undefined;

    // Split fullName into first and last name if provided
    let firstName = userData.firstName;
    let lastName = userData.lastName;
    if (
      !firstName &&
      userData.fullName &&
      typeof userData.fullName === "string"
    ) {
      const parts = userData.fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    }

    const emHash = hashSha256(userData.email);
    const phHash = hashSha256(normalizePhone(userData.phone));
    const fnHash = firstName
      ? hashSha256(String(firstName).replace(/[^a-zA-Z]/g, ""))
      : undefined;
    const lnHash = lastName
      ? hashSha256(String(lastName).replace(/[^a-zA-Z]/g, ""))
      : undefined;
    const ctHash = userData.city
      ? hashSha256(String(userData.city).replace(/[^a-zA-Z]/g, ""))
      : undefined;
    const stHash = userData.state
      ? hashSha256(String(userData.state).replace(/[^a-zA-Z]/g, ""))
      : undefined;
    const zpHash = userData.pincode
      ? hashSha256(String(userData.pincode).replace(/\s+/g, ""))
      : undefined;
    const countryHash = hashSha256(userData.country || "in");
    const externalIdHash = externalIdRaw
      ? hashSha256(String(externalIdRaw))
      : undefined;

    const formattedUserData = {
      ...(clientIp && { client_ip_address: clientIp }),
      ...(clientUserAgent && { client_user_agent: clientUserAgent }),
      ...(fbp && { fbp }),
      ...(fbc && { fbc }),
      ...(emHash && { em: [emHash] }),
      ...(phHash && { ph: [phHash] }),
      ...(fnHash && { fn: [fnHash] }),
      ...(lnHash && { ln: [lnHash] }),
      ...(ctHash && { ct: [ctHash] }),
      ...(stHash && { st: [stHash] }),
      ...(zpHash && { zp: [zpHash] }),
      ...(countryHash && { country: [countryHash] }),
      ...(externalIdHash && { external_id: [externalIdHash] }),
    };

    const sanitizedCustomData = sanitizeCustomData(eventName, customData);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          ...(eventId && { event_id: String(eventId) }),
          ...(eventSourceUrl && { event_source_url: eventSourceUrl }),
          user_data: formattedUserData,
          ...(Object.keys(sanitizedCustomData).length > 0 && {
            custom_data: sanitizedCustomData,
          }),
        },
      ],
      ...(testEventCode && { test_event_code: testEventCode }),
    };

    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken
    )}`;

    await axios.post(url, payload, { timeout: 8000 });
    return { sent: true };
  } catch (error) {
    console.warn(
      "[Meta CAPI] Event delivery warning:",
      error.response?.data?.error?.message || error.message
    );
    return { sent: false, error: error.message };
  }
};