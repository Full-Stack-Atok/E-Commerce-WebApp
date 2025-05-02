// src/pages/CategoryPage.jsx
import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CategoryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchProductsByCategory, products } = useProductStore();
  const { category } = useParams();

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        await fetchProductsByCategory(category);
      } catch (err) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProductsByCategory, category]);

  const title = category
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <section className="min-h-screen py-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-base font-medium text-slate-300 mb-2 flex items-center">
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-200">{title}</span>
        </nav>

        {/* Page Title */}
        <motion.h1
          className="text-4xl font-bold text-center mb-8 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title}
        </motion.h1>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.p
            className="text-center text-red-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <motion.p
            className="text-center text-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            No products found in this category.
          </motion.p>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <motion.ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {products.map((p) => (
              <motion.li key={p._id} variants={itemVariants}>
                <ProductCard product={p} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  );
}
