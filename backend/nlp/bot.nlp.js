// backend/nlp/bot-nlp.js
import { NlpManager } from "node-nlp";
import Product from "../models/product.model.js";

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

// You can add more examples here for “show products”, “product in CATEGORY”, etc.
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
// 3) Train & save the model (run once)
// ——————————————————————————
export async function trainNLP(userName = "") {
  // you can pass userName to inject into greeting via a Jinja variable
  manager.container.register("user", userName);
  await manager.train();
  manager.save();
}

// ——————————————————————————
// 4) Export a helper for your controller
// ——————————————————————————
export async function parseMessage(message) {
  return manager.process("en", message);
}
