import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  try {
    // Initial greeting on first open
    if (message === "greeting") {
      return res.json({
        reply: "Hello 👋 I'm Rocket Bay's assistant. How can I help you today?",
      });
    }

    // Check for greetings
    if (["hi", "hello", "hey"].some((greet) => lowerMsg.includes(greet))) {
      return res.json({
        reply: "Hi there! 😊 Ask me about any product you're looking for.",
      });
    }

    if (lowerMsg.includes("how are you")) {
      return res.json({
        reply:
          "I'm just a code, but I'm feeling fast today! How can I help you?",
      });
    }

    if (lowerMsg.includes("open") || lowerMsg.includes("hours")) {
      return res.json({
        reply: "We're open from 9 AM to 6 PM, Monday to Saturday. 🕘",
      });
    }

    if (lowerMsg.includes("where") || lowerMsg.includes("located")) {
      return res.json({
        reply: "We're located in Muntinlupa City! 📍 Come visit us!",
      });
    }

    if (
      lowerMsg.includes("recommend") ||
      lowerMsg.includes("suggest") ||
      lowerMsg.includes("show") ||
      lowerMsg.includes("products") ||
      lowerMsg.includes("available")
    ) {
      const recommended = await Product.find({}).limit(5);
      const productList = recommended.map((p) => ({
        _id: p._id, // Include the product's _id here
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
      }));

      return res.json({
        reply: "Here are some products you might like:",
        products: productList,
      });
    }

    const products = await Product.find({});

    const categoryMatches = products.filter((p) =>
      lowerMsg.includes(p.category.toLowerCase())
    );

    if (categoryMatches.length > 0) {
      const productList = categoryMatches.map((p) => ({
        _id: p._id, // Include the product's _id here
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
      }));

      return res.json({
        reply: `Here are the available products in the "${categoryMatches[0].category}" category:`,
        products: productList,
      });
    }

    const foundProduct = products.find((p) =>
      lowerMsg.includes(p.name.toLowerCase())
    );

    if (foundProduct) {
      return res.json({
        reply: `Yes, "${foundProduct.name}" is available for ₱${foundProduct.price}.`,
      });
    }

    return res.json({
      reply: "Sorry, I couldn't find that product. Try asking about another.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ reply: "Something went wrong." });
  }
});

export default router;
