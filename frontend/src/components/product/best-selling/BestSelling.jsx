import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getBestSellingProducts } from "../../../store/features/user/productSlice";
import { Icon } from "@iconify/react";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

const BestSelling = () => {
  const dispatch = useDispatch();
  const { bestSellingProducts, bestSellingLoading } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(getBestSellingProducts(4));
  }, [dispatch]);

  if (bestSellingLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-zinc-500">
        <Icon icon="eos-icons:loading" className="text-3xl" />
      </div>
    );
  }

  if (!bestSellingProducts || bestSellingProducts.length === 0) return null;

  return (
    <section className="best-selling-section mt-10 pt-10 border-t border-zinc-900 w-full">
      <h2 className="text-white text-xl md:text-2xl font-black uppercase mb-8 tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
        Best Selling <Icon icon="mdi:fire" className="text-red-600 animate-pulse" />
      </h2>

      {/* ==================== MOBILE / TABLET (SWIPER) ==================== */}
      <div className="block lg:hidden">
        <Swiper
          slidesPerView={1.4} // Shows partial next slide for "peek" effect
          spaceBetween={16}
          freeMode={true}
          modules={[FreeMode]}
          breakpoints={{
            500: { slidesPerView: 2.2, spaceBetween: 16 }, // Larger phones
            768: { slidesPerView: 2.5, spaceBetween: 20 }, // Tablets
          }}
          className="pb-4 px-1" // Padding for shadow visibility
        >
          {bestSellingProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ==================== DESKTOP (GRID) ==================== */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {bestSellingProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

// ==================== REUSABLE PRODUCT CARD COMPONENT ====================
const ProductCard = ({ product }) => {
  const mainImage = product.images && product.images.length > 0 ? product.images[0].url : "";

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative bg-zinc-950 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-300 h-full flex flex-col"
      onClick={() => window.scrollTo(0, 0)}
    >
      {/* Image Container */}
      <div className="w-full aspect-4/3 overflow-hidden bg-black relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
        />

        {/* Gradient Overlay on Hover (Desktop) */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-6">
          <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-full tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-white hover:text-black hover:border-white">
            View Product
          </span>
        </div>

        {/* Best Selling Badge */}
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-linear-to-r from-red-600 to-red-800 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-lg">
            Best Selling
          </div>
        </div>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            -{product.discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative bg-zinc-950 flex-1 flex flex-col justify-between">
        {/* Hover Line Effect */}
        <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="text-zinc-100 text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-red-500 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="text-zinc-600 text-[10px] font-medium line-through decoration-zinc-600/50">
                Rs. {product.originalPrice}
              </span>
            )}
            <span className="text-white text-sm md:text-base font-black tracking-tight">
              Rs. {product.price}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-300">
            <Icon icon="solar:arrow-right-linear" className="text-lg" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BestSelling;