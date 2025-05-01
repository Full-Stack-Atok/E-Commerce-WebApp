import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import routes
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import chatbotRoute from "./routes/chatbot.route.js";

// Environment variables
dotenv.config();

// Connect to database
import { connectDB } from "./lib/db.js";

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ✅ Allow CORS for frontend (Vite or React)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"], // Allow your frontend ports
    credentials: true, // Important: allow cookies
  })
);

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatbot", chatbotRoute);

// ✅ Start server
app.listen(PORT, () => {
  console.log("🚀 Server is running on http://localhost:" + PORT);
  connectDB();
});
