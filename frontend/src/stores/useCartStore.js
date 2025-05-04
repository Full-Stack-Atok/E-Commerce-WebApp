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

  // Fetch the current cart from server
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

  // Add one product to the cart
  addToCart: async (product) => {
    try {
      const res = await axios.post("/cart", { productId: product._id });
      // res.data is the full updated cart array
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Product added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  },

  // Remove a single product entirely
  removeFromCart: async (productId) => {
    try {
      const res = await axios.delete("/cart", { data: { productId } });
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Removed from cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item");
    }
  },

  // Update quantity of a single product
  updateQuantity: async (productId, quantity) => {
    try {
      const res = await axios.put(`/cart/${productId}`, { quantity });
      set({ cart: res.data });
      get().calculateTotals();
      toast.success("Cart updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  },

  // Clear the entire cart
  clearCart: async () => {
    try {
      const res = await axios.delete("/cart/clear");
      set({
        cart: res.data, // should be []
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

  // Fetch available coupon
  getMyCoupon: async () => {
    try {
      const res = await axios.get("/coupons");
      set({ coupon: res.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },

  // Apply a discount coupon
  applyCoupon: async (code) => {
    try {
      const res = await axios.post("/coupons/validate", { code });
      set({ coupon: res.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },

  // Remove an applied coupon
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  // Compute subtotal and total (after coupon)
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
