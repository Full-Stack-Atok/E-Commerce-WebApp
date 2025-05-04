import express from "express";
import {
  getCartProducts,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All cart routes require an authenticated user
router.use(protectRoute);

// Fetch the current cart
router.get("/", getCartProducts);

// Add one item to the cart
router.post("/", addToCart);

// Remove one item
router.delete("/", removeFromCart);

// Update quantity
router.put("/:id", updateQuantity);

// Clear everything
router.delete("/clear", clearCart);

export default router;
