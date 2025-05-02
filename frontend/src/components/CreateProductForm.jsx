// src/components/CreateProductForm.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  "Jeans",
  "T-Shirts",
  "Shoes",
  "Glasses",
  "Jackets",
  "Suits",
  "Bags",
  "Gadgets",
];

export default function CreateProductForm() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });
  const { createProduct, loading } = useProductStore();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createProduct(form);
    setForm({ name: "", description: "", price: "", category: "", image: "" });
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold text-slate-200 mb-6">
        Create New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full bg-gray-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
              placeholder="Ex. Classic Denim Jeans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Price (₱)
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="mt-1 w-full bg-gray-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            required
            className="mt-1 w-full bg-gray-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
            placeholder="Short product description…"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="mt-1 w-full bg-gray-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Image upload + preview */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Product Image
          </label>
          <div className="flex items-center gap-4">
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-4 py-2 bg-gray-700 border border-slate-600 rounded-md cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <Upload className="w-5 h-5 mr-2 text-slate-300" />
              <span className="text-sm text-slate-200">Choose File</span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {form.image && (
              <img
                src={form.image}
                alt="Preview"
                className="h-16 w-16 rounded object-cover border border-slate-600"
              />
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              Saving…
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
