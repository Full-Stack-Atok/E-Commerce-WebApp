// src/components/CartItem.jsx
import { Minus, Plus, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";

// Philippine peso formatter
const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
});

export default function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCartStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 shadow-lg overflow-hidden"
    >
      {/* Remove button */}
      <motion.button
        onClick={() => removeFromCart(item._id)}
        whileHover={{ scale: 1.2 }}
        className="absolute top-3 right-3 text-slate-400 hover:text-red-400"
        aria-label="Remove item"
      >
        <Trash className="h-5 w-5" />
      </motion.button>

      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0 md:gap-6">
        {/* Image */}
        <div className="flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="h-24 w-24 md:h-32 md:w-32 rounded-lg object-cover"
          />
        </div>

        {/* Name & Description */}
        <div className="flex-1 px-2 space-y-1">
          <h3 className="text-lg font-semibold text-slate-100 leading-snug">
            {item.name}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateQuantity(item._id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
          >
            <Minus className="h-4 w-4 text-slate-200" />
          </button>
          <span className="w-6 text-center text-slate-100">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item._id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Plus className="h-4 w-4 text-slate-200" />
          </button>
        </div>

        {/* Price */}
        <div className="w-28 text-right">
          <p className="text-lg font-bold text-slate-100">
            {money.format(item.price)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
