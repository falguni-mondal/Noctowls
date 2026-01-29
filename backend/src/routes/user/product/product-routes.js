import express from "express";
import { 
    getAllProducts, 
    getOneProduct, 
    validateStock,
    getBestSellingProducts,
    searchProducts
} from "../../../controllers/user/product/product-controllers.js";

const router = express.Router();

router.get("/best-selling", getBestSellingProducts);
router.get("/search", searchProducts);

router.get("/", getAllProducts);
router.get("/:productId", getOneProduct);
router.post("/:productId/validate-stock", validateStock);

export default router;