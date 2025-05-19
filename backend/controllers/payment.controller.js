// backend/controllers/payment.controller.js

import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import { paypalClient } from "../lib/paypal.js";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const CLIENT_URL = process.env.CLIENT_URL;

// Helper to coerce missing/malformed products into an array
const normalizeProducts = (products) =>
  Array.isArray(products) ? products : [];

// 1) Create Stripe Checkout (cards) or COD
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod } = req.body;
    const items = normalizeProducts(products);

    if (items.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    // Calculate total in centavos
    let totalPhpCents = items.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      return sum + Math.round(price * 100) * qty;
    }, 0);

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        const discount = Math.round(
          (totalPhpCents * coupon.discountPercentage) / 100
        );
        totalPhpCents -= discount;
        coupon.isActive = false;
        await coupon.save();
      }
    }

    // Cash on Delivery branch
    if (paymentMethod === "cod") {
      const order = await Order.create({
        user: req.user._id,
        products: items.map((p) => ({
          product: p.id || p._id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: totalPhpCents / 100,
        paymentMethod: "cod",
        paymentStatus: "paid",
        stripeSessionId: `${req.user._id}-${Date.now()}`,
      });

      return res.json({
        offline: true,
        orderId: order._id,
        total: order.totalAmount,
      });
    }

    // Stripe Checkout for cards
    const line_items = items.map((p) => ({
      price_data: {
        currency: "php",
        unit_amount: Math.round(Number(p.price) * 100),
        product_data: { name: p.name, images: [p.image] },
      },
      quantity: p.quantity,
    }));

    let stripeCouponId = null;
    if (couponCode) {
      const couponDoc = await Coupon.findOne({ code: couponCode });
      if (couponDoc) {
        const sc = await stripe.coupons.create({
          percent_off: couponDoc.discountPercentage,
          duration: "once",
        });
        stripeCouponId = sc.id;
      }
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
        coupon: couponCode || "",
        products: JSON.stringify(
          items.map((p) => ({
            id: p.id || p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Auto-gift coupon for big spenders
    if (totalPhpCents >= 20_000) {
      await Coupon.deleteMany({ userId: req.user._id, isActive: true });
      await Coupon.create({
        code: `GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: req.user._id,
      });
    }

    return res.json({
      id: session.id,
      totalAmount: session.amount_total / 100,
    });
  } catch (err) {
    console.error("Error processing checkout:", err);
    return res.status(500).json({
      message: "Error processing checkout",
      error: err.message,
    });
  }
};

// 2) Capture Stripe payment & create your Order
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "Missing sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Stripe payment not completed" });
    }

    const metadata = session.metadata || {};
    const couponCode = metadata.coupon || "";
    const productsMeta = JSON.parse(metadata.products || "[]");

    // Recompute total for safety
    let totalPhpCents = productsMeta.reduce((sum, p) => {
      return sum + Math.round(Number(p.price) * 100) * (p.quantity || 1);
    }, 0);
    if (couponCode) {
      const c = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
      });
      if (c) {
        const discount = Math.round(
          (totalPhpCents * c.discountPercentage) / 100
        );
        totalPhpCents -= discount;
      }
    }

    const order = await Order.create({
      user: req.user._id,
      products: productsMeta.map((p) => ({
        product: p.id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: totalPhpCents / 100,
      paymentMethod: "card",
      paymentStatus: "paid",
      stripeSessionId: sessionId,
    });

    res.json({ orderId: order._id });
  } catch (err) {
    console.error("checkoutSuccess error:", err);
    res.status(500).json({
      message: "Failed to finalize Stripe order",
      error: err.message,
    });
  }
};

// 3) PayPal: create order
export const createPayPalOrder = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    const items = normalizeProducts(products);

    if (items.length === 0) {
      return res.status(400).json({ message: "No products provided" });
    }

    let totalPhpCents = items.reduce((sum, p) => {
      return sum + Math.round(Number(p.price) * 100) * (p.quantity || 1);
    }, 0);

    if (couponCode) {
      const c = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (c) {
        const discount = Math.round(
          (totalPhpCents * c.discountPercentage) / 100
        );
        totalPhpCents -= discount;
        c.isActive = false;
        await c.save();
      }
    }

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "PHP",
            value: (totalPhpCents / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${CLIENT_URL}/#/purchase-success?paypal=true`,
        cancel_url: `${CLIENT_URL}/#/purchase-cancel`,
      },
    });

    const { result } = await paypalClient.execute(request);
    res.json({ id: result.id });
  } catch (err) {
    console.error("createPayPalOrder error:", err);
    res.status(500).json({
      message: "Failed to create PayPal order",
      error: err.message,
    });
  }
};

// 4) PayPal: capture order
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID, products, couponCode } = req.body;

    if (!orderID) {
      return res.status(400).json({ message: "Missing orderID" });
    }

    const items = normalizeProducts(products);
    if (items.length === 0) {
      return res.status(400).json({ message: "Missing products for order" });
    }

    // 1) Capture with PayPal
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const { result } = await paypalClient.execute(request);

    if (result.status !== "COMPLETED") {
      return res.status(400).json({ message: "PayPal payment not completed" });
    }

    // 2) Recompute total and reapply coupon
    let totalPhpCents = items.reduce((sum, p) => {
      return sum + Math.round(Number(p.price) * 100) * (p.quantity || 1);
    }, 0);
    if (couponCode) {
      const c = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
      });
      if (c) {
        const discount = Math.round(
          (totalPhpCents * c.discountPercentage) / 100
        );
        totalPhpCents -= discount;
      }
    }

    // 3) Persist without stripeSessionId
    const order = await Order.create({
      user: req.user._id,
      products: items.map((p) => ({
        product: p.id || p._id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: totalPhpCents / 100,
      paymentMethod: "paypal",
      paymentStatus: "paid",
      // stripeSessionId omitted entirely
    });

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("capturePayPalOrder error:", err);
    if (err._originalError?.text) {
      console.error("→ PayPal raw response:", err._originalError.text);
    }
    res.status(500).json({
      message: "Failed to capture PayPal order",
      error: err.message,
    });
  }
};
