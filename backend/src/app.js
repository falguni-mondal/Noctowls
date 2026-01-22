import express from "express";
import parser from "cookie-parser";
import "dotenv/config";
import cors from "cors";
import connectToDB from "./database/db.js";

import noCache from "./middlewares/global/no-cache.js";

// ROUTES Imports................................
import authRouter from "./routes/user/auth/auth-routes.js";
import productsRouter from "./routes/user/product/product-routes.js";
import cartRouter from "./routes/user/cart/cart-routes.js";
import wishlistRouter from "./routes/user/wishlist/wishlist-routes.js";
import addressRouter from "./routes/user/order/address-routes.js";
import orderRouter from "./routes/user/order/order-routes.js";
import gokwikRouter from "./routes/user/payment/gokwik-routes.js";
import reviewRouter from "./routes/user/review/review-routes.js";

import adminAuthRouter from "./routes/admin/auth/admin-auth-routes.js";
import adminProductsRouter from "./routes/admin/products/admin-product-routes.js";
import adminCouponRouter from "./routes/admin/products/admin-coupon-routes.js";
import adminOrderRouter from "./routes/admin/orders/admin-order-routes.js";
import adminReviewRouter from "./routes/admin/review/admin-review-routes.js";
import adminUserRouter from "./routes/admin/user/admin-users-routes.js";

const app = express();
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
    origin: true,
    credentials: true,
  })
);

// NO CACHE MIDDLEWARE (For not storing anything in the cache)
app.use(noCache);

// ROUTE INITIALIZATIONS.............................................
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/gokwik", gokwikRouter);
app.use("/api/reviews", reviewRouter);

app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/coupons", adminCouponRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/reviews", adminReviewRouter);
app.use("/api/admin/users", adminUserRouter);

export default app;