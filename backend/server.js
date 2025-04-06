import express from "express";
import dotenv from "dotenv";


// routes
import authRoutes from "./routes/auth.route.js";

dotenv.config();
import {connectDB} from "./lib/db.js"

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB()
});
