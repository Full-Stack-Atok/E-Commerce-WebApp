// backend/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Protect any route by requiring a valid accessToken cookie
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid access token" });
    }

    // Load the user from DB (minus password)
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("protectRoute error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Only allow admin users through
export const adminRoute = (req, res, next) => {
  // protectRoute must have run first, so req.user is populated
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied - Admin only" });
};
