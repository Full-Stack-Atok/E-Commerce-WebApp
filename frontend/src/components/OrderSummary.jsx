// src/components/OrderSummary.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  locale: "auto",
});

const OrderSummary = () => {
  const cart = useCartStore((s) => s.cart);
  const coupon = useCartStore((s) => s.coupon);
  const isCouponApplied = useCartStore((s) => s.isCouponApplied);
  const total = useCartStore((s) => s.total);
  const calculateTotals = useCartStore((s) => s.calculateTotals);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // recalc whenever cart/coupon changes
  useEffect(() => {
    calculateTotals();
  }, [cart, coupon]);

  // formatting helpers
  const originalAmount = cart.reduce(
    (sum, i) => sum + (i.product.price || 0) * i.quantity,
    0
  );
  const savings = originalAmount - total;
  const fmt = (v) =>
    v.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  // the only change: include paymentMethod, and branch on offline
  const handlePayment = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        products: cart.map((item) => ({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
        })),
        paymentMethod, // ← NEW
        ...(isCouponApplied && coupon?.code ? { couponCode: coupon.code } : {}),
      };

      const { data } = await axios.post(
        "/payments/create-checkout-session",
        payload
      );

      // if offline flow (gcash / cod) was used:
      if (data.offline) {
        // replace with whatever your “success” route is
        window.location.href = `/#/purchase-success?orderId=${data.orderId}`;
        return;
      }

      // otherwise Stripe flow:
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });
      if (error) console.error(error.message);
    } catch (err) {
      console.error("Checkout API error:", err.response?.data || err.message);
      alert("Payment failed, please try again.");
    } finally {
      setLoading(false);
    }
  }, [cart, coupon, isCouponApplied, paymentMethod]);

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-white bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-white">Order Summary</p>

      {/* ---------------- Payment Method Picker ---------------- */}
      <div className="space-y-2 text-gray-300">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="card"
            checked={paymentMethod === "card"}
            onChange={() => setPaymentMethod("card")}
          />
          Credit / Debit Card
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="gcash"
            checked={paymentMethod === "gcash"}
            onChange={() => setPaymentMethod("gcash")}
          />
          GCash
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Cash on Delivery
        </label>
      </div>

      {/* ---------------- Price Breakdown ---------------- */}
      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex justify-between text-gray-300">
            <dt>Original price</dt>
            <dd className="text-white">{fmt(originalAmount)}</dd>
          </dl>

          {savings > 0 && (
            <dl className="flex justify-between text-gray-300">
              <dt>Savings</dt>
              <dd className="text-slate-400">-{fmt(savings)}</dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex justify-between text-gray-300">
              <dt>Coupon ({coupon.code})</dt>
              <dd className="text-slate-400">-{coupon.discountPercentage}%</dd>
            </dl>
          )}

          <dl className="flex justify-between border-t border-gray-600 pt-2">
            <dt className="font-bold text-white">Total</dt>
            <dd className="font-bold text-white">{fmt(total)}</dd>
          </dl>
        </div>

        {/* ---------------- Checkout Button ---------------- */}
        <motion.button
          onClick={handlePayment}
          disabled={loading}
          className="w-full flex items-center justify-center rounded-lg px-5 py-2.5 bg-slate-600 text-sm font-medium transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? "Processing…" : "Proceed to Checkout"}
        </motion.button>

        {/* ---------------- Continue Shopping ---------------- */}
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
