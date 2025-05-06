// backend/routes/chatbot.route.js
import express from "express";
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_FILE = path.resolve(__dirname, "../model.nlp");

// load your trained model once
const manager = new NlpManager();
manager.load(MODEL_FILE);

// single POST at "/"
router.post("/", async (req, res) => {
  const text = (req.body.message || "").trim();
  if (!text) {
    return res.json({ reply: "Please say something and I'll try to help!" });
  }

  // classify with node-nlp
  const { intent, entities, answer, score } = await manager.process("en", text);

  // 1) Product availability
  if (intent === "product.availability") {
    const prodEnt = entities.find((e) => e.entity === "product");
    const requested = prodEnt?.resolution?.value || prodEnt?.sourceText;
    if (!requested) {
      return res.json({ reply: "Which product are you looking for?" });
    }
    const found = await Product.findOne({
      name: new RegExp(requested, "i"),
      available: true,
    }).lean();
    if (found) {
      return res.json({
        reply: `Yes—“${
          found.name
        }” is in stock at ₱${found.price.toLocaleString()}.`,
      });
    }
    return res.json({
      reply: `Sorry, we don’t have “${requested}” available right now.`,
    });
  }

  // 2) Price query
  if (intent === "price.query") {
    const name = text
      .replace(/^how much is\s+/i, "")
      .replace(/^price of\s+/i, "")
      .trim();
    const product = await Product.findOne({
      name: new RegExp(name, "i"),
    }).lean();
    return res.json({
      reply: product
        ? `The price of ${product.name} is ₱${product.price.toLocaleString()}.`
        : `I couldn't find a product named "${name}".`,
    });
  }

  // 3) Coupon info
  if (intent === "coupon.info") {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    return res.json({
      reply: coupon
        ? `You have an active coupon ${coupon.code} for ${coupon.discountPercentage}% off.`
        : "You don't have any active coupons right now.",
    });
  }

  // 4) List top products
  if (intent === "products.list" && score > 0.6) {
    const prods = await Product.find({}).limit(5).lean();
    return res.json({
      reply: "Here are some products you might like:",
      products: prods.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
      })),
    });
  }

  // 5) Products by category
  if (intent === "products.byCategory" && score > 0.6) {
    const catEnt = entities.find((e) => e.entity === "category");
    const cat = catEnt?.resolution?.value || catEnt?.sourceText;
    if (!cat) {
      return res.json({ reply: "Which category are you interested in?" });
    }
    const items = await Product.find({
      category: new RegExp(`^${cat}$`, "i"),
      available: true,
    })
      .limit(5)
      .lean();
    if (items.length === 0) {
      return res.json({ reply: `No ${cat} available right now.` });
    }
    return res.json({
      reply: `Here are our ${cat}:`,
      products: items.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
      })),
    });
  }

  // 6) Fallback to any static answer
  const reply = answer || "Sorry, I didn’t catch that—can you rephrase?";
  res.json({ reply });
});

export default router;
