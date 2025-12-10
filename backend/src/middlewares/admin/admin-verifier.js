import adminModel from "../../models/admin-model.js";

const isAdmin = async (req, res, next) => {
  try {
    const admin = await adminModel.findById(req.user);
    if (!admin) {
      return res
        .status(401)
        .json({ message: "Please login to an admin account!" });
    }
    next();
  } catch (err) {
    console.error("Admin Verifier Error: ", err.message);
    return res
        .status(500)
        .json({ message: "Server error while verifying ads admin!" });
  }
};

export default isAdmin;
