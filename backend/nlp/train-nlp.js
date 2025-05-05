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
// 1) Example utterances for each intent
// ——————————————————————————

// GREETING
manager.addDocument("en", "hi", "greeting");
manager.addDocument("en", "hello", "greeting");
manager.addDocument("en", "hey", "greeting");
manager.addDocument("en", "how are you", "greeting");
manager.addDocument("en", "how are you doing", "greeting");
manager.addDocument("en", "what's up", "greeting");
manager.addDocument("en", "howdy", "greeting");

// HOURS
manager.addDocument("en", "what are your hours", "hours");
manager.addDocument("en", "when do you open", "hours");
manager.addDocument("en", "store hours", "hours");

// LOCATION
manager.addDocument("en", "where are you located", "location");
manager.addDocument("en", "where is your shop", "location");

// PRODUCT LISTING
manager.addDocument("en", "show me products", "products.list");
manager.addDocument("en", "recommend items", "products.list");
manager.addDocument("en", "do you have *", "products.filter");

// PRICE QUERY (will ask for exact name if not clear)
manager.addDocument("en", "how much is *", "price.query");
manager.addDocument("en", "price of *", "price.query");

// ORDER STATUS
manager.addDocument("en", "where is my order", "order.status");
manager.addDocument("en", "track my order", "order.status");
manager.addDocument("en", "order status", "order.status");

// COUPONS & DISCOUNTS
manager.addDocument("en", "any coupon code", "coupon.info");
manager.addDocument("en", "discount", "coupon.info");
manager.addDocument("en", "promo code", "coupon.info");

// CUSTOMER SUPPORT
manager.addDocument("en", "help", "support");
manager.addDocument("en", "i need help", "support");
manager.addDocument("en", "customer support", "support");

// FAREWELL
manager.addDocument("en", "bye", "farewell");
manager.addDocument("en", "goodbye", "farewell");
manager.addDocument("en", "see you", "farewell");

// THANKS
manager.addDocument("en", "thanks", "thanks");
manager.addDocument("en", "thank you", "thanks");

// ——————————————————————————
// 2) Static replies for those intents
// ——————————————————————————

// Greeting, injecting user if available
manager.addAnswer(
  "en",
  "greeting",
  "Hello{{user ? ', ' + user : ''}}! 👋 How can I help today?"
);

// Hours & location
manager.addAnswer("en", "hours", "🕘 We're open Mon-Sat, 9 AM to 6 PM.");
manager.addAnswer(
  "en",
  "location",
  "📍 We're in Muntinlupa City, Philippines."
);

// Price query prompt
manager.addAnswer(
  "en",
  "price.query",
  "Sure—what’s the exact product name you’d like the price for?"
);

// Order status
manager.addAnswer(
  "en",
  "order.status",
  "You can track your order in your account page. Do you have your order number?"
);

// Coupon info
manager.addAnswer(
  "en",
  "coupon.info",
  "Use code SAVE10 for 10% off your first purchase! 🎉"
);

// Support hand-off
manager.addAnswer(
  "en",
  "support",
  "I’m here to help! What do you need assistance with?"
);

// Farewell & thanks
manager.addAnswer("en", "farewell", "Goodbye{{user ? ', ' + user : ''}}! 👋");
manager.addAnswer(
  "en",
  "thanks",
  "You’re welcome{{user ? ', ' + user : ''}}! 😊"
);

// ——————————————————————————
// 3) Train & save
// ——————————————————————————
(async () => {
  console.log("🔄 Training NLP model…");
  await manager.train();

  // ensure target folder exists
  const dir = path.dirname(MODEL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  manager.save(MODEL_FILE);
  console.log("✅ model.nlp saved!");
  process.exit(0);
})();
