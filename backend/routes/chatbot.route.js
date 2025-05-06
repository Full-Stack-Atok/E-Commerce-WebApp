import express from "express";
import { chatBot } from "../controllers/chatbot.controller.js";

const router = express.Router();

// mount at POST /api/chatbot
router.post("/", chatBot);

export default router;
