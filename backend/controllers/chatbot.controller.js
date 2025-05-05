// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const { message } = req.body;
    const text = (message || "").trim();

    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // 1) First, let node-nlp classify intent
    const nlpResult = await parseMessage(text);
    const intent = nlpResult.intent; // e.g. "greeting", "hours", "products.list", etc.
    const score = nlpResult.score; // confidence 0–1
    const entities = nlpResult.entities; // array of extracted entities, e.g. a product name

    // 2) If high-confidence fixed intent, reply
    if (score > 0.7 && intent !== "None") {
      // handle product lists
      if (intent === "products.list") {
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

      // category filter if entity = category
      if (intent === "products.filter" && entities.length) {
        const cat = entities[0].option || entities[0].sourceText;
        const matches = await Product.find({
          category: new RegExp(cat, "i"),
        }).lean();
        if (matches.length) {
          return res.json({
            reply: `Products in "${matches[0].category}":`,
            products: matches.slice(0, 5).map((p) => ({
              _id: p._id,
              name: p.name,
              price: p.price,
              image: p.image,
              category: p.category,
            })),
          });
        }
      }

      // all other fixed intents (greeting, hours, location)
      const answer = manager.findAnswer("en", intent);
      return res.json({ reply: answer });
    }

    // 3) Fallback to your old keyword‐based logic or a friendly default
    // (you can keep your existing rules here)

    // existing fallback sample:
    const found = await Product.findOne({
      name: new RegExp(text, "i"),
    }).lean();
    if (found) {
      return res.json({
        reply: `Yes, "${found.name}" is available for ₱${found.price}.`,
      });
    }

    return res.json({
      reply:
        "Sorry, I didn’t understand that. You can ask about store hours, location, or products.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
