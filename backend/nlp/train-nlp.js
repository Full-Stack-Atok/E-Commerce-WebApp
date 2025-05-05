// backend/nlp/train-nlp.js
import { trainNLP } from "./bot-nlp.js";

(async () => {
  console.log("🔄 Training NLP model…");
  await trainNLP(); // trains & writes model.nlp
  console.log("✅ model.nlp saved!");
  process.exit(0);
})();
