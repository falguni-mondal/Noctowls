import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { getRecentlyViewed } from "../../../utils/helpers/recentlyViewedHelper";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const RecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState([]);

  const loadProducts = () => {
    const products = getRecentlyViewed();
    setRecentProducts(products);
  };

  useEffect(() => {
    // Load initially
    loadProducts();

    // Listen for storage updates
    window.addEventListener("recentlyViewedUpdated", loadProducts);

    return () => {
      window.removeEventListener("recentlyViewedUpdated", loadProducts);
    };
  }, []);

  if (!recentProducts || recentProducts.length === 0) return null;

  return (
    // Light theme border: border-zinc-200
    <section className="recently-viewed-section mt-10 pt-10 border-t border-zinc-200 w-full">
      {/* Light theme heading text: text-[#0f0f0f] */}
      <h2 className="text-[#0f0f0f] text-xl md:text-2xl font-black uppercase mb-8 tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
        Recently Viewed <Icon icon="mdi:eye-outline" className="text-red-600" />
      </h2>

      {/* ==================== MOBILE / TABLET (SWIPER) ==================== */}
      <div className="block lg:hidden">
        <Swiper
          slidesPerView={1.4} // Shows partial next slide for "peek" effect
          spaceBetween={16}
          breakpoints={{
            500: { slidesPerView: 2.2, spaceBetween: 16 }, // Larger phones
            768: { slidesPerView: 2.5, spaceBetween: 20 }, // Tablets
            1024:{ slidesPerView: 4, spaceBetween: 20 },
          }}
          className="pb-4 px-1" // Padding for shadow visibility
        >
          {recentProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ==================== DESKTOP (GRID) ==================== */}
      <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

// ==================== REUSABLE PRODUCT CARD COMPONENT ====================
const ProductCard = ({ product }) => {
  // Handle image safety (helper saves strictly defined structure)
  const mainImage = product.images && product.images.length > 0 ? product.images[0].url : "";
  
  // Calculate discount on the fly if not saved
  const discount = product.originalPrice && product.price && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product.id}`}
      // Light theme card wrapper: bg-white, border-zinc-200, shadow-sm
      className="group relative bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-300 h-full flex flex-col"
      onClick={() => window.scrollTo(0, 0)}
    >
      {/* Image Container */}
      <div className="w-full aspect-4/3 overflow-hidden bg-zinc-100 relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
        />

        {/* Gradient Overlay on Hover (Desktop) - Updated to Frosted White */}
        <div className="absolute inset-0 bg-linear-to-t from-white/90 via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-6">
          <span className="bg-white/50 backdrop-blur-md border border-zinc-200 text-[#0f0f0f] text-[10px] font-bold uppercase px-4 py-2 rounded-full tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-[#0f0f0f] hover:text-white hover:border-[#0f0f0f]">
            View Again
          </span>
        </div>

        {/* Recently Viewed Badge - Light theme soft gray */}
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-linear-to-r from-zinc-100 to-zinc-200 text-zinc-600 text-[9px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-sm border-b border-r border-zinc-200">
            Recent
          </div>
        </div>

        {/* Discount Badge - Fresh green for light theme */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative bg-white flex-1 flex flex-col justify-between">
        {/* Hover Line Effect */}
        <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="text-[#0f0f0f] text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="text-zinc-400 text-[10px] font-medium line-through decoration-zinc-300">
                Rs. {product.originalPrice}
              </span>
            )}
            <span className="text-[#0f0f0f] text-sm md:text-base font-black tracking-tight">
              Rs. {product.price}
            </span>
          </div>

          {/* Light theme arrow button */}
          <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-300">
            <Icon icon="solar:arrow-right-linear" className="text-lg" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecentlyViewed;