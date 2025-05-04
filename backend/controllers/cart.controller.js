// backend/src/controllers/cart.controller.js
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// GET /api/cart
export const getCartProducts = async (req, res) => {
  try {
    // Load user with populated cartItems.product
    const user = await User.findById(req.user._id).populate(
      "cartItems.product",
      "name price image"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return the populated array
    return res.json(user.cartItems);
  } catch (err) {
    console.error("getCartProducts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/cart  — add one unit of product
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ message: "productId is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Look for an existing cart item
    const existing = user.cartItems.find(
      (ci) => ci.product.toString() === productId
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      user.cartItems.push({ product: productId, quantity: 1 });
    }
    await user.save();

    const updated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(updated.cartItems);
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/cart/:id  — set quantity (or remove if zero)
export const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;
    if (typeof quantity !== "number")
      return res.status(400).json({ message: "quantity is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cartItems.find(
      (ci) => ci.product.toString() === productId
    );
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    if (quantity <= 0) {
      user.cartItems = user.cartItems.filter(
        (ci) => ci.product.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }
    await user.save();

    const updated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(updated.cartItems);
  } catch (err) {
    console.error("updateQuantity error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/cart   — remove a single product
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ message: "productId is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cartItems = user.cartItems.filter(
      (ci) => ci.product.toString() !== productId
    );
    await user.save();

    const updated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(updated.cartItems);
  } catch (err) {
    console.error("removeFromCart error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/cart/clear — remove all items
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cartItems = [];
    await user.save();
    return res.json([]);
  } catch (err) {
    console.error("clearCart error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
