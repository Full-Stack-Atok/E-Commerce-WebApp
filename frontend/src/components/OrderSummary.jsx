// src/components/OrderSummary.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import toast from "react-hot-toast";

// Initialize Stripe.js
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  locale: "auto",
});

export default function OrderSummary() {
  // Cart & coupon state
  const cart = useCartStore((s) => s.cart);
  const coupon = useCartStore((s) => s.coupon);
  const isCouponApplied = useCartStore((s) => s.isCouponApplied);
  const total = useCartStore((s) => s.total);
  const calculateTotals = useCartStore((s) => s.calculateTotals);

  // Local UI state
  const [paymentMethod, setPaymentMethod] = useState("card"); // card | gcash | cod
  const [phone, setPhone] = useState(""); // for GCash
  const [loading, setLoading] = useState(false);

  // Recalculate totals whenever cart or coupon changes
  useEffect(() => {
    calculateTotals();
  }, [cart, coupon, calculateTotals]);

  // Format PHP currency
  const fmt = (v) =>
    v.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  // Handler for clicking "Proceed to Checkout"
  const handlePayment = useCallback(async () => {
    setLoading(true);
    try {
      // Build the payload for your backend
      const payload = {
        products: cart.map((item) => ({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
        })),
        paymentMethod,
        ...(isCouponApplied && coupon?.code ? { couponCode: coupon.code } : {}),
      };

      // Call your unified Stripe / offline endpoint
      const { data } = await axios.post(
        "/payments/create-checkout-session",
        payload
      );

      // If offline (GCash/COD) branch:
      if (data.offline) {
        toast.success("Order placed! 🎉");
        // Redirect to your success page with orderId
        window.location.href = `/#/purchase-success?orderId=${data.orderId}&offline=true`;
        return;
      }

      // Otherwise Stripe session returned:
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });
      if (error) toast.error(error.message);
    } catch (err) {
      console.error("Checkout API error:", err.response?.data || err.message);
      toast.error("Payment failed, please try again.");
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

      {/* Payment Method Picker */}
      <div className="space-y-2 text-gray-300">
        {[
          { value: "card", label: "Credit / Debit Card" },
          { value: "gcash", label: "GCash" },
          { value: "cod", label: "Cash on Delivery" },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value={opt.value}
              checked={paymentMethod === opt.value}
              onChange={() => setPaymentMethod(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* GCash phone input */}
      {paymentMethod === "gcash" && (
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-300">
            GCash Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XXXXXXXXX"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-500"
          />
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-2 text-gray-300">
        <dl className="flex justify-between">
          <dt>Original price</dt>
          <dd className="text-white">
            {fmt(
              cart.reduce(
                (sum, i) => sum + (i.product.price || 0) * i.quantity,
                0
              )
            )}
          </dd>
        </dl>
        {total <
          cart.reduce(
            (sum, i) => sum + (i.product.price || 0) * i.quantity,
            0
          ) && (
          <dl className="flex justify-between">
            <dt>Savings</dt>
            <dd className="text-slate-400">
              -
              {fmt(
                cart.reduce(
                  (sum, i) => sum + (i.product.price || 0) * i.quantity,
                  0
                ) - total
              )}
            </dd>
          </dl>
        )}
        {coupon && isCouponApplied && (
          <dl className="flex justify-between">
            <dt>Coupon ({coupon.code})</dt>
            <dd className="text-slate-400">-{coupon.discountPercentage}%</dd>
          </dl>
        )}
        <dl className="flex justify-between border-t border-gray-600 pt-2">
          <dt className="font-bold text-white">Total</dt>
          <dd className="font-bold text-white">{fmt(total)}</dd>
        </dl>
      </div>

      {/* Checkout Button */}
      <motion.button
        onClick={handlePayment}
        disabled={loading}
        className="w-full flex items-center justify-center rounded-lg px-5 py-2.5 bg-slate-600 text-sm font-medium transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? "Processing…" : "Proceed to Checkout"}
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
    </motion.div>
  );
}
