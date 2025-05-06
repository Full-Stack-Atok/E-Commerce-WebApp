import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  checkoutSuccess,
  handleGCashCallback,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Card, COD & GCash all go through one endpoint:
router.post("/create-checkout-session", protectRoute, createCheckoutSession);

// Stripe success callback (or frontend will POST here)
router.post("/checkout-success", protectRoute, checkoutSuccess);

// Xendit webhook (no auth)
router.post("/gcash/callback", express.json(), handleGCashCallback);

export default router;
