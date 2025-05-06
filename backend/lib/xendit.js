import { Xendit } from "xendit-node";
import dotenv from "dotenv";

dotenv.config();

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_API_KEY,
});

// Destructure the EWallet **class** from the client…
const { EWallet } = xenditClient;

// …then build an **instance** of it.
// You can pass options here if needed—empty object is fine for basic flow.
export const ewalletClient = new EWallet({});
