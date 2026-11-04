import mongoose from "mongoose";
import User from "../../../models/user-model.js";
import Address from "../../../models/address-model.js";
import Order from "../../../models/order-model.js";
import { sendMetaCapiEvent } from "../../../utils/metaCapi.js";

/**
 * POST /api/meta/event
 * Receives browser tracking events via first-party backend API (immune to ad blockers),
 * enriches with logged-in user attributes, saved address, or order details if available,
 * and forwards to Meta CAPI.
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

      // Clean empty strings from client-supplied userData so they never overwrite DB records
      const cleanClientUserData = {};
      if (userData && typeof userData === "object") {
        for (const [k, v] of Object.entries(userData)) {
          if (v !== undefined && v !== null && String(v).trim() !== "") {
            cleanClientUserData[k] = v;
          }
        }
      }

      let dbUserData = {};

      // 1. Enrich from logged-in User + their default/latest Address
      if (req.user && mongoose.Types.ObjectId.isValid(req.user)) {
        try {
          const [userDoc, addressDoc] = await Promise.all([
            User.findById(req.user).select("name email phone").lean(),
            Address.findOne({ user: req.user })
              .sort({ isDefault: -1, updatedAt: -1 })
              .select("fullName phone city state pincode")
              .lean(),
          ]);

          if (addressDoc) {
            dbUserData = {
              ...(addressDoc.fullName && { fullName: addressDoc.fullName }),
              ...(addressDoc.phone && { phone: addressDoc.phone }),
              ...(addressDoc.city && { city: addressDoc.city }),
              ...(addressDoc.state && { state: addressDoc.state }),
              ...(addressDoc.pincode && { pincode: addressDoc.pincode }),
            };
          }

          if (userDoc) {
            dbUserData = {
              ...dbUserData,
              ...(userDoc.name && { fullName: userDoc.name }),
              ...(userDoc.email && { email: userDoc.email }),
              ...(userDoc.phone && { phone: userDoc.phone }),
            };
          }
        } catch {
          // Ignore DB lookup errors during background tracking
        }
      }

      // 2. If event includes an order_id (e.g., Purchase on Checkoutpage), enrich from Order
      if (
        customData?.order_id &&
        mongoose.Types.ObjectId.isValid(customData.order_id)
      ) {
        try {
          const orderDoc = await Order.findById(customData.order_id)
            .select("user guestInfo shippingAddress deviceId")
            .lean();

          if (orderDoc) {
            let orderUserEmail = orderDoc.guestInfo?.email;
            if (!orderUserEmail && orderDoc.user) {
              const orderUser = await User.findById(orderDoc.user)
                .select("email name phone")
                .lean();
              if (orderUser?.email) orderUserEmail = orderUser.email;
            }

            dbUserData = {
              ...dbUserData,
              ...(orderUserEmail && { email: orderUserEmail }),
              ...(orderDoc.shippingAddress?.phone && {
                phone: orderDoc.shippingAddress.phone,
              }),
              ...(orderDoc.shippingAddress?.fullName && {
                fullName: orderDoc.shippingAddress.fullName,
              }),
              ...(orderDoc.shippingAddress?.city && {
                city: orderDoc.shippingAddress.city,
              }),
              ...(orderDoc.shippingAddress?.state && {
                state: orderDoc.shippingAddress.state,
              }),
              ...(orderDoc.shippingAddress?.pincode && {
                pincode: orderDoc.shippingAddress.pincode,
              }),
              externalId: orderDoc.user
                ? String(orderDoc.user)
                : orderDoc.deviceId,
            };
          }
        } catch {
          // Ignore Order lookup errors
        }
      }

      const enrichedUserData = {
        ...dbUserData,
        ...cleanClientUserData,
        ...(fbp && { fbp }),
        ...(fbc && { fbc }),
      };

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