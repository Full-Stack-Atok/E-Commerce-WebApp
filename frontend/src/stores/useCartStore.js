import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  // State
  cart: [], // array of { product: {...}, quantity }
  subtotal: 0,
  total: 0,

  // 1) Load cart
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

  // 2) Add one unit
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

  // 3) Remove entire line
  removeFromCart: async (productId) => {
    try {
      const { data } = await axios.delete("/cart", {
        data: { productId },
      });
      set({ cart: data });
      get().calculateTotals();
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  },

  // 4) Change quantity
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

  // 5) Clear all
  clearCart: async () => {
    try {
      const { data } = await axios.delete("/cart/clear");
      set({ cart: data, subtotal: 0, total: 0 });
      toast.success("Cart cleared");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
    }
  },

  // Compute totals (filtering out any null products)
  calculateTotals: () => {
    const cart = get().cart.filter((ci) => ci.product);
    const subtotal = cart.reduce((sum, ci) => {
      const price = Number(ci.product.price) || 0;
      const qty = Number(ci.quantity) || 0;
      return sum + price * qty;
    }, 0);
    set({ subtotal, total: subtotal });
  },
}));
