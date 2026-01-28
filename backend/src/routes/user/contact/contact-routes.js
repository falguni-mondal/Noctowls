import express from "express";
import { submitContactForm } from "../../../controllers/user/contact/contact-controllers.js";

const router = express.Router();

router.post("/submit", submitContactForm);

export default router;