import express from "express";
import parser from "cookie-parser";
import "dotenv/config";
import cors from "cors";
import connectToDB from "./database/db.js";

// ROUTES Imports................................
import authRouter from "./routes/user/auth/auth-routes.js";
import adminAuthRouter from "./routes/admin/auth/admin-auth-routes.js"
import adminProductsRouter from "./routes/admin/products/admin-product-routes.js"


const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(parser());

// Connecting DB....................................................
connectToDB();


// CORS Initialization..............................................
app.use(cors({
    origin: true,
    credentials: true
}))


// ROUTE INITIALIZATIONS.............................................
app.use("/api/auth", authRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);


export default app;