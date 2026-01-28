import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";

const ProductSpecs = () => {
  // 0: Highlights, 1: Description, 2: Package Contents
  const [openIndexes, setOpenIndexes] = useState([2]);
  const contentRefs = useRef([]);

  // Ensure refs array is initialized
  useEffect(() => {
    contentRefs.current = contentRefs.current.slice(0, 3);
  }, []);

  const toggle = (idx) => {
    const isOpen = openIndexes.includes(idx);
    setOpenIndexes(isOpen ? openIndexes.filter((i) => i !== idx) : [...openIndexes, idx]);
  };

  return (
    <section className="product-specs w-full mt-10 px-3 md:px-0">
      <h2 className="text-white text-base lg:text-3xl font-bold mb-4 uppercase border-b border-zinc-800 pb-2">
        Features & Specification
      </h2>

      {/* Main Container with 'items-start' to fix height stretching */}
      <div className="w-full flex flex-col gap-3 lg:flex-row items-start">

        <div className="first-option-section-container flex flex-col gap-3 w-full lg:w-[49.25%]">
          {/* =========================================
            OPTION 1: HIGHLIGHTS
           ========================================= */}
          <div className="border border-zinc-800 rounded bg-zinc-900/30 overflow-hidden">
            <button
              onClick={() => toggle(0)}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors group"
            >
              <span className="text-xs font-bold text-zinc-200 group-hover:text-white uppercase tracking-wider">Highlights</span>
              <Icon
                icon={openIndexes.includes(0) ? "ic:baseline-minus" : "ic:baseline-plus"}
                className={`text-zinc-500 group-hover:text-white transition-colors text-lg`}
              />
            </button>

            <div
              ref={(el) => (contentRefs.current[0] = el)}
              style={{ maxHeight: openIndexes.includes(0) ? `${contentRefs.current[0]?.scrollHeight}px` : "0px" }}
              className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            >
              <div className="px-4 py-4 text-zinc-400 border-t border-zinc-800/50">
                <ul className="space-y-2 pl-4 list-disc marker:text-red-600">
                  <li className="text-sm">Dual-Sided Durability</li>
                  <li className="text-sm">Durable Stitched Perfection</li>
                  <li className="text-sm">Splash Proof Easy To Clean</li>
                  <li className="text-sm">3MM Premium Thickness</li>
                  <li className="text-sm">Effortless Glide</li>
                  <li className="text-sm">Precision In Every Size</li>
                </ul>
              </div>
            </div>
          </div>

          {/* =========================================
            OPTION 2: DESCRIPTION
           ========================================= */}
          <div className="border border-zinc-800 rounded bg-zinc-900/30 overflow-hidden">
            <button
              onClick={() => toggle(1)}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors group"
            >
              <span className="text-xs font-bold text-zinc-200 group-hover:text-white uppercase tracking-wider">Description</span>
              <Icon
                icon={openIndexes.includes(1) ? "ic:baseline-minus" : "ic:baseline-plus"}
                className={`text-zinc-500 group-hover:text-white transition-colors text-lg`}
              />
            </button>

            <div
              ref={(el) => (contentRefs.current[1] = el)}
              style={{ maxHeight: openIndexes.includes(1) ? `${contentRefs.current[1]?.scrollHeight}px` : "0px" }}
              className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            >
              <div className="px-4 py-4 text-zinc-400 border-t border-zinc-800/50">
                {/* Para */}
                <p className="text-sm leading-6 text-zinc-400 mb-2">
                  Designed for Gamers, Creators & Everyday PC Users
                </p>

                {/* Highlight */}
                <p className="text-sm leading-6 text-zinc-300 mb-3 font-medium border-l-2 border-red-600 pl-3">
                  NOCTOWLS Deskmats bring premium comfort, precise control, and clean aesthetics.
                </p>

                {/* Heading */}
                <h3 className="mt-4 mb-2 text-[10px] font-bold text-white uppercase tracking-widest bg-zinc-800 w-fit px-2 py-1 rounded">
                  AVAILABLE SIZES
                </h3>

                {/* Bullets */}
                <ul className="mb-3 pl-4 list-disc marker:text-red-600 space-y-1">
                  <li className="text-sm">L — 11 × 23" (28 × 58 cm)</li>
                  <li className="text-sm">XL — 12 × 31" (30 × 80 cm)</li>
                  <li className="text-sm">XXL — 18 × 36" (42 × 90 cm)</li>
                </ul>

                {/* Heading */}
                <h3 className="mt-4 mb-2 text-[10px] font-bold text-white uppercase tracking-widest bg-zinc-800 w-fit px-2 py-1 rounded">
                  BEST FOR
                </h3>

                {/* Bullets */}
                <ul className="mb-3 pl-4 list-disc marker:text-red-600 space-y-1">
                  <li className="text-sm">Gaming Setups</li>
                  <li className="text-sm">Office or Study Desks</li>
                  <li className="text-sm">Laptop or PC Users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            OPTION 3: PACKAGE CONTENTS
           ========================================= */}
        <div className="border border-zinc-800 rounded bg-zinc-900/30 overflow-hidden w-full lg:w-[49.25%]">
          <button
            onClick={() => toggle(2)}
            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors group"
          >
            <span className="text-xs font-bold text-zinc-200 group-hover:text-white uppercase tracking-wider">Package Contents</span>
            <Icon
              icon={openIndexes.includes(2) ? "ic:baseline-minus" : "ic:baseline-plus"}
              className={`text-zinc-500 group-hover:text-white transition-colors text-lg`}
            />
          </button>

          <div
            ref={(el) => (contentRefs.current[2] = el)}
            style={{ maxHeight: openIndexes.includes(2) ? `${contentRefs.current[2]?.scrollHeight}px` : "0px" }}
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          >
            <div className="px-4 py-4 text-zinc-400 border-t border-zinc-800/50">
              <ul className="space-y-2 pl-4 list-disc marker:text-red-600">
                <li className="text-sm">1 × DeskMat</li>
                <li className="text-sm">1 × Thank You card</li>
                <li className="text-sm">1 × Anime keychain</li>
                <li className="text-sm">5 × Stickers</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProductSpecs;