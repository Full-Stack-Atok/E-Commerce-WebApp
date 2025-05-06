// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

const CLIENT_URL = process.env.CLIENT_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
// Exchange rate: how many PHP in 1 USD
const PHP_USD_RATE = parseFloat(process.env.PHP_USD_RATE) || 50;

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, paymentMethod } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    // 1) Total in centavos (PHP)
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

    // 3A) Cash on Delivery
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
        // dummy unique to satisfy stripeSessionId index
        stripeSessionId: `${req.user._id}-${Date.now()}`,
      });

      return res.status(200).json({
        offline: true,
        orderId: order._id,
        total: order.totalAmount,
      });
    }

    // 3B) Stripe Checkout (Card or PayPal)
    const isPayPal = paymentMethod === "paypal";
    const stripeCurrency = isPayPal ? "usd" : "php";
    const stripeMethods = isPayPal ? ["paypal"] : ["card"];

    // Build line items, converting PHP → USD cents if needed
    const line_items = products.map((prod) => {
      const pricePhp = Number(prod.price);
      const unit_amount = isPayPal
        ? Math.round((pricePhp / PHP_USD_RATE) * 100) // USD cents
        : Math.round(pricePhp * 100); // PHP centavos

      return {
        price_data: {
          currency: stripeCurrency,
          unit_amount,
          product_data: { name: prod.name, images: [prod.image] },
        },
        quantity: prod.quantity,
      };
    });

    // Apply Stripe coupon if used
    let stripeCouponId = null;
    if (couponCode) {
      const { discountPercentage } = await Coupon.findOne({ code: couponCode });
      const sc = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",
      });
      stripeCouponId = sc.id;
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: stripeMethods,
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
        currency: stripeCurrency,
      },
    });

    // Auto-gift coupon for big spenders (PHP total)
    if (totalPhpCents >= 20000) {
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
      .json({ id: session.id, totalAmount: session.amount_total / 100 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res.status(500).json({
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
        paymentMethod:
          session.payment_method_types[0] === "paypal" ? "paypal" : "card",
        paymentStatus: "paid",
        stripeSessionId: sessionId,
      });
      await newOrder.save();
      return res.status(200).json({ success: true, orderId: newOrder._id });
    }

    return res.status(400).json({ message: "Payment not completed" });
  } catch (error) {
    console.error("Error finalizing checkout:", error);
    return res.status(500).json({
      message: "Error processing success",
      error: error.message,
    });
  }
};
