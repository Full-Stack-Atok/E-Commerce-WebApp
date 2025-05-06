import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // ◀️ NEW: how they paid
    paymentMethod: {
      type: String,
      enum: ["card", "gcash", "cod"],
      default: "card",
    },
    // ◀️ NEW: whether it’s already paid
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true, // allow null for offline
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
