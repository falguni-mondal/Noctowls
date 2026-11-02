import cron from "node-cron";
import Order from "../models/order-model.js";
import Product from "../models/product-model.js";
import Coupon from "../models/coupon-model.js";

/**
 * Automatically marks orders in "shipped" or "out-for-delivery" status as "delivered"
 * once at least `daysThreshold` days (default: 7) have elapsed since shipping time.
 * Also completes pending COD payments upon delivery.
 * Can be invoked both by the background node-cron job and the standalone npm script.
 */
export const autoDeliverShippedOrders = async (daysThreshold = 7) => {
  const cutoffDate = new Date(
    Date.now() - Number(daysThreshold) * 24 * 60 * 60 * 1000
  );

  // Match orders that are currently shipped (or out-for-delivery) for >= 7 days
  // Uses statusTimestamps.shipped when available, falling back to updatedAt/createdAt for legacy orders
  const eligibleOrders = await Order.find({
    orderStatus: { $in: ["shipped", "out-for-delivery"] },
    "returnInfo.isReturnActive": { $ne: true },
    $or: [
      { "statusTimestamps.shipped": { $ne: null, $lte: cutoffDate } },
      {
        $and: [
          {
            $or: [
              { "statusTimestamps.shipped": null },
              { "statusTimestamps.shipped": { $exists: false } },
            ],
          },
          { updatedAt: { $lte: cutoffDate } },
        ],
      },
    ],
  });

  if (!eligibleOrders || eligibleOrders.length === 0) {
    return {
      totalFound: 0,
      updatedCount: 0,
      updatedOrders: [],
    };
  }

  console.log(
    `[AUTO-DELIVER] Found ${eligibleOrders.length} shipped order(s) older than ${daysThreshold} days. Marking as delivered...`
  );

  const updatedOrders = [];
  const now = new Date();

  for (const order of eligibleOrders) {
    try {
      // Legacy data sanitizer to prevent Mongoose validation errors on negative pricing
      if (order.pricing) {
        if (order.pricing.subtotalAfterCoupon < 0) {
          order.pricing.subtotalAfterCoupon = 0;
        }
        if (order.pricing.finalTotal < 0) {
          order.pricing.finalTotal = 0;
        }
      }

      order.orderStatus = "delivered";

      if (!order.statusTimestamps) {
        order.statusTimestamps = {};
      }
      if (!order.statusTimestamps.delivered) {
        order.statusTimestamps.delivered = now;
      }

      if (!order.tracking) {
        order.tracking = {};
      }
      if (!order.tracking.actualDelivery) {
        order.tracking.actualDelivery = now;
      }

      // Auto-complete COD payment on delivery
      if (
        order.payment &&
        order.payment.method === "COD" &&
        order.payment.status === "pending"
      ) {
        order.payment.status = "completed";
        order.payment.paidAt = now;
      }

      await order.save();
      updatedOrders.push(order.orderNumber);
      console.log(
        `[AUTO-DELIVER] Order ${order.orderNumber} marked as delivered.`
      );
    } catch (orderErr) {
      console.error(
        `[AUTO-DELIVER] Failed to update Order ${order.orderNumber}:`,
        orderErr.message
      );
    }
  }

  return {
    totalFound: eligibleOrders.length,
    updatedCount: updatedOrders.length,
    updatedOrders,
  };
};

const startCronJobs = () => {
  // 1. Every 5 minutes: Cancel & restock abandoned pending orders older than 10 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const fifteenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

      const abandonedOrders = await Order.find({
        orderStatus: "pending",
        "payment.status": "pending",
        createdAt: { $lte: fifteenMinsAgo },
      });

      if (abandonedOrders.length === 0) return;

      console.log(
        `[CRON] Found ${abandonedOrders.length} abandoned orders. Restocking...`
      );

      for (const order of abandonedOrders) {
        try {
          if (order.pricing) {
            if (order.pricing.subtotalAfterCoupon < 0) {
              order.pricing.subtotalAfterCoupon = 0;
            }
            if (order.pricing.finalTotal < 0) {
              order.pricing.finalTotal = 0;
            }
          }

          const { order: cancelledOrder, couponToRevert } =
            await order.cancelOrder(
              "system",
              "Payment timeout - Auto cancelled after 15 minutes"
            );

          for (const item of cancelledOrder.items) {
            await Product.findOneAndUpdate(
              {
                _id: item.product,
                sizes: { $elemMatch: { value: item.size.value } },
              },
              {
                $inc: {
                  "sizes.$.stock": item.quantity,
                  totalStock: item.quantity,
                },
              }
            );
          }

          if (couponToRevert) {
            const coupon = await Coupon.findOne({ code: couponToRevert.code });
            if (coupon) {
              await coupon.decrementUsageForUser(
                couponToRevert.userId,
                couponToRevert.deviceId
              );
            }
          }

          console.log(
            `[CRON] Successfully cancelled & restocked Order: ${order.orderNumber}`
          );
        } catch (itemError) {
          console.error(
            `[CRON] Failed to process abandoned order ${order.orderNumber}:`,
            itemError
          );
        }
      }
    } catch (error) {
      console.error("[CRON] Global error in abandoned cart cleanup:", error);
    }
  });

  // 2. Every hour (at minute 0): Mark shipped orders >= 7 days old as delivered
  cron.schedule("0 * * * *", async () => {
    try {
      await autoDeliverShippedOrders(7);
    } catch (error) {
      console.error(
        "[CRON] Global error in 7-day shipped-to-delivered job:",
        error
      );
    }
  });

  console.log(
    "⏰ Background Cron Jobs Initialized (Abandoned Orders + 7-Day Auto-Deliver)"
  );
};

export default startCronJobs;
