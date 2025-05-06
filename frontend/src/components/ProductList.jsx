// src/components/ProductList.jsx
import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const HEADER_HEIGHT = 48; // height of your sticky table header
const NAVBAR_HEIGHT = 64; // height of your site navbar (adjust if needed)
const ROW_HEIGHT = 64; // height of each row
const BOTTOM_SPACING = 64; // extra padding at bottom so last row isn't flush

// memoized Row to avoid re-renders
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

export default function ProductList() {
  const { products, toggleFeaturedProduct, deleteProduct } = useProductStore();
  const itemData = { products, toggleFeaturedProduct, deleteProduct };

  return (
    <div
      className="max-w-6xl mx-auto bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col"
      style={{
        // make container exactly the screen height minus your navbar
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      {/* Sticky header */}
      <div
        className="bg-gray-700 text-gray-300 grid grid-cols-[1fr_6rem_8rem_auto_auto] items-center px-6 flex-shrink-0"
        style={{ height: HEADER_HEIGHT }}
      >
        {["Product", "Price", "Category", "Featured", "Actions"].map((h) => (
          <div
            key={h}
            className="uppercase text-xs font-semibold tracking-wide"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Virtualized list flexes to fill */}
      <div className="flex-1 relative">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={products.length}
              itemSize={ROW_HEIGHT}
              overscanCount={10} // render extra rows for super-smooth scroll
              itemKey={(index) => products[index]._id}
              itemData={itemData}
              style={{ paddingBottom: BOTTOM_SPACING }}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
