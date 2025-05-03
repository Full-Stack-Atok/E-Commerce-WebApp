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
const PORT = process.env.PORT;

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g. https://rocket-bay.onrender.com
    credentials: true, // allow cookies
  })
);

// Health check
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
      console.error("❌ No PORT defined, exiting.");
      process.exit(1);
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
