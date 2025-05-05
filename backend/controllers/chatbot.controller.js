// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const { message } = req.body;
    const text = (message || "").trim().toLowerCase();
    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // 1) Run the NLP and inject the user’s name for greetings
    const { intent, score, entities, answer } = await parseMessage(
      text,
      req.user?.name || ""
    );

    // 2) If we’ve got a high-confidence intent, handle it
    if (score > 0.7 && intent !== "None") {
      // a) List products
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

      // b) Filter by category
      if (intent === "products.filter" && entities.length) {
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

      // c) Any other static intent (greeting, hours, location)
      if (answer) {
        return res.json({ reply: answer });
      }
    }

    // 3) Fallback: single‐product lookup by name
    const found = await Product.findOne({
      name: new RegExp(text, "i"),
    }).lean();
    if (found) {
      return res.json({
        reply: `Yes, “${found.name}” is available for ₱${found.price}.`,
      });
    }

    // 4) Default fallback
    return res.json({
      reply:
        "Sorry, I didn’t understand that. Try asking about products, hours, or location.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
