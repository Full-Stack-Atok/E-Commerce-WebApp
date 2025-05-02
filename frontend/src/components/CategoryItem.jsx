// src/components/CategoryItem.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CategoryItem({ category }) {
  return (
    <Link
      to={`/category${category.href}`}
      className="relative block h-96 w-full overflow-hidden rounded-lg shadow-lg group"
    >
      {/* Background image with zoom on hover */}
      <motion.img
        src={category.imageUrl}
        alt={category.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

      {/* Caption block */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h3 className="text-3xl font-bold text-white">{category.name}</h3>
        <p className="mt-1 text-sm text-gray-200">Explore {category.name}</p>
      </motion.div>
    </Link>
  );
}
