import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import { useEffect, useCallback } from "react";

// Pull key from Vite env and force locale to 'auto'
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  locale: "auto",
});

const OrderSummary = () => {
  const cart = useCartStore((state) => state.cart);
  const coupon = useCartStore((state) => state.coupon);
  const isCouponApplied = useCartStore((state) => state.isCouponApplied);
  const total = useCartStore((state) => state.total);
  const calculateTotals = useCartStore((state) => state.calculateTotals);

  // Recalculate whenever cart or coupon changes
  useEffect(() => {
    if (typeof calculateTotals === "function") {
      calculateTotals();
    }
  }, [cart, coupon, calculateTotals]);

  // Compute original total before any discount
  const originalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Savings and formatting
  const savings = originalAmount - total;
  const fmt = (v) =>
    v.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  const formattedOriginal = fmt(originalAmount);
  const formattedSavings = fmt(savings);
  const formattedTotal = fmt(total);

  // Shared classes
  const rowClass = "flex justify-between text-gray-300";
  const valWhite = "text-white";
  const valDim = "text-slate-400";
  const btnBase =
    "w-full flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-4";
  const checkoutBtn = `${btnBase} bg-slate-600 hover:bg-sky-700 focus:ring-sky-300`;

  const handlePayment = useCallback(async () => {
    const stripe = await stripePromise;

    // Build payload: include couponCode only if applied
    const payload = {
      products: cart,
      ...(isCouponApplied && coupon?.code ? { couponCode: coupon.code } : {}),
    };

    try {
      const { data } = await axios.post(
        "/payments/create-checkout-session",
        payload
      );
      const sessionId = data.id;
      if (!sessionId) throw new Error("No session ID from API");

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) console.error("Stripe redirect error:", error.message);
    } catch (err) {
      console.error("Checkout API error:", err.response?.data || err.message);
    }
  }, [cart, coupon, isCouponApplied]);

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-white bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-white">Order Summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          {/* Original Price */}
          <dl className={rowClass}>
            <dt>Original price</dt>
            <dd className={valWhite}>{formattedOriginal}</dd>
          </dl>

          {/* Savings */}
          {savings > 0 && (
            <dl className={rowClass}>
              <dt>Savings</dt>
              <dd className={valDim}>-{formattedSavings}</dd>
            </dl>
          )}

          {/* Coupon % */}
          {coupon && isCouponApplied && (
            <dl className={rowClass}>
              <dt>Coupon ({coupon.code})</dt>
              <dd className={valDim}>-{coupon.discountPercentage}%</dd>
            </dl>
          )}

          {/* Final Total */}
          <dl className={`${rowClass} border-t border-gray-600 pt-2`}>
            <dt className="font-bold text-white">Total</dt>
            <dd className="font-bold text-white">{formattedTotal}</dd>
          </dl>
        </div>

        {/* Proceed to Checkout */}
        <motion.button
          onClick={handlePayment}
          className={checkoutBtn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Proceed to Checkout
        </motion.button>

        {/* Continue Shopping */}
        <div className="flex justify-center items-center gap-2">
          <span className="text-sm text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-white underline hover:text-sky-300"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
