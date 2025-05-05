import { NlpManager } from "node-nlp";
import path from "path";

const MODEL_FILE = path.resolve("./model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// — Intents & example utterances —
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

// — Static replies —
manager.addAnswer(
  "en",
  "greeting",
  "Hello{{#if user}}, {{user}}{{/if}}! 👋 How can I help today?"
);
manager.addAnswer("en", "hours", "🕘 We’re open Mon–Sat, 9 AM to 6 PM.");
manager.addAnswer(
  "en",
  "location",
  "📍 We’re in Muntinlupa City, Philippines."
);

// — Train & save —
(async () => {
  console.log("🔄 Training NLP model…");
  await manager.train();
  manager.save(MODEL_FILE);
  console.log("✅ model.nlp saved!");
  process.exit(0);
})();
