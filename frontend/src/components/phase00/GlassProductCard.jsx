import React from "react";
import { Icon } from "@iconify/react";

const GlassProductCard = ({ product }) => {
  const { name, images, rating, originalPrice, price } = product;

  // Safe image access
  const mainImage = images?.[0]?.url || "";
  const hoverImage = images?.[1]?.url || mainImage;
  const avgRating = rating?.average || 0;
  const reviewCount = rating?.count || 0;

  // Helper to render 5 dynamic stars with responsive sizing
  const renderStars = (avg) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      if (avg >= starValue) {
        return (
          <Icon 
            key={index} 
            icon="material-symbols:star-rounded" 
            className="text-amber-500 text-[11px] sm:text-sm md:text-base" 
          />
        );
      } else if (avg >= starValue - 0.5) {
        return (
          <Icon 
            key={index} 
            icon="material-symbols:star-half-rounded" 
            className="text-amber-500 text-[11px] sm:text-sm md:text-base" 
          />
        );
      } else {
        return (
          <Icon 
            key={index} 
            icon="material-symbols:star-outline-rounded" 
            className="text-zinc-300 text-[11px] sm:text-sm md:text-base" 
          />
        );
      }
    });
  };

  return (
    <div className="group relative bg-[#13131308] backdrop-blur-[2px] border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_10px_30px_rgba(220,38,38,0.15)] transition-all duration-500 h-full flex flex-col cursor-pointer">
      
      {/* Image Container */}
      <div className="w-full aspect-square relative overflow-hidden bg-[#13131308]">
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-[105%] will-change-transform">
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-500 group-hover:opacity-0"
          />
          <img
            src={hoverImage}
            alt={name}
            className="w-full h-full object-cover absolute inset-0 z-0"
          />
        </div>

        {/* Sale Badge */}
        {originalPrice > price && (
          <div className="absolute top-0 left-0 z-30">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase px-2 sm:px-3 py-1 rounded-br-lg shadow-lg">
              Sale
            </div>
          </div>
        )}
      </div>

      {/* Content Container with Responsive Padding */}
      <div className="p-2.5 sm:p-3 md:p-4 relative flex-1 flex flex-col justify-between bg-[#13131308] backdrop-blur-[2px]">
        <div className="absolute top-0 left-0 w-0 h-[2px] bg-red-600 group-hover:w-full transition-all duration-500 ease-out"></div>
        
        {/* Title Section */}
        <div>
          <span className="phase-txt text-[9px] sm:text-[10px] md:text-[11px] text-red-600 uppercase block mb-1 sm:mb-1.5">
            PHASE 00
          </span>
          <h3 className="text-zinc-100 text-xs sm:text-sm font-bold uppercase tracking-wide leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
            {name}
          </h3>
        </div>

        {/* Price & Rating Section */}
        <div className="mt-2.5 sm:mt-3 md:mt-4 flex flex-wrap items-end justify-between gap-1.5 sm:gap-2">
          
          {/* Price */}
          <div className="flex flex-col">
            {originalPrice && originalPrice !== price && (
              <span className="text-zinc-400 text-[10px] sm:text-[11px] md:text-[12px] font-medium line-through">
                Rs. {originalPrice}
              </span>
            )}
            <span className="phase-txt text-zinc-100 text-sm sm:text-base md:text-lg tracking-tight">
              Rs. {price}
            </span>
          </div>

          {/* Dynamic Rating & Reviews */}
          <div className="flex flex-col items-end gap-0.5 sm:gap-1 mb-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[10px] md:text-sm font-semibold text-zinc-100 leading-none">
                {avgRating}
              </span>
              <div className="flex items-center">
                {renderStars(avgRating)}
              </div>
            </div>
            
            {/* Restored the word 'Review/Reviews' for mobile, adjusted text size */}
            <span className="text-[8.5px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-300 font-medium whitespace-nowrap">
              ({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlassProductCard;