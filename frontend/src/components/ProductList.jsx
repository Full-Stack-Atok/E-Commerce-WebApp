// src/components/ProductList.jsx
import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

// Memoized row
const Row = React.memo(({ index, style, data }) => {
  const { products, toggleFeaturedProduct, deleteProduct } = data;
  const p = products[index];
  const bg = index % 2 === 0 ? "bg-gray-800" : "bg-gray-900";

  return (
    <div
      style={style}
      className={`${bg} hover:bg-gray-700 transition-colors grid grid-cols-[1fr_6rem_8rem_auto_auto] items-center px-6`}
    >
      <div className="flex items-center gap-4">
        <img
          src={p.image}
          alt={p.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="text-sm font-medium text-white">{p.name}</span>
      </div>
      <div className="text-sm text-gray-300">₱{p.price.toFixed(2)}</div>
      <div className="text-sm text-gray-300">{p.category}</div>
      <button
        onClick={() => toggleFeaturedProduct(p._id)}
        aria-label={p.isFeatured ? "Unmark as featured" : "Mark as featured"}
        className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          p.isFeatured
            ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
            : "bg-gray-600 text-gray-300 hover:bg-gray-500"
        }`}
      >
        <Star className="h-5 w-5" />
      </button>
      <button
        onClick={() => deleteProduct(p._id)}
        aria-label="Delete product"
        className="p-1 rounded-full text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
      >
        <Trash className="h-5 w-5" />
      </button>
    </div>
  );
});

// Custom inner element to add bottom padding
const InnerContainer = React.forwardRef(({ style, ...rest }, ref) => (
  <div
    ref={ref}
    style={{ ...style, paddingBottom: 24 }} // extra space at bottom
    {...rest}
  />
));

export default function ProductList() {
  const { products, toggleFeaturedProduct, deleteProduct } = useProductStore();
  const itemData = { products, toggleFeaturedProduct, deleteProduct };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-6xl mx-auto bg-gray-800 shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-700 text-gray-300 grid grid-cols-[1fr_6rem_8rem_auto_auto] items-center px-6 h-12">
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

      {/* List */}
      <div className="flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={products.length}
              itemSize={64}
              overscanCount={10}
              itemKey={(index) => products[index]._id}
              itemData={itemData}
              innerElementType={InnerContainer}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
