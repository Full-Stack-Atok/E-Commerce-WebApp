import express from "express";
import {
  getCartProducts,
  addToCart,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

console.log("🛒 [cart.route.js] loading…");

const router = express.Router();

// all cart endpoints require an authenticated user
router.use(protectRoute);

router.get("/", getCartProducts);
router.post("/", addToCart);
router.delete("/", removeAllFromCart);
router.put("/:id", updateQuantity);

export default router;
