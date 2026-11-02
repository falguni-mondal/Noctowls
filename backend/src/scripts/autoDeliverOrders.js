import "dotenv/config";
import mongoose from "mongoose";
import connectToDB from "../database/db.js";
import { autoDeliverShippedOrders } from "../configs/cron.js";

const runAutoDeliverScript = async () => {
  const customDaysArg = process.argv[2] ? Number(process.argv[2]) : 7;
  const daysThreshold =
    !Number.isNaN(customDaysArg) && customDaysArg > 0 ? customDaysArg : 7;

  try {
    console.log(
      `🚀 Starting auto-deliver check for orders shipped at least ${daysThreshold} day(s) ago...`
    );
    await connectToDB();

    const result = await autoDeliverShippedOrders(daysThreshold);

    console.log(
      `✅ Completed! Matched: ${result.totalFound} | Marked Delivered: ${result.updatedCount}`
    );
    if (result.updatedOrders.length > 0) {
      console.log(`📦 Updated Orders: ${result.updatedOrders.join(", ")}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Auto-deliver script failed:", error.message);
    try {
      await mongoose.connection.close();
    } catch {
      // Ignore close error
    }
    process.exit(1);
  }
};

runAutoDeliverScript();