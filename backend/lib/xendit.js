import Xendit from "xendit-node"; // default import
import dotenv from "dotenv";

dotenv.config();

// Initialize Xendit with your secret API key
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_API_KEY, // make sure this env var is set
});

// Pull out the EWallet class and instantiate it
const { EWallet } = xenditClient;
export const ewallet = new EWallet({}); // now EWallet is a real constructor
