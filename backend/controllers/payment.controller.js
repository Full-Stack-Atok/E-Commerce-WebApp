// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

// Base URL of your client, loaded from env
const CLIENT_URL = process.env.CLIENT_URL;

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    // 1) Calculate total in centavos
    let totalAmount = 0;
    products.forEach((p) => {
      const price = Number(p.price);
      const quantity = Number(p.quantity) || 1;
      if (isNaN(price) || price <= 0) {
        throw new Error(`Invalid price for product "${p.name}"`);
      }
      totalAmount += Math.round(price * 100) * quantity;
    });

    // 2) Apply coupon if any
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        const discount = Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
        totalAmount -= discount;
        await Coupon.findOneAndUpdate(
          { code: couponCode, userId: req.user._id },
          { isActive: false }
        );
      }
    }

    // 3) OFFLINE FLOW (GCash or COD)
    if (paymentMethod === "gcash" || paymentMethod === "cod") {
      const newOrder = await Order.create({
        user: req.user._id,
        products: products.map((p) => ({
          product: p._id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: totalAmount / 100,
        paymentMethod, // "gcash" or "cod"
        paymentStatus: "paid", // auto-paid
        stripeSessionId: null,
      });

      // Auto-gift coupon if over threshold
      if (totalAmount >= 20000) {
        await Coupon.findOneAndDelete({ userId: req.user._id });
        await new Coupon({
          code: `GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          discountPercentage: 10,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: req.user._id,
        }).save();
      }

      return res.status(200).json({
        offline: true,
        orderId: newOrder._id,
        total: newOrder.totalAmount,
      });
    }

    // 4) STRIPE FLOW (cards only)
    const line_items = products.map((product) => {
      const amount = Math.round(Number(product.price) * 100);
      return {
        price_data: {
          currency: "php",
          unit_amount: amount,
          product_data: {
            name: product.name,
            images: [product.image],
          },
        },
        quantity: product.quantity,
      };
    });

    let stripeCouponId = null;
    if (couponCode) {
      const percent = (await Coupon.findOne({ code: couponCode }))
        .discountPercentage;
      const sc = await stripe.coupons.create({
        percent_off: percent,
        duration: "once",
      });
      stripeCouponId = sc.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${CLIENT_URL}/#/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/#/purchase-cancel?session_id={CHECKOUT_SESSION_ID}`,
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

    // Auto-gift coupon on Stripe flow too
    if (totalAmount >= 20000) {
      await Coupon.findOneAndDelete({ userId: req.user._id });
      await new Coupon({
        code: `GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: req.user._id,
      }).save();
    }

    return res
      .status(200)
      .json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      const items = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: items.map((i) => ({
          product: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount: session.amount_total / 100,
        paymentMethod: "card", // explicitly mark card-paid
        paymentStatus: "paid",
        stripeSessionId: sessionId,
      });
      await newOrder.save();

      return res.status(200).json({ success: true, orderId: newOrder._id });
    }

    return res.status(400).json({ message: "Payment not completed" });
  } catch (error) {
    console.error("Error finalizing checkout:", error);
    return res
      .status(500)
      .json({ message: "Error finalizing checkout", error: error.message });
  }
};
