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

// All cart routes require authentication
router.use(protectRoute);

router.get("/", getCartProducts);
router.post("/", addToCart);
router.delete("/", removeFromCart);
router.put("/:id", updateQuantity);

// New endpoint to clear the entire cart
router.delete("/clear", clearCart);

export default router;
