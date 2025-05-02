// src/components/AnalyticsTab.jsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios.js";
import { Users, Package, ShoppingCart, PhilippinePesoIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// custom hook to fetch analytics
function useAnalytics() {
  const [data, setData] = useState({
    analytics: { users: 0, products: 0, totalSales: 0, totalRevenue: 0 },
    daily: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/analytics")
      .then((res) => {
        if (!cancelled) {
          setData({
            analytics: res.data.analyticsData,
            daily: res.data.dailySalesData,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Failed to load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}

// number formatter
const fmt = new Intl.NumberFormat("en-PH", {
  style: "decimal",
  minimumFractionDigits: 0,
});

export default function AnalyticsTab() {
  const { analytics, daily, loading, error } = useAnalytics();

  if (loading) {
    // skeleton state
    return (
      <div className="max-w-7xl mx-auto p-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (error) {
    // error state
    return (
      <div className="max-w-7xl mx-auto p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Users"
          value={fmt.format(analytics.users)}
          Icon={Users}
          gradient="from-indigo-500 via-purple-500 to-pink-500"
        />
        <AnalyticsCard
          title="Total Products"
          value={fmt.format(analytics.products)}
          Icon={Package}
          gradient="from-green-500 via-teal-500 to-cyan-500"
        />
        <AnalyticsCard
          title="Total Sales"
          value={fmt.format(analytics.totalSales)}
          Icon={ShoppingCart}
          gradient="from-yellow-500 via-orange-500 to-red-500"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`₱${fmt.format(analytics.totalRevenue)}`}
          Icon={PhilippinePesoIcon}
          gradient="from-emerald-500 via-lime-500 to-green-300"
        />
      </div>

      {/* chart */}
      <motion.div
        className="bg-gray-800 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={daily}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              stroke="#10B981"
              tick={{ fontSize: 12 }}
              label={{
                value: "Sales",
                angle: -90,
                position: "insideLeft",
                fill: "#10B981",
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#3B82F6"
              tick={{ fontSize: 12 }}
              label={{
                value: "Revenue",
                angle: 90,
                position: "insideRight",
                fill: "#3B82F6",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Legend verticalAlign="top" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/**
 * AnalyticsCard
 * Props:
 *  - title: string
 *  - value: string
 *  - Icon: React component
 *  - gradient: tailwind gradient classes
 */
const AnalyticsCard = ({ title, value, Icon, gradient }) => (
  <motion.div
    className={`
      relative overflow-hidden rounded-lg p-6 shadow-lg
      bg-gradient-to-br ${gradient}
      hover:scale-105 transform transition-all duration-300
    `}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative z-10">
      <p className="text-gray-200 text-sm font-semibold">{title}</p>
      <h3 className="text-white text-3xl font-bold mt-1">{value}</h3>
    </div>
    <div className="absolute inset-0 opacity-20">
      <Icon className="h-40 w-40 text-white rotate-45" />
    </div>
  </motion.div>
);
