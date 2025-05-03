// backend/routes/cart.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getCartProducts,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// These routes all require a logged-in user
router.use(protectRoute);

// fetch all items
router.get("/", getCartProducts);

// add a product
router.post("/", addToCart);

// remove a single product
router.delete("/", removeFromCart);

// update quantity for one product
router.put("/:id", updateQuantity);

// NEW: clear the entire cart
router.delete("/clear", clearCart);

export default router;
