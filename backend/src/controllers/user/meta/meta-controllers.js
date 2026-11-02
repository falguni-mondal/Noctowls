import User from "../../../models/user-model.js";
import { sendMetaCapiEvent } from "../../../utils/metaCapi.js";

/**
 * POST /api/meta/event
 * Receives browser tracking events via first-party backend API (immune to ad blockers),
 * enriches with logged-in user attributes if available, and forwards to Meta CAPI.
 */
export const trackMetaEvent = async (req, res) => {
  // Acknowledge immediately so client performance is never blocked
  res.status(200).json({ success: true });

  setImmediate(async () => {
    try {
      const {
        eventName,
        eventId,
        eventSourceUrl,
        customData = {},
        userData = {},
        fbp,
        fbc,
      } = req.body || {};

      if (!eventName) return;

      let enrichedUserData = {
        ...userData,
        ...(fbp && { fbp }),
        ...(fbc && { fbc }),
      };

      if (req.user) {
        try {
          const userDoc = await User.findById(req.user)
            .select("name email phone")
            .lean();
          if (userDoc) {
            enrichedUserData = {
              fullName: userDoc.name || enrichedUserData.fullName,
              email: userDoc.email || enrichedUserData.email,
              phone: userDoc.phone || enrichedUserData.phone,
              ...enrichedUserData,
            };
          }
        } catch {
          // Ignore DB lookup errors during background tracking
        }
      }

      await sendMetaCapiEvent({
        eventName,
        eventId,
        eventSourceUrl: eventSourceUrl || req.headers.referer,
        customData,
        userData: enrichedUserData,
        req,
      });
    } catch (err) {
      console.warn("[Meta CAPI Controller] Error:", err.message);
    }
  });
};