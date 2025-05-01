import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import ChatBot from "./components/Chatbot";

import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";

export default function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();

  // On mount, verify auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Once we know who the user is, load their cart
  useEffect(() => {
    if (user) {
      getCartItems();
    }
  }, [user, getCartItems]);

  // While verifying auth, show spinner
  if (checkingAuth) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.6)_0%,_rgba(190,235,255,0.4)_45%,_rgba(180,220,255,0.2)_100%)]" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-50 pt-24 px-4 mx-auto max-w-7xl w-full">
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/signup"
            element={!user ? <SignUpPage /> : <Navigate to="/" />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/secret-dashboard"
            element={
              user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />
            }
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route
            path="/cart"
            element={user ? <CartPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/purchase-success"
            element={user ? <PurchaseSuccessPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/purchase-cancel"
            element={user ? <PurchaseCancelPage /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>

      {/* Global toaster */}
      <Toaster />

      {/* Chatbot fixed at bottom-right */}
      <ChatBot />
    </div>
  );
}
