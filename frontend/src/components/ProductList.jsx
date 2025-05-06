// src/components/ProductList.jsx
import React, { useCallback, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const ROW_HEIGHT = 60; // px

export default function ProductList() {
  const { products, deleteProduct, toggleFeaturedProduct } = useProductStore();

  // wrap callbacks so we don't re-create on every render
  const handleDelete = useCallback((id) => deleteProduct(id), [deleteProduct]);
  const handleToggle = useCallback(
    (id) => toggleFeaturedProduct(id),
    [toggleFeaturedProduct]
  );

  // row renderer for react-window
  const Row = useCallback(
    ({ index, style }) => {
      const product = products[index];
      const bg = index % 2 ? "bg-gray-900" : "bg-gray-800";

      return (
        <div style={style} className={`${bg} flex items-center px-4`}>
          {/* Product */}
          <div className="flex-1 flex items-center">
            <img
              src={product.image}
              alt={product.name}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
            <span className="ml-3 text-sm font-medium text-white">
              {product.name}
            </span>
          </div>

          {/* Price */}
          <div className="w-24 text-right">
            <span className="text-sm text-gray-300">
              ₱{product.price.toFixed(2)}
            </span>
          </div>

          {/* Category */}
          <div className="w-28 text-sm text-gray-300 text-center">
            {product.category}
          </div>

          {/* Featured */}
          <div className="w-20 flex justify-center">
            <button
              onClick={() => handleToggle(product._id)}
              aria-label={
                product.isFeatured ? "Unmark as featured" : "Mark as featured"
              }
              className={`p-1 rounded-full transition ${
                product.isFeatured
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              <Star className="h-5 w-5" />
            </button>
          </div>

          {/* Delete */}
          <div className="w-20 flex justify-center">
            <button
              onClick={() => handleDelete(product._id)}
              aria-label="Delete product"
              className="p-1 rounded-full text-red-400 hover:text-red-300"
            >
              <Trash className="h-5 w-5" />
            </button>
          </div>
        </div>
      );
    },
    [products, handleDelete, handleToggle]
  );

  // memoize item count so List only re-measures when products change
  const itemCount = useMemo(() => products.length, [products]);

  return (
    <div className="max-w-6xl mx-auto border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="hidden md:flex bg-gray-700 text-gray-300 text-xs font-semibold uppercase tracking-wide">
        <div className="flex-1 px-4 py-3">Product</div>
        <div className="w-24 px-4 py-3 text-right">Price</div>
        <div className="w-28 px-4 py-3 text-center">Category</div>
        <div className="w-20 px-4 py-3 text-center">Featured</div>
        <div className="w-20 px-4 py-3 text-center">Actions</div>
      </div>

      {/* Virtualized List */}
      <List
        height={Math.min(ROW_HEIGHT * 10, ROW_HEIGHT * itemCount)} // max 10 rows tall
        itemCount={itemCount}
        itemSize={ROW_HEIGHT}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}
