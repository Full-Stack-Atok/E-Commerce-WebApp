import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

// ── fix __dirname in ES modules ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── 1) Global middleware ────────────────────────────────────────────────────
// parse JSON bodies, cookies, enable CORS
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ── 2) API routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatbot", chatbotRoute);

// ── 3) Static & SPA fallback (production only) ───────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../frontend/dist");
  // serve static files
  app.use(express.static(clientDist));
  // for any GET that's not /api/*, return index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ── 4) Launch ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  connectDB();
});
