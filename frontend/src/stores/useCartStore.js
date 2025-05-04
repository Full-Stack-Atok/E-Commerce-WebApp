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

  // Load cart from server
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (err) {
      set({ cart: [] });
      toast.error(err.response?.data?.message || "Failed to load cart");
    }
  },

  // Add a product
  addToCart: async (product) => {
    try {
      const res = await axios.post("/cart", { productId: product._id });
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  },

  // Remove one product completely
  removeFromCart: async (productId) => {
    try {
      const res = await axios.delete("/cart", { data: { productId } });
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  },

  // Update quantity
  updateQuantity: async (productId, quantity) => {
    try {
      const res = await axios.put(`/cart/${productId}`, { quantity });
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Quantity updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const res = await axios.delete("/cart/clear");
      set({
        cart: res.data,
        coupon: null,
        subtotal: 0,
        total: 0,
        isCouponApplied: false,
      });
      toast.success("Cart cleared");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
    }
  },

  // Coupon actions omitted for brevity...

  // Totals calculation with null‐product filtering
  calculateTotals: () => {
    const { cart, coupon } = get();

    // Filter out any items whose product failed to populate
    const valid = cart.filter((ci) => ci.product);

    const subtotal = valid.reduce((sum, ci) => {
      const price = Number(ci.product.price) || 0;
      const qty = Number(ci.quantity) || 0;
      return sum + price * qty;
    }, 0);

    let total = subtotal;
    if (coupon?.discountPercentage > 0) {
      total = subtotal * (1 - coupon.discountPercentage / 100);
    }

    set({ subtotal, total });
  },
}));
