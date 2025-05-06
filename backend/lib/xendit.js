import { Xendit } from "xendit-node";
const x = new Xendit({ secretKey: process.env.XENDIT_SECRET_API_KEY });
export const { EWallet } = x;
