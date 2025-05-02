// src/components/ProductList.jsx
import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ProductList = () => {
  const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();

  return (
    <motion.div
      className="bg-gray-800 shadow-md rounded-lg overflow-hidden max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <table className="min-w-full divide-y divide-gray-700">
        {/* Sticky header */}
        <thead className="bg-gray-700 sticky top-0">
          <tr>
            {["Product", "Price", "Category", "Featured", "Actions"].map(
              (label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>

        <motion.tbody
          className="bg-gray-800 divide-y divide-gray-700"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {products.map((product, i) => (
            <motion.tr
              key={product._id}
              className={`${
                i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
              } hover:bg-gray-700 transition-colors`}
              variants={rowVariants}
            >
              {/* Product cell */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="ml-4 text-sm font-medium text-white">
                    {product.name}
                  </span>
                </div>
              </td>

              {/* Price */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-300">
                  ₱{product.price.toFixed(2)}
                </span>
              </td>

              {/* Category */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-300">
                  {product.category}
                </span>
              </td>

              {/* Featured toggle */}
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => toggleFeaturedProduct(product._id)}
                  aria-label={
                    product.isFeatured
                      ? "Unmark as featured"
                      : "Mark as featured"
                  }
                  className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    product.isFeatured
                      ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  <Star className="h-5 w-5" />
                </button>
              </td>

              {/* Delete */}
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => deleteProduct(product._id)}
                  aria-label="Delete product"
                  className="p-1 rounded-full text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </motion.div>
  );
};

export default ProductList;
