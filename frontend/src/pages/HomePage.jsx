// src/pages/HomePage.jsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import CategoryItem from "../components/CategoryItem";
import FeaturedProducts from "../components/FeaturedProducts";
import LoadingSpinner from "../components/LoadingSpinner";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
  { href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
  { href: "/gadgets", name: "Gadgets", imageUrl: "/gadgets.png" },
];

// simple variants to stagger children
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { fetchFeaturedProducts, products, isLoading } = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Main headline */}
        <motion.h1
          variants={item}
          className="text-center text-5xl sm:text-6xl font-bold text-slate-100 mb-4"
        >
          Explore Our Categories
        </motion.h1>

        <motion.p
          variants={item}
          className="text-center text-xl text-slate-200 mb-12"
        >
          Discover the latest trends in eco-friendly fashion
        </motion.p>

        {/* Categories Grid */}
        <motion.ul
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {categories.map((cat) => (
            <motion.li key={cat.name} variants={item}>
              <CategoryItem category={cat} />
            </motion.li>
          ))}
        </motion.ul>

        {/* Featured Products */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : products.length > 0 ? (
          <>
            <motion.h2
              variants={item}
              className="text-4xl font-semibold text-slate-100 mb-6"
            >
              Featured Products
            </motion.h2>
            <FeaturedProducts featuredProducts={products} />
          </>
        ) : null}
      </motion.div>
    </section>
  );
}
