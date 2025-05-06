// backend/routes/payment.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  checkoutSuccess,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Card, PayPal & Cash-on-Delivery all go through one endpoint:
router.post("/create-checkout-session", protectRoute, createCheckoutSession);

// Stripe success callback (or frontend will POST here)
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
