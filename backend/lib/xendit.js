// backend/lib/xendit.js
import { Xendit } from "xendit-node";
import dotenv from "dotenv";

dotenv.config();

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_API_KEY, // your TEST key on Render
});

const { EWallet } = xenditClient;
export const ewallet = new EWallet({});
