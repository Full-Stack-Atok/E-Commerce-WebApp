// backend/nlp/bot-nlp.js
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";

const MODEL_FILE = path.resolve("./model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// ——————————————————————————
// 1) Register your intents & utterances
// ——————————————————————————
manager.addDocument("en", "hi", "greeting");
manager.addDocument("en", "hello", "greeting");
manager.addDocument("en", "hey", "greeting");

manager.addDocument("en", "what are your hours", "hours");
manager.addDocument("en", "when do you open", "hours");
manager.addDocument("en", "store hours", "hours");

manager.addDocument("en", "where are you located", "location");
manager.addDocument("en", "where is your shop", "location");
manager.addDocument("en", "your location", "location");

manager.addDocument("en", "show me products", "products.list");
manager.addDocument("en", "recommend items", "products.list");
manager.addDocument("en", "do you have *", "products.filter");

// ——————————————————————————
// 2) Register simple responses for fixed intents
// ——————————————————————————
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

// ——————————————————————————
// 3) Load or train & save model
// ——————————————————————————
if (fs.existsSync(MODEL_FILE)) {
  manager.load(MODEL_FILE);
} else {
  console.warn(
    "⚠️  model.nlp not found — run `node backend/nlp/train-nlp.js` to create it"
  );
}

export async function parseMessage(message) {
  return manager.process("en", message);
}

// ——————————————————————————
// 4) Train helper (run once)
// ——————————————————————————
export async function trainNLP(userName = "") {
  manager.container.register("user", userName);
  await manager.train();
  manager.save(MODEL_FILE);
}
