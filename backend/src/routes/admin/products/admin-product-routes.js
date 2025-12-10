import express from "express";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js";
import isAddProductFormValid from "../../../middlewares/admin/products/add-product-form-validation.js";
import { uploadProductImages } from "../../../configs/multer.js";

const router = express.Router();


router.post("/add", isValidUser, isAdmin, uploadProductImages, isAddProductFormValid,  );


export default router;