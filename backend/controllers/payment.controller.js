// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import { ewalletClient } from "../lib/xendit.js";

const CLIENT_URL = process.env.CLIENT_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod, phone } = req.body;

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

    // 2) Apply coupon if provided
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

    // 3A) GCash via Xendit
    if (paymentMethod === "gcash") {
      if (!phone) {
        return res
          .status(400)
          .json({ error: "Phone number required for GCash" });
      }

      // create a pending order (NO stripeSessionId here)
      let order = await Order.create({
        user: req.user._id,
        products: products.map((p) => ({
          product: p._id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: totalAmount / 100,
        paymentMethod: "gcash",
        paymentStatus: "pending",
      });

      // HACK: assign a unique stripeSessionId so it doesn't collide
      order.stripeSessionId = order._id.toString();
      await order.save();

      // create sandbox GCash charge
      const charge = await ewalletClient.create({
        referenceID: order._id.toString(),
        currency: "PHP",
        amount: totalAmount,
        checkoutMethod: "ONE_TIME_PAYMENT",
        channelCode: "GCASH",
        phone,
        metadata: { orderId: order._id.toString() },
        callbackURL: `${CLIENT_URL}/api/payments/gcash/callback`,
        redirectURL: `${FRONTEND_URL}/#/purchase-success?orderId=${order._id}&offline=true`,
      });

      return res.status(200).json({
        checkoutUrl: charge.actions.mobile_web_checkout_url,
      });
    }

    // 3B) Cash on Delivery
    if (paymentMethod === "cod") {
      let order = await Order.create({
        user: req.user._id,
        products: products.map((p) => ({
          product: p._id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: totalAmount / 100,
        paymentMethod: "cod",
        paymentStatus: "paid",
      });

      // HACK: assign a unique stripeSessionId so it doesn't collide
      order.stripeSessionId = order._id.toString();
      await order.save();

      return res.status(200).json({
        offline: true,
        orderId: order._id,
        total: order.totalAmount,
      });
    }

    // 3C) Stripe card checkout
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

// finalize Stripe card payments
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
        paymentMethod: "card",
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

// Xendit webhook for GCash success
export const handleGCashCallback = async (req, res) => {
  try {
    const evt = req.body;
    if (evt.type === "EWallet.charge.completed") {
      const { referenceID, status } = evt.data;
      if (status === "COMPLETED") {
        const order = await Order.findById(referenceID);
        if (order) {
          order.paymentStatus = "paid";
          await order.save();
        }
      }
    }
    return res.status(200).end();
  } catch (err) {
    console.error("GCash callback error:", err);
    return res.status(500).end();
  }
};
