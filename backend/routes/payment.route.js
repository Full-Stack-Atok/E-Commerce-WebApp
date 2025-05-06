// backend/routes/payment.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  checkoutSuccess,
  createPayPalOrder,
  capturePayPalOrder,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Stripe Card + COD
router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);

// PayPal native
router.post("/create-paypal-order", protectRoute, createPayPalOrder);
router.post("/capture-paypal-order", protectRoute, capturePayPalOrder);

export default router;
