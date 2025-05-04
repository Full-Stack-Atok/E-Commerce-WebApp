// backend/src/routes/cart.route.js
import express from "express";
import {
  getCartProducts,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All cart routes require the user to be logged in
router.use(protectRoute);

router.get("/", getCartProducts);
router.post("/", addToCart);
router.put("/:id", updateQuantity);
router.delete("/", removeFromCart);
router.delete("/clear", clearCart);

export default router;
