// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import { paypalClient } from "../lib/paypal.js";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const CLIENT_URL = process.env.CLIENT_URL;

// 1) Create Stripe Checkout (cards) or COD
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    // Calculate PHP total in centavos
    let totalPhpCents = products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      return sum + Math.round(price * 100) * qty;
    }, 0);

    // Apply coupon
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

    // COD branch
    if (paymentMethod === "cod") {
      const order = await Order.create({
        user: req.user._id,
        products: products.map((p) => ({
          product: p._id,
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

    // Stripe Checkout for Card
    const line_items = products.map((prod) => ({
      price_data: {
        currency: "php",
        unit_amount: Math.round(Number(prod.price) * 100),
        product_data: { name: prod.name, images: [prod.image] },
      },
      quantity: prod.quantity,
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
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Auto-gift coupon for big spenders
    if (totalPhpCents >= 20000) {
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
    return res
      .status(500)
      .json({ message: "Error processing checkout", error: err.message });
  }
};

// 2) Capture Stripe payment or finalize COD
export const checkoutSuccess = async (req, res) => {
  // …your existing Stripe finalize code…
};

// 3) PayPal: create order
export const createPayPalOrder = async (req, res) => {
  console.log("▶ createPayPalOrder body:", req.body);
  try {
    const { products, couponCode } = req.body;

    let totalPhpCents = products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 1;
      return sum + Math.round(price * 100) * qty;
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
    });

    const { result } = await paypalClient.execute(request);
    res.json({ id: result.id });
  } catch (err) {
    console.error("createPayPalOrder error:", err);
    res
      .status(500)
      .json({ message: "Failed to create PayPal order", error: err.message });
  }
};

// 4) PayPal: capture order
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID, products, couponCode } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const { result } = await paypalClient.execute(request);

    // deep-dive error log if it fails
    if (result.status !== "COMPLETED") {
      console.error("✋ PayPal capture not completed:", result);
      return res.status(400).json({ message: "PayPal payment not completed" });
    }

    // Recompute total and save order
    let totalPhpCents = products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      return sum + Math.round(price * 100) * (p.quantity || 1);
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
      products: products.map((p) => ({
        product: p._id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: totalPhpCents / 100,
      paymentMethod: "paypal",
      paymentStatus: "paid",
      stripeSessionId: null,
    });

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("capturePayPalOrder error:", err);
    if (err._originalError?.text) {
      console.error("→ PayPal raw response:", err._originalError.text);
    }
    res
      .status(500)
      .json({ message: "Failed to capture PayPal order", error: err.message });
  }
};
