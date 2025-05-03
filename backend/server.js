// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import chatbotRoute from "./routes/chatbot.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();
const app = express();

// IMPORTANT: On Render, PORT is provided via env var. No hard–coded fallback.
const PORT = process.env.PORT;

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://your-frontend-domain.com",
    credentials: true,
  })
);

// Optional health check for Render’s port scan
app.get("/__health", (_req, res) => res.send("OK"));

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatbot", chatbotRoute);

// ─── START SERVER ────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    if (!PORT) {
      console.error("❌ No PORT environment variable defined, exiting.");
      process.exit(1);
    }
    // Bind to 0.0.0.0 so Render’s health check on the assigned port can connect
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  });
