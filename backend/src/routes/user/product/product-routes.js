import express from "express";
import { 
    getAllProducts, 
    getOneProduct, 
    validateStock,
    getBestSellingProducts,
    searchProducts,
    getProductsByGroupAndCategory
} from "../../../controllers/user/product/product-controllers.js";

const router = express.Router();

router.get("/best-selling", getBestSellingProducts);
router.get("/search", searchProducts);
router.get("/filter", getProductsByGroupAndCategory);

router.get("/", getAllProducts);
router.get("/:productId", getOneProduct);
router.post("/:productId/validate-stock", validateStock);

export default router;