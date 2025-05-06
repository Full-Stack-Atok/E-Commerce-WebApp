// src/components/ProductList.jsx
import React from "react";
import { FixedSizeList as List } from "react-window";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

// Height of each “row” in pixels
const ROW_HEIGHT = 64;

export default function ProductList() {
  const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();
  const itemCount = products.length;
  const listHeight = Math.min(ROW_HEIGHT * 10, ROW_HEIGHT * itemCount);

  // Render one row
  const Row = ({ index, style }) => {
    const product = products[index];
    const bg = index % 2 === 0 ? "bg-gray-800" : "bg-gray-900";

    return (
      <div
        style={style}
        className={`${bg} hover:bg-gray-700 transition-colors flex items-center px-6`}
      >
        {/* Product cell */}
        <div className="flex-1 flex items-center gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-white">{product.name}</span>
        </div>

        {/* Price */}
        <div className="w-24 text-sm text-gray-300">
          ₱{product.price.toFixed(2)}
        </div>

        {/* Category */}
        <div className="w-32 text-sm text-gray-300">{product.category}</div>

        {/* Featured toggle */}
        <button
          onClick={() => toggleFeaturedProduct(product._id)}
          aria-label={
            product.isFeatured ? "Unmark as featured" : "Mark as featured"
          }
          className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            product.isFeatured
              ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          }`}
        >
          <Star className="h-5 w-5" />
        </button>

        {/* Delete */}
        <button
          onClick={() => deleteProduct(product._id)}
          aria-label="Delete product"
          className="p-1 rounded-full text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors ml-4"
        >
          <Trash className="h-5 w-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg max-w-6xl mx-auto overflow-hidden">
      {/* Sticky header */}
      <div className="bg-gray-700 text-gray-300 grid grid-cols-[1fr_6rem_8rem_auto_auto] px-6 py-3 uppercase text-xs font-semibold tracking-wide sticky top-0 z-10">
        <div>Product</div>
        <div>Price</div>
        <div>Category</div>
        <div>Featured</div>
        <div>Actions</div>
      </div>

      {/* Virtualized list */}
      <List
        height={listHeight}
        itemCount={itemCount}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={5} // ← render 5 extra off-screen items
        itemKey={(index) => products[index]._id} // ← stable per-item key
      >
        {Row}
      </List>
    </div>
  );
}
