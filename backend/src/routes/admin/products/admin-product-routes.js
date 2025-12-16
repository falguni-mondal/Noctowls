import express from "express";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js";
import isAddProductFormValid from "../../../middlewares/admin/products/add-product-form-validation.js";
import { uploadProductImages } from "../../../configs/multer.js";
import { getAllAdminProducts, getOneAdminProduct, productAdder, productDeleter } from "../../../controllers/admin/products/adminProductController.js";

const router = express.Router();

router.get("/", isValidUser, isAdmin, getAllAdminProducts);
router.get("/:productId", isValidUser, isAdmin, getOneAdminProduct);
router.post("/add", isValidUser, isAdmin, uploadProductImages, isAddProductFormValid,  productAdder);
router.delete("/:id", isValidUser, isAdmin,  productDeleter);


export default router;