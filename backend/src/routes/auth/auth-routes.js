import express from "express";

const router = express.Router();


router.post("/register", isValidRegisterCreds, registerUser);

export default router;