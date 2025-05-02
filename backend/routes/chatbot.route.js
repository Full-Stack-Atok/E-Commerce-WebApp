// backend/routes/chatbot.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { chatBot } from "../controllers/chatbot.controller.js";

const router = express.Router();

// require login
router.use(protectRoute);

// POST /api/chatbot
router.post("/", chatBot);

export default router;
