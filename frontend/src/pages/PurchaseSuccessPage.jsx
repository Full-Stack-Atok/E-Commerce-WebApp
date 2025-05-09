import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios.js";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();
  const { search } = useLocation();

  // pull URL params once
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id"); // Stripe
  const urlOrderId = params.get("orderId"); // COD or PayPal
  const isOffline = params.get("offline") === "true";

  // state
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(urlOrderId || null);

  useEffect(() => {
    // 1) If we have ANY orderId (PayPal or COD), treat it as success:
    if (urlOrderId) {
      clearCart();
      setIsProcessing(false);
      return;
    }

    // 2) Otherwise, if Stripe flow:
    if (sessionId) {
      (async () => {
        try {
          const { data } = await axios.post("/payments/checkout-success", {
            sessionId,
          });
          setOrderId(data.orderId);
          clearCart();
        } catch (err) {
          console.error("Checkout success error:", err);
          setError(err.response?.data?.message || err.message);
        } finally {
          setIsProcessing(false);
        }
      })();
    } else {
      // neither Stripe nor PayPal/COD
      setError("No session_id or orderId found in URL");
      setIsProcessing(false);
    }
  }, [sessionId, urlOrderId, clearCart]);

  if (isProcessing) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Finalizing your order…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={() => navigate("/cart")}
          className="underline text-white"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  return (
    <>
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        numberOfPieces={500}
        recycle={false}
        style={{
          zIndex: 100,
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />

      <div className="h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
          <div className="p-6 sm:p-8 text-center">
            <CheckCircle className="text-sky-500 w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-200 mb-2">
              Purchase Successful!
            </h1>
            <p className="text-gray-300 mb-1">Thank you for your order.</p>
            <p className="text-gray-400 text-sm mb-6">
              Your order is confirmed and marked as paid.
            </p>

            <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-200">Order number</span>
                <span className="text-sm font-semibold text-gray-200">
                  #{orderId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-200">
                  Estimated delivery
                </span>
                <span className="text-sm font-semibold text-gray-200">
                  3–5 business days
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
              >
                <HandHeart size={18} /> Back to Home
              </button>
              <Link
                to="/"
                className="block text-sm text-white underline hover:text-sky-300"
              >
                Continue Shopping <ArrowRight className="inline" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseSuccessPage;
