// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const text = (req.body.message || "").trim();
    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // register the user's name so your greeting template works
    const { intent, score, entities, answer } = await parseMessage(
      text,
      req.user?.name || ""
    );

    // … the rest of your intent / product logic …
    if (score > 0.7 && intent !== "None") {
      if (intent === "products.list") {
        // …
      }
      // etc.
      if (answer) {
        return res.json({ reply: answer });
      }
    }

    // fallback lookups…
    // …
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
