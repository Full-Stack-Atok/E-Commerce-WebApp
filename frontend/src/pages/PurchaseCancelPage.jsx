// src/components/PurchaseCancelPage.jsx
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function PurchaseCancelPage() {
  // You can read session_id if needed:
  const { search } = useLocation();
  const sessionId = new URLSearchParams(search).get("session_id");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10"
      >
        <div className="p-6 sm:p-8 text-center">
          <XCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-red-500 mb-2">
            Purchase Cancelled
          </h1>
          <p className="text-gray-300 text-center mb-6">
            Your order has been cancelled. No charges have been made.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-200 text-center">
              If you encountered any issues during the checkout process, please
              contact our support team.
            </p>
          </div>
          <div className="space-y-4">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              <ArrowLeft className="mr-2" size={18} />
              Return to Shop
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
