import express from "express";
import parser from "cookie-parser";
import "dotenv/config";
import cors from "cors";
import connectToDB from "./database/db.js";


const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(parser());

// Connecting DB....................................................
connectToDB();


// CORS Initialization..............................................
app.use(cors({
    origin: process.env.NODE_ENV === "development" ? true : ["https://myfrontendLink.com"],
    credentials: true
}))


// ROUTE INITIALIZATIONS.............................................
// app.use("/api/auth", authRouter);


export default app;