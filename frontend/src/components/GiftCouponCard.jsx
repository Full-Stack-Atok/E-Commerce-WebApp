import { motion } from "framer-motion";
import { Ticket, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
  const [userInputCode, setUserInputCode] = useState("");

  const coupon = useCartStore((state) => state.coupon);
  const isCouponApplied = useCartStore((state) => state.isCouponApplied);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const getMyCoupon = useCartStore((state) => state.getMyCoupon);

  useEffect(() => {
    if (typeof getMyCoupon === "function") {
      getMyCoupon();
    }
  }, [getMyCoupon]);

  useEffect(() => {
    if (coupon) setUserInputCode(coupon.code);
  }, [coupon]);

  const handleApplyCoupon = () => {
    if (!userInputCode.trim()) return;
    applyCoupon(userInputCode);
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setUserInputCode("");
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-white bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Input */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="voucher"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Do you have a voucher or gift card?
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-sky-500 focus:ring-sky-500"
            placeholder="Enter code here"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
            required
          />
        </div>
        <motion.button
          onClick={handleApplyCoupon}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex w-full items-center justify-center rounded-lg bg-slate-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300"
        >
          <Ticket className="mr-2" size={16} />
          Apply Code
        </motion.button>
      </div>

      {/* Applied Coupon */}
      {isCouponApplied && coupon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-700 border border-emerald-500 rounded-lg p-4 space-y-1"
        >
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">{coupon.code}</span>
            <motion.button
              onClick={handleRemoveCoupon}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash size={16} />
              Remove
            </motion.button>
          </div>
          <p className="text-gray-300 text-sm">
            {coupon.discountPercentage}% off applied!
          </p>
        </motion.div>
      )}

      {/* Available Coupon (if not applied yet) */}
      {!isCouponApplied && coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">
            Your Available Coupon:
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default GiftCouponCard;
