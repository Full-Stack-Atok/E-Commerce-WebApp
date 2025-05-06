// backend/routes/chatbot.route.js
import express from "express";
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.model.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_FILE = path.resolve(__dirname, "../model.nlp");

const manager = new NlpManager();
manager.load(MODEL_FILE);

router.post("/chat", async (req, res) => {
  const { text } = req.body;
  const result = await manager.process("en", text);

  // 1) Product Availability (if you have that)
  if (result.intent === "product.availability") {
    // …your existing availability code…
  }

  // 2) By Category
  if (result.intent === "products.byCategory") {
    // find the extracted category entity
    const catEntity = result.entities.find((e) => e.entity === "category");
    const requested = catEntity?.resolution?.value || catEntity?.sourceText;
    if (!requested) {
      return res.json({ reply: "Which category are you interested in?" });
    }

    // query your DB for that category
    // assume each Product doc has a `category` field matching one of your list
    const items = await Product.find({
      category: new RegExp(`^${requested}$`, "i"),
      available: true,
    }).limit(10);

    if (items.length === 0) {
      return res.json({
        reply: `Sorry, we don’t have any ${requested} in stock right now.`,
      });
    }

    // build a friendly list
    const names = items.map((p) => p.name).join(", ");
    return res.json({
      reply: `Here are our available ${requested}: ${names}.`,
    });
  }

  // 3) Everything else: static or fallback
  const answer = result.answer || "Sorry, I didn’t catch that.";
  res.json({ reply: answer });
});

export default router;
