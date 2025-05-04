// backend/src/app.js
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
const PORT = process.env.PORT || 5000;

// ─── CORS ────────────────────────────────────────────────────────────────────
// Only allow your Vite dev server
app.use(
  cors({
    origin: process.env.CLIENT_URL, // http://localhost:5173
    credentials: true, // allow Set-Cookie
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Optional: explicitly handle preflight
app.options(
  "*",
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

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
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
