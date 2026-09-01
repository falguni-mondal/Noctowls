import express from "express";
import parser from "cookie-parser";
import "dotenv/config";
import cors from "cors";
import connectToDB from "./database/db.js";

import noCache from "./middlewares/global/no-cache.js";
import LeakyLimiter from "./utils/leaky-limiter.js";
import UserLimiter from "./utils/user-limiter.js";

// ROUTES Imports................................
import authRouter from "./routes/user/auth/auth-routes.js";
import productsRouter from "./routes/user/product/product-routes.js";
import cartRouter from "./routes/user/cart/cart-routes.js";
import wishlistRouter from "./routes/user/wishlist/wishlist-routes.js";
import addressRouter from "./routes/user/order/address-routes.js";
import orderRouter from "./routes/user/order/order-routes.js";
import gokwikRouter from "./routes/user/payment/gokwik-routes.js";
import reviewRouter from "./routes/user/review/review-routes.js";
import contactRoutes from "./routes/user/contact/contact-routes.js";

import adminAuthRouter from "./routes/admin/auth/admin-auth-routes.js";
import adminDashboardRouter from "./routes/admin/dashboard/admin-dashboard-routes.js";
import adminProductsRouter from "./routes/admin/products/admin-product-routes.js";
import adminCouponRouter from "./routes/admin/products/admin-coupon-routes.js";
import adminOrderRouter from "./routes/admin/orders/admin-order-routes.js";
import adminReviewRouter from "./routes/admin/review/admin-review-routes.js";
import adminUserRouter from "./routes/admin/user/admin-users-routes.js";
import adminBagRouter from "./routes/admin/bag/admin-bag-routes.js";
import adminWishlistRouter from "./routes/admin/wishlist/admin-wishlist-routes.js";

const app = express();

// 1. Initialize Global Leaky Limiter (50 req/sec)
const globalLimiter = new LeakyLimiter(50);

// 2. Initialize User Limiter (40 requests per 10 seconds)
const userLimiter = new UserLimiter(40, 10000); 

// Optional: Cleanup stale IPs every 60 seconds to save memory
setInterval(() => userLimiter.cleanup(), 60000);

app.set("trust proxy", true);
app.use(
  express.json({
    verify: (req, res, buf) => {
      // We store the raw buffer to check the signature later
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(parser());

// Connecting DB....................................................
connectToDB();

// CORS Initialization..............................................
app.use(
  cors({
    // origin: ["https://test.noctowls.com", "https://noctowls.com", "https://www.noctowls.com"],
    origin: true,
    credentials: true,
  })
);

// NO CACHE MIDDLEWARE (For not storing anything in the cache)
app.use(noCache);

// 3. APPLY USER LIMITER (The Guard)
// This runs FIRST. If a specific user is spamming, we reject them immediately.
app.use((req, res, next) => {
  const userIp = req.ip; // Identify by IP address
  
  if (!userLimiter.check(userIp)) {
    return res.status(429).json({
      success: false,
      message: "Too many requests! Please wait a moment."
    });
  }
  next();
});

// 4. APPLY GLOBAL LEAKY LIMITER (The Traffic Cop)
// This runs SECOND. It delays valid requests to ensure the server isn't overwhelmed by a burst.
app.use(async (req, res, next) => {
  await globalLimiter.wait();
  next();
});

// FOR TESTING //////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.status(200).json({ success: true });
})

// ROUTE INITIALIZATIONS.............................................
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/gokwik", gokwikRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/contact", contactRoutes);

app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/coupons", adminCouponRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/reviews", adminReviewRouter);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/bags", adminBagRouter);
app.use("/api/admin/wishlists", adminWishlistRouter);

export default app;