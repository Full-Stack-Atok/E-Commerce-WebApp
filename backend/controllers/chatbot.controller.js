// backend/controllers/chatbot.controller.js
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import { parseMessage } from "../nlp/bot-nlp.js";

export const chatBot = async (req, res) => {
  try {
    const text = (req.body.message || "").trim();
    if (!text) {
      return res.json({
        reply: "Please type something for me to respond to.",
      });
    }

    // classify + get any static answer
    const { intent, score, entities, answer } = await parseMessage(
      text,
      req.user?.name || ""
    );
    console.log({ intent, score, entities, answer });

    // 1) Static replies
    if (
      ["greeting", "hours", "location", "bot.age"].includes(intent) &&
      answer
    ) {
      return res.json({ reply: answer });
    }

    // Helper: normalize a captured product name
    const normalizeName = (raw) => {
      return (
        raw
          .trim()
          // remove leading article "a " or "an "
          .replace(/^(a|an)\s+/i, "")
          // remove trailing punctuation
          .replace(/[?!.]$/g, "")
          .trim()
      );
    };

    // 2) Price query
    if (intent === "price.query") {
      let name = text
        .replace(/^how much is\s+/i, "")
        .replace(/^price of\s+/i, "")
        .trim();
      name = normalizeName(name);

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

    // 3) Coupon info
    if (intent === "coupon.info") {
      const coupon = await Coupon.findOne({
        userId: req.user._id,
        isActive: true,
      });
      return res.json({
        reply: coupon
          ? `You have an active coupon: ${coupon.code} for ${coupon.discountPercentage}% off.`
          : "You don't have any active coupons right now.",
      });
    }

    // 4) Generic product availability if NER spotted a product entity
    const prodEnt = entities.find((e) => e.entity === "product");
    if (prodEnt) {
      const raw = prodEnt.resolution?.value || prodEnt.sourceText;
      const requested = normalizeName(raw);
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
      } else {
        return res.json({
          reply: `Sorry, we don’t have “${requested}” available right now.`,
        });
      }
    }

    // 5) Top products list
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

    // 6) Products by category
    if (intent === "products.byCategory" && score > 0.6) {
      const catEnt = entities.find((e) => e.entity === "category");
      const category = catEnt?.resolution?.value || catEnt?.sourceText;
      if (!category) {
        return res.json({ reply: "Which category are you interested in?" });
      }
      const matches = await Product.find({
        category: new RegExp(`^${category}$`, "i"),
        available: true,
      })
        .limit(5)
        .lean();
      if (matches.length) {
        return res.json({
          reply: `Here are our ${matches[0].category}:`,
          products: matches.map((p) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            category: p.category,
          })),
        });
      } else {
        return res.json({
          reply: `Sorry, we don't have any items in “${category}” right now.`,
        });
      }
    }

    // 7) Final fallback
    return res.json({
      reply:
        "Sorry, I didn’t understand that. I can help with products, pricing, coupons, store hours, or location.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ reply: "Oops, something went wrong." });
  }
};
