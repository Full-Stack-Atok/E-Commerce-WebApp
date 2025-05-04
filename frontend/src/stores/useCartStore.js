import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  subtotal: 0,
  total: 0,
  isCouponApplied: false,

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response?.data?.message || "Failed to load cart");
    }
  },

  // Clear both server and local cart
  clearCart: async () => {
    try {
      await axios.delete("/cart/clear");
      set({
        cart: [],
        coupon: null,
        subtotal: 0,
        total: 0,
        isCouponApplied: false,
      });
      toast.success("Your cart is now empty");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear cart");
    }
  },

  // Existing actions…
  addToCart: async (product) => {
    /* … */
  },
  removeFromCart: async (id) => {
    /* … */
  },
  updateQuantity: async (id, qty) => {
    /* … */
  },
  applyCoupon: async (code) => {
    /* … */
  },
  removeCoupon: () => {
    /* … */
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce((sum, ci) => {
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
