// backend/routes/payment.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  checkoutSuccess,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Card, PayPal (via Stripe) & Cash-on-Delivery all hit the same endpoint:
router.post("/create-checkout-session", protectRoute, createCheckoutSession);

// Stripe success callback
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
