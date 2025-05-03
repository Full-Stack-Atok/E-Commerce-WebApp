import express from "express";
import {
  getCartProducts,
  addToCart,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

console.log("🛒 [cart.route.js] loaded");

const router = express.Router();

// All cart endpoints require an authenticated user
router.use(protectRoute);

router.get("/", getCartProducts);
router.post("/", addToCart);
router.delete("/", removeAllFromCart);
router.put("/:id", updateQuantity);

export default router;
