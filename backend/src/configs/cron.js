import cron from 'node-cron';
import Order from '../models/order-model.js'; // Adjust path if needed
import Product from '../models/product-model.js'; // Adjust path if needed
import Coupon from '../models/coupon-model.js'; // Adjust path if needed

const startCronJobs = () => {
    // '*/5 * * * *' means it runs exactly every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            // 1. Calculate the time 15 minutes ago
            const fifteenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

            // 2. Find all orders stuck in "pending" that are older than 15 mins
            const abandonedOrders = await Order.find({
                orderStatus: "pending",
                "payment.status": "pending",
                createdAt: { $lte: fifteenMinsAgo }
            });

            if (abandonedOrders.length === 0) return; // Nothing to clean up

            console.log(`[CRON] Found ${abandonedOrders.length} abandoned orders. Restocking...`);

            // 3. Process each abandoned order safely
            for (const order of abandonedOrders) {
                try {
                    // Trigger the model's built-in cancel method
                    const { order: cancelledOrder, couponToRevert } = await order.cancelOrder(
                        "system", 
                        "Payment timeout - Auto cancelled after 15 minutes"
                    );

                    // Restock the items
                    // Note: We only add back 'stock' and 'totalStock'. 
                    // We DO NOT touch 'salesCount' because pending orders never incremented it!
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

                    // Revert the coupon usage so the user can try again later
                    if (couponToRevert) {
                        const coupon = await Coupon.findOne({ code: couponToRevert.code });
                        if (coupon) {
                            await coupon.decrementUsageForUser(couponToRevert.userId, couponToRevert.deviceId);
                        }
                    }

                    console.log(`[CRON] Successfully cancelled & restocked Order: ${order.orderNumber}`);
                } catch (itemError) {
                    console.error(`[CRON] Failed to process abandoned order ${order.orderNumber}:`, itemError);
                }
            }
        } catch (error) {
            console.error("[CRON] Global error in abandoned cart cleanup:", error);
        }
    });
    
    console.log("⏰ Background Cron Jobs Initialized");
};

export default startCronJobs;