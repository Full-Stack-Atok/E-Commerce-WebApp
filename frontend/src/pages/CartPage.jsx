// src/pages/CartPage.jsx
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";

const CartPage = () => {
  const { cart } = useCartStore();

  return (
    <div className="py-8 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <AnimatePresence mode="wait">
          {cart.length === 0 ? (
            <EmptyCartUI key="empty" />
          ) : (
            <motion.div
              key="filled"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* main column: cart items + recommendations */}
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item) => (
                  <CartItem key={item._id} item={item} />
                ))}

                {/* only show recommendations if we have items */}
                <PeopleAlsoBought />
              </div>

              {/* sidebar: order summary + coupon */}
              <aside className="space-y-6 lg:sticky lg:top-24">
                <OrderSummary />
                <GiftCouponCard />
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartPage;

const EmptyCartUI = () => (
  <motion.div
    key="empty"
    className="flex flex-col items-center justify-center space-y-4 py-16 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.4 }}
  >
    <ShoppingCart className="h-24 w-24 text-gray-400" />
    <h3 className="text-2xl font-semibold text-gray-200">Your cart is empty</h3>
    <p className="text-gray-400">
      Looks like you haven’t added anything to your cart yet.
    </p>
    <Link
      to="/"
      className="mt-4 rounded-md bg-slate-600 px-6 py-2 text-white hover:bg-slate-700 transition"
    >
      Start Shopping
    </Link>
  </motion.div>
);
