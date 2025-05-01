import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    // Extract product IDs from cartItems
    const productIds = req.user.cartItems.map((item) => item.product);

    // Fetch the corresponding product documents
    const products = await Product.find({ _id: { $in: productIds } });

    // Add quantity to each product
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) =>
          cartItem.product &&
          cartItem.product.toString() === product._id.toString()
      );

      return {
        ...product.toObject(), // Ensures _id is preserved
        quantity: item?.quantity || 1,
      };
    });

    res.json(cartItems);
  } catch (error) {
    console.error("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    const user = req.user;

    // Check if the product already exists in the cart
    const existingItem = user.cartItems.find(
      (item) => item?.product?.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      // Add a new product with a quantity of 1
      user.cartItems.push({ product: productId, quantity: 1 });
    }

    await user.save();
    return res.json({ message: "Product added to cart", cart: user.cartItems });
  } catch (error) {
    console.error("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      // Clear all items from cart
      user.cartItems = [];
      await user.save();
      return res.json({
        message: "All items removed from the cart",
        cart: user.cartItems,
      });
    } else {
      // Remove the specific product from cart
      const initialLength = user.cartItems.length;
      user.cartItems = user.cartItems.filter(
        (item) => item.product && item.product.toString() !== productId
      );

      if (user.cartItems.length === initialLength) {
        return res.status(404).json({ message: "Product not found in cart" });
      }

      await user.save();
      return res.json({
        message: "Product removed from cart",
        cart: user.cartItems,
      });
    }
  } catch (error) {
    console.error("Error in removeAllFromCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    if (!productId || quantity == null) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    }

    const user = req.user;

    // Check for existing item with valid product reference
    const existingItem = user.cartItems.find(
      (item) => item?.product?.toString() === productId
    );

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product.toString() !== productId
        );
      } else {
        existingItem.quantity = quantity;
      }

      await user.save();
      return res.json(user.cartItems);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
