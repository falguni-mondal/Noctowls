import express from "express";
import { 
    getAllProducts, 
    getOneProduct, 
    validateStock,
    getBestSellingProducts // Import the new controller
} from "../../../controllers/user/product/product-controllers.js";

const router = express.Router();

// Specific routes must come BEFORE parameterized routes (/:id)
router.get("/best-selling", getBestSellingProducts);

router.get("/", getAllProducts);
router.get("/:productId", getOneProduct);
router.post("/:productId/validate-stock", validateStock);

export default router;