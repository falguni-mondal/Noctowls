import express from "express";
import {
  getAddresses,
  getDefaultAddress,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAddressStatistics,
} from "../../../controllers/user/order/address-controllers.js";
import {
  validateAddAddress,
  validateUpdateAddress,
  validateAddressId,
  validateGetAddresses,
} from "../../../middlewares/user/order/address-validator.js";
import isValidUser from "../../../middlewares/global/auth/user-validator.js";

const router = express.Router();

// All routes require authentication
router.use(isValidUser);

// ==================== ADDRESS ROUTES ====================

// Get all addresses (with optional filtering and search)
router.get("/", validateGetAddresses, getAddresses);

// Get address statistics
router.get("/statistics", getAddressStatistics);

// Get default address
router.get("/default", getDefaultAddress);

// Get single address by ID
router.get("/:addressId", validateAddressId, getAddressById);

// Add new address
router.post("/", validateAddAddress, addAddress);

// Update address
router.put("/:addressId", validateAddressId, validateUpdateAddress, updateAddress);

// Delete address
router.delete("/:addressId", validateAddressId, deleteAddress);

// Set default address
router.patch("/:addressId/default", validateAddressId, setDefaultAddress);

export default router;