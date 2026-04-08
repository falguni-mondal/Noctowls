import express from "express";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js";
import isAddProductFormValid from "../../../middlewares/admin/products/add-product-form-validation.js";
import { handleMulterError, uploadProductImages } from "../../../configs/multer.js";
import { getAllAdminProducts, getOneAdminProduct, inventoryExporter, productAdder, productDeleter, productUpdater } from "../../../controllers/admin/products/adminProductController.js";
import isUpdateProductFormValid from "../../../middlewares/admin/products/update-product-validator.js";
import validateProductId from "../../../middlewares/admin/products/validate-product-id.js";

const router = express.Router();

router.get("/", isValidUser, isAdmin, getAllAdminProducts);
router.get("/export", isValidUser, isAdmin, inventoryExporter);
router.get("/:productId", isValidUser, isAdmin, getOneAdminProduct);
router.post("/add", isValidUser, isAdmin, uploadProductImages, isAddProductFormValid,  productAdder);
router.put("/update/:productId", isValidUser, isAdmin, validateProductId, uploadProductImages, handleMulterError, isUpdateProductFormValid,  productUpdater);
router.delete("/:id", isValidUser, isAdmin,  productDeleter);


export default router;