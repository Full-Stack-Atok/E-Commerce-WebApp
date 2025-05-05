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
manager.addDocument("en", "what's up", "greeting");

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

// ——————————————————————————
// 2) Static replies for the original intents
// ——————————————————————————
manager.addAnswer(
  "en",
  "greeting",
  "Hello{{user ? ', ' + user : ''}}! 👋 How can I help today?"
);
manager.addAnswer("en", "hours", "🕘 We're open Mon-Sat, 9 AM to 6 PM.");
manager.addAnswer(
  "en",
  "location",
  "📍 We're in Muntinlupa City, Philippines."
);

// ——————————————————————————
// 3) Train & save the model
// ——————————————————————————
(async () => {
  console.log("🔄 Training NLP model…");
  await manager.train();

  // make sure target directory exists
  const dir = path.dirname(MODEL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  manager.save(MODEL_FILE);
  console.log("✅ model.nlp saved!");
  process.exit(0);
})();
