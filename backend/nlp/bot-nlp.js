// backend/nlp/bot-nlp.js
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_FILE = path.resolve(__dirname, "../model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// load the trained model (if it exists)
if (fs.existsSync(MODEL_FILE)) {
  manager.load(MODEL_FILE);
} else {
  console.warn(
    "⚠️  model.nlp not found — run `npm run train-nlp` before starting"
  );
}

/**
 * Parses a user message through the NLP model, injecting the user’s name.
 * @param {string} message
 * @param {string} userName
 */
export async function parseMessage(message, userName = "") {
  manager.container.register("user", userName);
  return manager.process("en", message);
}
