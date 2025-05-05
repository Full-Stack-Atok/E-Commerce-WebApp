// backend/nlp/bot-nlp.js
import { NlpManager } from "node-nlp";
import fs from "fs";
import path from "path";

const MODEL_FILE = path.resolve("./model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

// … your addDocument / addAnswer calls …

// Load the trained model
if (fs.existsSync(MODEL_FILE)) {
  manager.load(MODEL_FILE);
} else {
  console.warn(
    "⚠️  model.nlp not found — run `node backend/nlp/train-nlp.js` to create it"
  );
}

/**
 * @param {string} message
 * @param {string} userName – will be injected into your greeting template
 */
export async function parseMessage(message, userName = "") {
  // register the user so {{user}} in your answers resolves
  manager.container.register("user", userName);
  return manager.process("en", message);
}

// your trainNLP() helper stays the same
export async function trainNLP(userName = "") {
  manager.container.register("user", userName);
  await manager.train();
  manager.save(MODEL_FILE);
}
