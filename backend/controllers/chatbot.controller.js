// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";

export const chatBot = async (req, res) => {
  try {
    const { message } = req.body;
    const text = (message || "").trim().toLowerCase();

    if (!text) {
      return res.json({ reply: "Please type something for me to respond to." });
    }

    // 1) Greetings
    if (["hi", "hello", "hey"].some((w) => text.includes(w))) {
      return res.json({
        reply: `Hello${
          req.user?.name ? `, ${req.user.name}` : ""
        }! 👋 How can I help today?`,
      });
    }

    // 2) Store hours
    if (text.includes("hours") || text.includes("open")) {
      return res.json({ reply: "🕘 We’re open Mon–Sat, 9 AM to 6 PM." });
    }

    // 3) Location
    if (text.includes("where") || text.includes("located")) {
      return res.json({ reply: "📍 We’re in Muntinlupa City, Philippines." });
    }

    // 4) “Show me products”
    if (
      ["show", "list", "recommend", "products", "available"].some((kw) =>
        text.includes(kw)
      )
    ) {
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

    // 5) Category filter
    const all = await Product.find({}).lean();
    const catMatches = all.filter((p) =>
      text.includes(p.category.toLowerCase())
    );
    if (catMatches.length) {
      return res.json({
        reply: `Products in “${catMatches[0].category}”:`,
        products: catMatches.map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
        })),
      });
    }

    // 6) Single‐product lookup
    const found = all.find((p) => text.includes(p.name.toLowerCase()));
    if (found) {
      return res.json({
        reply: `Yes, “${found.name}” is available for ₱${found.price}.`,
      });
    }

    // 7) Fallback
    return res.json({
      reply:
        "Sorry, I didn’t understand that. Try asking about products, hours, or location.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
