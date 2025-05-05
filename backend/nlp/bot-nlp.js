// backend/nlp/bot-nlp.js
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";

const MODEL_FILE = path.join(__dirname, "../model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// Load the trained model
if (fs.existsSync(MODEL_FILE)) {
  manager.load(MODEL_FILE);
} else {
  console.warn(
    "⚠️  model.nlp not found — run `npm run train-nlp` to create it"
  );
}

/**
 * Parse a message, injecting the user’s name for greetings.
 * @param {string} message
 * @param {string} userName
 */
export async function parseMessage(message, userName = "") {
  manager.container.register("user", userName);
  return manager.process("en", message);
}
