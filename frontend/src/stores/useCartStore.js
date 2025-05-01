import { create } from "zustand";
import axios from "../lib/axios.js";
import toast from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  // Fetch the coupon
  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error.message);
    }
  },

  // Apply the coupon
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },

  // Remove the coupon
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  // Fetch items from the cart
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  // Add a product to the cart
  addToCart: async (product) => {
    try {
      if (!product._id) {
        toast.error("Product does not have a valid ID");
        return;
      }

      // Optimistic update
      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });

      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      get().calculateTotals();
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Rollback optimistic update
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== product._id),
      }));
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  },

  // ✅ Remove a product from the cart (updated version)
  removeFromCart: async (productId) => {
    const productExists = get().cart.some((item) => item._id === productId);
    if (!productExists) {
      toast.error("Product not found in cart");
      return;
    }

    // Optimistic update
    set((prevState) => ({
      cart: prevState.cart.filter((item) => item._id !== productId),
    }));

    try {
      await axios.delete("/cart", { data: { productId } });
      get().calculateTotals();
      toast.success("Product removed from cart");
    } catch (error) {
      console.error("Error removing product from cart:", error);
      await get().getCartItems(); // Resync from server
    }
  },

  // Update the quantity of a product in the cart
  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  },

  // Clear the cart
  clearCart: async () => {
    try {
      await axios.delete("/cart", { data: {} });
      set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  },

  // Calculate totals
  calculateTotals: () => {
    const { cart, coupon, isCouponApplied } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let total = subtotal;

    if (coupon && isCouponApplied) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
}));
