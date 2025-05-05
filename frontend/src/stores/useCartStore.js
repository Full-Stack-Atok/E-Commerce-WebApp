// frontend/src/stores/useCartStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  subtotal: 0,
  total: 0,
  isCouponApplied: false,

  // Load cart
  getCartItems: async () => {
    try {
      const { data } = await axios.get("/cart");
      set({ cart: data });
      get().calculateTotals();
    } catch (err) {
      set({ cart: [] });
      toast.error(err.response?.data?.message || "Failed to load cart");
    }
  },

  // Fetch user's coupon
  getMyCoupon: async () => {
    try {
      const { data } = await axios.get("/coupons");
      set({ coupon: data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },

  // Apply a coupon
  applyCoupon: async (code) => {
    try {
      const { data } = await axios.post("/coupons/validate", { code });
      set({ coupon: data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },

  // Remove coupon
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  // Add product to cart
  addToCart: async (product) => {
    try {
      const { data } = await axios.post("/cart", { productId: product._id });
      set({ cart: data });
      get().calculateTotals();
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  },

  // Remove product from cart
  removeFromCart: async (productId) => {
    try {
      const { data } = await axios.delete("/cart", { data: { productId } });
      set({ cart: data });
      get().calculateTotals();
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  },

  // Update quantity
  updateQuantity: async (productId, quantity) => {
    try {
      const { data } = await axios.put(`/cart/${productId}`, { quantity });
      set({ cart: data });
      get().calculateTotals();
      toast.success("Quantity updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  },

  // Clear cart completely
  clearCart: async () => {
    try {
      const { data } = await axios.delete("/cart/clear");
      set({
        cart: data,
        subtotal: 0,
        total: 0,
        coupon: null,
        isCouponApplied: false,
      });
      toast.success("Cart cleared");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
    }
  },

  // ── helpers ──────────────────────────────────────────────────
  calculateTotals: () => {
    const { cart, coupon } = get();

    const validCart = cart.filter((item) => item.product && item.product.price);
    const subtotal = validCart.reduce(
      (sum, ci) => sum + ci.product.price * ci.quantity,
      0
    );

    let total = subtotal;
    if (coupon) {
      total -= subtotal * (coupon.discountPercentage / 100);
    }

    set({ subtotal, total });
  },
}));
