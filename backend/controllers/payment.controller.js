import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

// Use your CLIENT_URL for hash‐based routing
const CLIENT_URL = process.env.CLIENT_URL;

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    // Build Stripe line items in PHP centavos
    const line_items = products.map((product) => {
      const price = Number(product.price);
      const quantity = Number(product.quantity) || 1;
      if (isNaN(price) || price <= 0) {
        throw new Error(`Invalid price for product "${product.name}"`);
      }
      const amount = Math.round(price * 100);
      totalAmount += amount * quantity;

      return {
        price_data: {
          currency: "php",
          unit_amount: amount,
          product_data: {
            name: product.name,
            images: [product.image],
          },
        },
        quantity,
      };
    });

    // Apply coupon discount if provided
    let stripeCouponId = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        const discountAmount = Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
        totalAmount -= discountAmount;
        const stripeCoupon = await stripe.coupons.create({
          percent_off: coupon.discountPercentage,
          duration: "once",
        });
        stripeCouponId = stripeCoupon.id;
      }
    }

    // Create the Stripe Checkout Session with hash‐based URLs
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${CLIENT_URL}/#/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/#/purchase-cancel`,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Auto-gift a coupon for large orders
    if (totalAmount >= 20000) {
      await Coupon.findOneAndDelete({ userId: req.user._id });
      await new Coupon({
        code: "GIFT" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: req.user._id,
      }).save();
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({
      message: "Error processing checkout",
      error: error.message,
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Deactivate used coupon
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // Create Order document
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((p) => ({
          product: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      res.status(200).json({ success: true, orderId: newOrder._id });
    } else {
      res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error finalizing checkout:", error);
    res
      .status(500)
      .json({ message: "Error finalizing checkout", error: error.message });
  }
};
