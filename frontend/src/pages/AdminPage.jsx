import React, { useState, useEffect, Suspense, lazy } from "react";
import { PlusCircle, ShoppingBasket, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CreateProductForm from "../components/CreateProductForm";
import { useProductStore } from "../stores/useProductStore";

const ProductList = lazy(() => import("../components/ProductList"));
const AnalyticsTab = lazy(() => import("../components/AnalyticsTab"));

const TABS = [
  { id: "create", label: "Create Product", Icon: PlusCircle },
  { id: "products", label: "Products", Icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", Icon: BarChart },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const fadeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <motion.h1
        className="text-4xl font-bold text-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Admin Dashboard
      </motion.h1>

      {/* Tabs */}
      <div role="tablist" className="flex justify-center space-x-4">
        {TABS.map(({ id, label, Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-md transition-colors
                ${
                  selected
                    ? "border-b-2 border-sky-500 text-white"
                    : "text-gray-400 hover:text-white"
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels: normal flow (no fixed height) */}
      <AnimatePresence initial={false} mode="sync">
        {activeTab === "create" && (
          <motion.div key="create" {...fadeProps} role="tabpanel">
            <CreateProductForm />
          </motion.div>
        )}

        {activeTab === "products" && (
          <motion.div key="products" {...fadeProps} role="tabpanel">
            <Suspense
              fallback={<p className="text-center text-gray-400">Loading…</p>}
            >
              <ProductList />
            </Suspense>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div key="analytics" {...fadeProps} role="tabpanel">
            <Suspense
              fallback={<p className="text-center text-gray-400">Loading…</p>}
            >
              <AnalyticsTab />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
