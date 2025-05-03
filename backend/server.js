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

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
// Parse JSON bodies + cookies
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Enable CORS for your front-end origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatbot", chatbotRoute);

// ─── SERVE REACT APP ─────────────────────────────────────────────────────────
// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point to your built frontend
const clientBuildPath = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(clientBuildPath));

// Always return index.html for any unrecognized route (so React Router works)
app.get("/*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ─── START SERVER ────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  });
