import express from "express";
import { getAllProducts, getOneProduct } from "../../controllers/global/product-controllers.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:productId", getOneProduct);

export default router