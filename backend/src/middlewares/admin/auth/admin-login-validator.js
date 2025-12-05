import adminModel from "../../../models/admin-model.js";
import bcrypt from "bcrypt";

const isLoginValid = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Check if admin exists
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Invalid Credentials!" });
    }

    // Compare password
    const passwordMatched = await bcrypt.compare(password, admin.password);
    if (!passwordMatched) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Attach admin to req.user for the controller
    req.admin = admin;

    next();
  } catch (error) {
    console.log("Admin login validation error:", error.message);
    res.status(500).json({ message: "Admin validation failed!" });
  }
};

export default isLoginValid;
