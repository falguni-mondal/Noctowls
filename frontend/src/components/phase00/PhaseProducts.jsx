import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import GlassProductCard from "./GlassProductCard"; // Adjust path as needed

// 1. Added currentPhase to the destructured props
const PhaseProducts = ({ products, loading, error, currentPhase }) => {
  // Safe check in case the prop hasn't mounted yet
  const isPhase00 = !currentPhase || currentPhase.id === "00";

  return (
    <div className="products-section">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500 gap-4">
          <Icon
            icon="line-md:loading-twotone-loop"
            className="text-5xl text-red-600 animate-spin"
          />
          <span className="phase-txt text-sm tracking-widest uppercase text-zinc-400">
            Initializing Array...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-6 border border-red-900/50">
            <Icon
              icon="solar:danger-triangle-broken"
              className="text-4xl text-red-500"
            />
          </div>
          <h2 className="phase-txt text-xl text-white mb-2">
            Signal Interrupted.
          </h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="phase-txt bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
          >
            Reconnect
          </button>
        </div>
      ) : products && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#13131313] backdrop-blur-[2px] rounded-2xl border border-zinc-800 border-dashed transition-all duration-500">
          <div className="w-20 h-20 bg-[#0a0a0a] rounded-full flex items-center justify-center mb-6">
            <Icon
              // Optional: You could even make the icon dynamic here!
              icon={isPhase00 ? "solar:moon-fog-broken" : currentPhase.icon}
              className="text-4xl text-zinc-600"
            />
          </div>
          
          {/* 2. DYNAMIC HEADING */}
          <h2 className="phase-txt text-2xl text-white mb-2 uppercase tracking-widest">
            {isPhase00 ? "The Void is Empty" : "Coming Soon"}
          </h2>
          
          {/* 3. DYNAMIC SUBHEADING / LORE */}
          <p className="text-zinc-500 max-w-md mx-auto mb-8">
            {isPhase00 
              ? "The Genesis artifacts are currently unavailable. The cycle will refresh soon."
              : currentPhase.lore}
          </p>
          
          <Link
            to="/"
            className="phase-txt tracking-widest bg-red-600 text-white px-8 py-3 rounded-full text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            Return to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-10 md:gap-6 md:gap-y-20">
          {/* Fixed routing: Valid HTML Link wrapped purely around the UI component */}
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              onClick={() => window.scrollTo(0, 0)}
              className="block h-full relative z-50"
            >
              <GlassProductCard product={product} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhaseProducts;