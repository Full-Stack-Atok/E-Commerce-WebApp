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

    // 1) Run the NLP
    const { intent, score, entities, answer } = await parseMessage(text);

    // 2) If we've got a strong, non-None intent...
    if (score > 0.7 && intent !== "None") {
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

      // use the static answer you defined in bot-nlp.js
      if (answer) {
        return res.json({ reply: answer });
      }
    }

    // 3) Fallback: lookup by product name
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
