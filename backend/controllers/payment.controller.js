// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import { paypalClient } from "../lib/paypal.js";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const CLIENT_URL = process.env.CLIENT_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ———————————————————————————————————————————————
//  A) Stripe + COD flows (existing)
// ———————————————————————————————————————————————

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    // 1) Compute PHP total in centavos
    let totalPhpCents = 0;
    for (const p of products) {
      const price = Number(p.price);
      const quantity = Number(p.quantity) || 1;
      if (isNaN(price) || price <= 0) {
        throw new Error(`Invalid price for product "${p.name}"`);
      }
      totalPhpCents += Math.round(price * 100) * quantity;
    }

    // 2) Apply coupon (PHP)
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
        await Coupon.findOneAndUpdate(
          { code: couponCode, userId: req.user._id },
          { isActive: false }
        );
      }
    }

    // 3A) Cash on Delivery (offline)
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
        stripeSessionId: `${req.user._id}-${Date.now()}`, // dummy unique
      });
      return res.json({
        offline: true,
        orderId: order._id,
        total: order.totalAmount,
      });
    }

    // 3B) Stripe Checkout (cards only)
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
      const { discountPercentage } = await Coupon.findOne({ code: couponCode });
      const sc = await stripe.coupons.create({
        percent_off: discountPercentage,
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

    // Auto-gift coupon for big spenders
    if (totalPhpCents >= 20000) {
      await Coupon.findOneAndDelete({ userId: req.user._id });
      await new Coupon({
        code: `GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: req.user._id,
      }).save();
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

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // deactivate coupon
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
      const order = new Order({
        user: session.metadata.userId,
        products: items.map((i) => ({
          product: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount: session.amount_total / 100,
        paymentMethod: "card",
        paymentStatus: "paid",
        stripeSessionId: sessionId,
      });
      await order.save();
      return res.json({ success: true, orderId: order._id });
    }
    return res.status(400).json({ message: "Payment not completed" });
  } catch (err) {
    console.error("Error finalizing checkout:", err);
    return res.status(500).json({
      message: "Error finalizing checkout",
      error: err.message,
    });
  }
};

// ———————————————————————————————————————————————
//  B) PayPal-native flows (new)
// ———————————————————————————————————————————————

export const createPayPalOrder = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    // total + coupon logic (same as above)…
    let totalPhpCents = 0;
    for (const p of products) {
      totalPhpCents += Math.round(Number(p.price) * 100) * (p.quantity || 1);
    }
    if (couponCode) {
      const c = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      const discount = Math.round((totalPhpCents * c.discountPercentage) / 100);
      totalPhpCents -= discount;
      await Coupon.findOneAndUpdate(
        { code: couponCode, userId: req.user._id },
        { isActive: false }
      );
    }

    // build PayPal order
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
        return_url: `${FRONTEND_URL}/#/purchase-success?paypal=true`,
        cancel_url: `${FRONTEND_URL}/#/purchase-cancel`,
      },
    });

    const { result } = await paypalClient.execute(request);
    return res.json({ id: result.id });
  } catch (err) {
    console.error("createPayPalOrder error:", err);
    return res.status(500).json({
      message: "Failed to create PayPal order",
      error: err.message,
    });
  }
};

export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID, products, couponCode } = req.body;

    // capture
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const { result } = await paypalClient.execute(request);
    if (result.status !== "COMPLETED") {
      return res.status(400).json({ message: "PayPal payment not completed" });
    }

    // record in your DB
    let totalPhpCents = 0;
    products.forEach((p) => {
      totalPhpCents += Math.round(Number(p.price) * 100) * p.quantity;
    });
    if (couponCode) {
      const c = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
      });
      totalPhpCents -= Math.round((totalPhpCents * c.discountPercentage) / 100);
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

    return res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("capturePayPalOrder error:", err);
    return res.status(500).json({
      message: "Failed to capture PayPal order",
      error: err.message,
    });
  }
};
