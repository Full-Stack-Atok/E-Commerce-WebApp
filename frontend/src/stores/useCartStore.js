// src/stores/useCartStore.js

import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  // === State ===
  cart: [],
  loading: false,
  subtotal: 0,
  total: 0,
  coupon: null,
  isCouponApplied: false,

  // === Coupon methods ===
  getMyCoupon: async () => {
    try {
      const res = await axios.get("/coupons");
      set({ coupon: res.data, isCouponApplied: false });
    } catch (err) {
      console.error("getMyCoupon error:", err);
      toast.error("Failed to load coupon");
    }
  },

  applyCoupon: async (code) => {
    try {
      const res = await axios.post("/coupons/validate", { code });
      set({ coupon: res.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied!");
    } catch (err) {
      console.error("applyCoupon error:", err);
      toast.error(err.response?.data?.message || "Invalid coupon");
    }
  },

  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  // === Cart methods ===
  getCartItems: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/cart");
      const flat = Array.isArray(res.data)
        ? res.data
            .filter((ci) => ci.product && ci.product.price != null)
            .map((ci) => ({
              _id: ci.product._id,
              name: ci.product.name,
              price: ci.product.price,
              image: ci.product.image,
              description: ci.product.description || "",
              quantity: ci.quantity,
            }))
        : [];
      set({ cart: flat, loading: false });
      get().calculateTotals();
    } catch (err) {
      console.error("getCartItems error:", err);
      set({ cart: [], loading: false });
      toast.error(err.response?.data?.message || "Failed to fetch cart");
    }
  },

  addToCart: async (product) => {
    if (!product._id) {
      return toast.error("Product ID is missing");
    }
    set({ loading: true });
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Added to cart");
      await get().getCartItems();
    } catch (err) {
      console.error("addToCart error:", err);
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      set({ loading: false });
    }
  },

  removeFromCart: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete("/cart", { data: { productId } });
      await get().getCartItems();
    } catch (err) {
      console.error("removeFromCart error:", err);
      toast.error(err.response?.data?.message || "Failed to remove item");
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (productId, quantity) => {
    set({ loading: true });
    try {
      if (quantity <= 0) {
        await get().removeFromCart(productId);
      } else {
        await axios.put(`/cart/${productId}`, { quantity });
        await get().getCartItems();
      }
    } catch (err) {
      console.error("updateQuantity error:", err);
      toast.error(err.response?.data?.message || "Failed to update quantity");
    } finally {
      set({ loading: false });
    }
  },

  calculateTotals: () => {
    const cart = get().cart;
    let subtotal = cart.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    if (get().isCouponApplied && get().coupon) {
      const discount = subtotal * (get().coupon.discountPercentage / 100);
      subtotal -= discount;
    }
    set({ subtotal, total: subtotal });
  },

  // === Clear everything (used after successful checkout) ===
  clearCartServer: async () => {
    set({ loading: true });
    try {
      await axios.delete("/cart/clear"); // hits our new endpoint
      get().clearCart(); // reset client state
      toast.success("Cart emptied");
    } catch (err) {
      console.error("clearCartServer error:", err);
      toast.error("Failed to clear cart");
    } finally {
      set({ loading: false });
    }
  },
}));
