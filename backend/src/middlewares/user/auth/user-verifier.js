import userModel from "../../../models/user-model.js";

const isVerifiedUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "User not verified!."
      });
    }
    next();
  } catch (err) {
    console.error("isVerifiedUser Error:", err);
    res.status(500).json({ message: "Server error checking user verification." });
  }
};

export default isVerifiedUser;
