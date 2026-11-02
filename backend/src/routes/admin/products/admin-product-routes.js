import express from "express";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js";
import isAddProductFormValid from "../../../middlewares/admin/products/add-product-form-validation.js";
import {
  getAllAdminProducts,
  getOneAdminProduct,
  inventoryExporter,
  productAdder,
  productDeleter,
  productUpdater,
  reorderAdminProducts,
} from "../../../controllers/admin/products/adminProductController.js";
import isUpdateProductFormValid from "../../../middlewares/admin/products/update-product-validator.js";
import validateProductId from "../../../middlewares/admin/products/validate-product-id.js";

const router = express.Router();

router.get("/", isValidUser, isAdmin, getAllAdminProducts);
router.get("/export", isValidUser, isAdmin, inventoryExporter);
router.put("/reorder", isValidUser, isAdmin, reorderAdminProducts);
router.get("/:productId", isValidUser, isAdmin, getOneAdminProduct);
router.post("/add", isValidUser, isAdmin, isAddProductFormValid, productAdder);
router.put(
  "/update/:productId",
  isValidUser,
  isAdmin,
  validateProductId,
  isUpdateProductFormValid,
  productUpdater
);
router.delete("/:id", isValidUser, isAdmin, productDeleter);

export default router;
