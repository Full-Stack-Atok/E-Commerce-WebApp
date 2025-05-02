// src/components/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = ({ overlay = true }) => {
  return (
    <div
      role="status"
      className={`${
        overlay
          ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70"
          : "flex items-center justify-center"
      }`}
    >
      <div className="relative w-16 h-16">
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />

        {/* Spinning top border */}
        <div className="absolute inset-0 rounded-full border-4 border-t-4 border-sky-500 animate-spin" />

        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
