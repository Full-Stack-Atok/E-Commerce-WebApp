// src/components/PurchaseSuccessPage.jsx

import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios.js";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Grab clearCart action from zustand store
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();

  // Track viewport size
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Finalize the order once Stripe redirects back
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );
    if (!sessionId) {
      setError("No session ID found in the URL");
      setIsProcessing(false);
      return;
    }

    const finalize = async () => {
      try {
        const res = await axios.post("/payments/checkout-success", {
          sessionId,
        });
        setOrderId(res.data.orderId);
        clearCart();
      } catch (err) {
        console.error("Checkout success error:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    finalize();
  }, [clearCart]);

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
      {/* Confetti now fills the whole viewport */}
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
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
              Check your email for order details and updates.
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
