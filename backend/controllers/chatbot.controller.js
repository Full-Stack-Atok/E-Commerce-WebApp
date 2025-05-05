import Product from "../models/product.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const text = (req.body.message || "").trim();
    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // 1) Run NLP, inject username for greeting
    const { intent, score, entities, answer } = await parseMessage(
      text,
      req.user?.name || ""
    );

    // 2) **Always** handle greeting first
    if (intent === "greeting" && answer) {
      return res.json({ reply: answer });
    }

    // 3) Other intents if reasonably confident
    if (score > 0.6 && intent !== "None") {
      if (intent === "hours") {
        return res.json({ reply: answer });
      }
      if (intent === "location") {
        return res.json({ reply: answer });
      }
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
    }

    // 4) Fallback: lookup by product name
    const found = await Product.findOne({
      name: new RegExp(text, "i"),
    }).lean();
    if (found) {
      return res.json({
        reply: `Yes, “${found.name}” is available for ₱${found.price}.`,
      });
    }

    // 5) Ultimate fallback
    return res.json({
      reply:
        "Sorry, I didn’t understand that. Try asking about products, hours, or location.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
