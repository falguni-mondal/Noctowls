import crypto from "crypto";
import axios from "axios";

const META_GRAPH_VERSION = "v21.0";

/**
 * Normalizes and SHA-256 hashes user PII per Meta Conversions API specifications.
 */
const hashSha256 = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

const normalizePhone = (phone, defaultCountryCode = "91") => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
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
      return { sent: false, reason: "Missing META_PIXEL_ID or META_ACCESS_TOKEN" };
    }

    const clientIp =
      userData.ipAddress ||
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.ip ||
      undefined;

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
    if (!firstName && userData.fullName && typeof userData.fullName === "string") {
      const parts = userData.fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    }

    const formattedUserData = {
      ...(clientIp && { client_ip_address: clientIp }),
      ...(clientUserAgent && { client_user_agent: clientUserAgent }),
      ...(fbp && { fbp }),
      ...(fbc && { fbc }),
      ...(userData.email && { em: [hashSha256(userData.email)] }),
      ...(userData.phone && {
        ph: [hashSha256(normalizePhone(userData.phone))],
      }),
      ...(firstName && { fn: [hashSha256(firstName)] }),
      ...(lastName && { ln: [hashSha256(lastName)] }),
      ...(userData.city && {
        ct: [hashSha256(userData.city.replace(/[^a-zA-Z]/g, ""))],
      }),
      ...(userData.state && {
        st: [hashSha256(userData.state.replace(/[^a-zA-Z]/g, ""))],
      }),
      ...(userData.pincode && { zp: [hashSha256(String(userData.pincode))] }),
      country: [hashSha256(userData.country || "in")],
      ...(externalIdRaw && { external_id: [hashSha256(String(externalIdRaw))] }),
    };

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          ...(eventId && { event_id: String(eventId) }),
          ...(eventSourceUrl && { event_source_url: eventSourceUrl }),
          user_data: formattedUserData,
          ...(customData &&
            Object.keys(customData).length > 0 && {
              custom_data: customData,
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
