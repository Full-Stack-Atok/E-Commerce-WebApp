// backend/controllers/cart.controller.js
import User from "../models/user.model.js";

// GET /api/cart
export const getCartProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "cartItems.product",
      "name price image"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.cartItems);
  } catch (err) {
    console.error("getCartProducts error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/cart
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ message: "productId is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // clean up null entries
    user.cartItems = user.cartItems.filter((ci) => ci && ci.product);

    const existing = user.cartItems.find(
      (ci) => ci.product.toString() === productId
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      user.cartItems.push({ product: productId, quantity: 1 });
    }
    await user.save();

    const populated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(populated.cartItems);
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/cart      (remove a single product)
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

    const populated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(populated.cartItems);
  } catch (err) {
    console.error("removeFromCart error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/cart/:id     (update quantity of a product)
export const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;
    if (quantity == null)
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

    const populated = await user.populate(
      "cartItems.product",
      "name price image"
    );
    return res.json(populated.cartItems);
  } catch (err) {
    console.error("updateQuantity error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// NEW: DELETE /api/cart/clear   (remove *all* items)
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cartItems = [];
    await user.save();

    // return empty array so front-end can repopulate
    res.json([]);
  } catch (err) {
    console.error("clearCart error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
