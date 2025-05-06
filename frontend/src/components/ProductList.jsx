import React, { useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const ROW_HEIGHT = 64; // px
const HEADER_HEIGHT = 48; // px — adjust if your header's height changes

// Memoized row so that once rendered it won't re-render unless its props change
const Row = React.memo(({ index, style, data }) => {
  const { products, toggleFeaturedProduct, deleteProduct } = data;
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
        className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ml-4 ${
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
});

export default function ProductList() {
  const { products, toggleFeaturedProduct, deleteProduct } = useProductStore();
  const itemCount = products.length;

  // Package into one object so Row's React.memo can shallow-compare
  const itemData = {
    products,
    toggleFeaturedProduct,
    deleteProduct,
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg max-w-6xl mx-auto h-[calc(100vh-2rem)]">
      {/* Sticky header */}
      <div
        className="bg-gray-700 text-gray-300 grid grid-cols-[1fr_6rem_8rem_auto_auto] px-6 items-center"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="uppercase text-xs font-semibold tracking-wide">
          Product
        </div>
        <div className="uppercase text-xs font-semibold tracking-wide">
          Price
        </div>
        <div className="uppercase text-xs font-semibold tracking-wide">
          Category
        </div>
        <div className="uppercase text-xs font-semibold tracking-wide">
          Featured
        </div>
        <div className="uppercase text-xs font-semibold tracking-wide">
          Actions
        </div>
      </div>

      {/* AutoSizer + Virtual List */}
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height - HEADER_HEIGHT}
            width={width}
            itemCount={itemCount}
            itemSize={ROW_HEIGHT}
            overscanCount={5}
            itemKey={(index) => products[index]._id}
            itemData={itemData}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
