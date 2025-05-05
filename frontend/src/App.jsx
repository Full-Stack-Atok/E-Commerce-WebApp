// src/App.jsx (routing)
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session_id");

  const user = useUserStore((state) => state.user);
  const checkAuth = useUserStore((state) => state.checkAuth);
  const checkingAuth = useUserStore((state) => state.checkingAuth);
  const getCartItems = useCartStore((state) => state.getCartItems);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  useEffect(() => {
    if (user) getCartItems();
  }, [user, getCartItems]);
  if (checkingAuth) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <Navbar />
      <div className="relative z-50 pt-24 px-4 mx-auto max-w-7xl w-full">
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
            element={
              sessionId || user ? (
                <PurchaseSuccessPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/purchase-cancel"
            element={
              sessionId || user ? (
                <PurchaseCancelPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
        <Toaster />
        <ChatBot />
      </div>
    </div>
  );
}
