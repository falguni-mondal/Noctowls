import express from "express";
import { getAllProducts, getOneProduct, validateStock } from "../../../controllers/user/product/product-controllers.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:productId", getOneProduct);
router.post("/:productId/validate-stock", validateStock);

export default router