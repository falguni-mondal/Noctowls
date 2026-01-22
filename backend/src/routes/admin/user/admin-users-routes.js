import express from "express";
import { 
    getAllUsers, 
    getUserDetails,
    deleteUser 
} from "../../../controllers/admin/user/admin-users-controllers.js";

// Middleware
import isValidUser from "../../../middlewares/global/auth/user-validator.js";
import isAdmin from "../../../middlewares/admin/admin-verifier.js"; 

const router = express.Router();

// ================= ADMIN USER ROUTES =================

// Get all users with filters (pagination, search, date)
router.get("/", isValidUser, isAdmin, getAllUsers);

// Get detailed view of a specific user
router.get("/:userId", isValidUser, isAdmin, getUserDetails);

// Delete a user
router.delete("/:userId", isValidUser, isAdmin, deleteUser);

export default router;