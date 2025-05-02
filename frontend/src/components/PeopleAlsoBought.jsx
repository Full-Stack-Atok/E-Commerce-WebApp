import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import LoadingSpinner from "./LoadingSpinner";
import axios from "../lib/axios.js";
import toast from "react-hot-toast";

const PeopleAlsoBought = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await axios.get("/products/recommendations");
        setRecommendations(data);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while fetching recommendations"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (isLoading) {
    return (
      <section className="mt-8">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="mt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-semibold text-white mb-6">
          People Also Bought
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <div key={product._id} className="flex justify-center">
              {/* `compact` makes it that smaller “People Also Bought” look */}
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PeopleAlsoBought;
