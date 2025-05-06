// backend/server.js  (or wherever you bootstrap Express)
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import chatbotRoute from "./routes/chatbot.route.js";
import { connectDB } from "./lib/db.js";
import Order from "./models/order.model.js"; // <<— for syncIndexes

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "https://rocket-bay.onrender.com",
    credentials: true,
  })
);
app.options(
  "*",
  cors({
    origin: "https://rocket-bay.onrender.com",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/__health", (_req, res) => res.send("OK"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatbot", chatbotRoute);

// Start server
connectDB()
  .then(async () => {
    // THIS is the magic that syncs your indexes to match your schema.
    try {
      await Order.syncIndexes();
      console.log("✅ Order indexes synced to schema (sparse stripeSessionId)");
    } catch (err) {
      console.error("❌ Failed to sync Order indexes:", err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
