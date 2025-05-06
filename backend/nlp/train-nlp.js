// backend/nlp/train-nlp.js
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_FILE = path.resolve(__dirname, "../model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// ——————————————————————————
// 0) Named entities BEFORE you reference them
// ——————————————————————————

const categories = [
  "Jeans",
  "T-Shirts",
  "Shoes",
  "Glasses",
  "Jackets",
  "Suits",
  "Bags",
  "Gadgets",
];

manager.addNamedEntityText(
  "category",
  "category",
  ["en"],
  categories,
  categories.map((c) => c.toLowerCase())
);

manager.addNamedEntityText(
  "product",
  "product",
  ["en"],
  ["nike backpack", "backpack", "laptop sleeve", "formal suit"],
  ["nike backpack", "backpack", "laptop sleeve", "formal suit"]
);

// ——————————————————————————
// 1) Example utterances for each intent
// ——————————————————————————

// BOT AGE (so we catch it before greeting)
manager.addDocument("en", "how old are you", "bot.age");
manager.addDocument("en", "what is your age", "bot.age");
manager.addDocument("en", "when were you created", "bot.age");

// GREETING
manager.addDocument("en", "hi", "greeting");
manager.addDocument("en", "hello", "greeting");
manager.addDocument("en", "hey", "greeting");
manager.addDocument("en", "how are you", "greeting");
manager.addDocument("en", "what's up", "greeting");

// PRODUCT AVAILABILITY
manager.addDocument("en", "do you have %product%", "product.availability");
manager.addDocument("en", "is %product% in stock", "product.availability");
manager.addDocument("en", "can I get %product%", "product.availability");
manager.addDocument("en", "availability of %product%", "product.availability");

// HOURS
manager.addDocument("en", "what are your hours", "hours");
manager.addDocument("en", "when do you open", "hours");

// LOCATION
manager.addDocument("en", "where are you located", "location");
manager.addDocument("en", "where is your shop", "location");

// PRODUCT LIST
manager.addDocument("en", "show me products", "products.list");
manager.addDocument("en", "recommend items", "products.list");

// PRICE QUERY
manager.addDocument("en", "how much is *", "price.query");
manager.addDocument("en", "price of *", "price.query");

// COUPON INFO
manager.addDocument("en", "any coupon code", "coupon.info");
manager.addDocument("en", "discount", "coupon.info");
manager.addDocument("en", "promo code", "coupon.info");

// PRODUCTS BY CATEGORY
manager.addDocument("en", "show me %category%", "products.byCategory");
manager.addDocument("en", "list %category%", "products.byCategory");
manager.addDocument("en", "what %category% do you have", "products.byCategory");
manager.addDocument("en", "do you sell %category%", "products.byCategory");

// ——————————————————————————
// 2) Static replies for each intent
// ——————————————————————————

// Bot age
manager.addAnswer(
  "en",
  "bot.age",
  "I’m an AI assistant without a traditional age—I came online when my model was deployed."
);

// Greeting
manager.addAnswer(
  "en",
  "greeting",
  "Hello{{user ? ', ' + user : ''}}! 👋 How can I help today?"
);

// Hours
manager.addAnswer("en", "hours", "🕘 We're open Mon–Sat, 9 AM to 6 PM.");

// Location
manager.addAnswer(
  "en",
  "location",
  "📍 We're in Muntinlupa City, Philippines."
);

// Products list
manager.addAnswer(
  "en",
  "products.list",
  "Sure! Here are some of our top items: ..."
);

// Product availability
manager.addAnswer(
  "en",
  "product.availability",
  "Let me check… Yes, we have {{entity.product}} in stock! 🎉"
);

// Price query
manager.addAnswer(
  "en",
  "price.query",
  "The price for \"%slot1%\" is PHP {{session.slot1.price || '—'}}."
);

// Coupon info
manager.addAnswer(
  "en",
  "coupon.info",
  "You can use code SAVE10 for 10% off your first order! 🏷️"
);

// Products by category
manager.addAnswer(
  "en",
  "products.byCategory",
  "Here are our {{entity.category}}: ..."
);

// ——————————————————————————
// 3) Train & save the model
// ——————————————————————————
(async () => {
  console.log("🔄 Training NLP model…");
  await manager.train();

  // ensure output directory exists
  const dir = path.dirname(MODEL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  manager.save(MODEL_FILE);
  console.log("✅ model.nlp saved!");
  process.exit(0);
})();
