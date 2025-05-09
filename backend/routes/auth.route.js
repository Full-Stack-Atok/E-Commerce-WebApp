import express from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  getProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// This GET returns the user JSON, using protectRoute
router.get("/profile", protectRoute, getProfile);

export default router;
