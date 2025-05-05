// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const text = (req.body.message || "").trim();
    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // 1) Classify & inject user name
    const { intent, score, entities, answer } = await parseMessage(
      text,
      req.user?.name || ""
    );

    // 2) Handle static intents first
    if (intent === "greeting" && answer) {
      return res.json({ reply: answer });
    }
    if (intent === "hours" && answer) {
      return res.json({ reply: answer });
    }
    if (intent === "location" && answer) {
      return res.json({ reply: answer });
    }

    // 3) Dynamic intents
    // 3a) Price query: extract product name and look up price
    if (intent === "price.query") {
      // naive extraction: remove leading “how much is” or “price of”
      const name = text
        .replace(/^how much is\s+/i, "")
        .replace(/^price of\s+/i, "")
        .trim();
      if (!name) {
        return res.json({
          reply: "Sure—what product would you like the price for?",
        });
      }
      const product = await Product.findOne({
        name: new RegExp(`^${name}`, "i"),
      }).lean();
      if (product) {
        return res.json({
          reply: `The price of ${
            product.name
          } is ₱${product.price.toLocaleString()}.`,
        });
      } else {
        return res.json({
          reply: `Sorry, I couldn't find a product named "${name}".`,
        });
      }
    }

    // 3b) Coupon info: fetch active coupon for this user
    if (intent === "coupon.info") {
      const coupon = await Coupon.findOne({
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        return res.json({
          reply: `You have an active coupon: ${coupon.code} for ${coupon.discountPercentage}% off.`,
        });
      } else {
        return res.json({
          reply: "You don't have any active coupons right now.",
        });
      }
    }

    // 4) Product listing / filtering
    if (score > 0.6 && intent === "products.list") {
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
    if (score > 0.6 && intent === "products.filter" && entities.length) {
      const cat = entities[0].option || entities[0].sourceText;
      const matches = await Product.find({
        category: new RegExp(cat, "i"),
      })
        .limit(5)
        .lean();
      if (matches.length) {
        return res.json({
          reply: `Products in “${matches[0].category}”:`,
          products: matches.map((p) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            category: p.category,
          })),
        });
      }
    }

    // 5) Fallback: specific product name lookup
    const found = await Product.findOne({
      name: new RegExp(text, "i"),
    }).lean();
    if (found) {
      return res.json({
        reply: `Yes, “${found.name}” is available for ₱${found.price}.`,
      });
    }

    // 6) Final fallback: updated suggestions
    return res.json({
      reply:
        "Sorry, I didn’t understand that. I can help with products, pricing, coupons, store hours, or location.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
