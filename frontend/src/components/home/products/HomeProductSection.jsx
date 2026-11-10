import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react/dist/iconify.js";
import ProductListItem from "./ProductListItem";
import {
  selectPhase00Products,
  selectPhase00Loading,
} from "../../../store/features/user/productSlice";

// Filter list matching the top navbar categories (From "Anime" to "Fantasy") + "All"
const CLASSIC_FILTERS = [
  { label: "All Collections", shortLabel: "All", value: "all" },
  { label: "Anime", shortLabel: "Anime", value: "anime" },
  { label: "Marvel", shortLabel: "Marvel", value: "marvel" },
  { label: "Games", shortLabel: "Games", value: "games" },
  { label: "Grid & Lines", shortLabel: "Grid & Lines", value: "grid-and-lines" },
  { label: "Japanese Art", shortLabel: "Japanese Art", value: "japanese-art" },
  { label: "Fantasy", shortLabel: "Fantasy", value: "fantasy" },
];

const normalizeGroupSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-");

const ProductCardSkeleton = () => (
  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden h-full flex flex-col animate-pulse">
    <div className="w-full aspect-square bg-zinc-200" />
    <div className="p-2.5 lg:p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 bg-zinc-200 rounded" />
        <div className="h-3.5 w-full bg-zinc-200 rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 w-20 bg-zinc-200 rounded" />
        <div className="flex gap-1.5">
          <div className="h-8 flex-1 bg-zinc-200 rounded-lg" />
          <div className="h-8 w-8 bg-zinc-200 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  </div>
);

const HomeProductSection = () => {
  const productGroups = useSelector((state) => state.products.products);
  const productsLoading = useSelector(
    (state) => state.products.productsLoading
  );
  const phase00Products = useSelector(selectPhase00Products);
  const phase00Loading = useSelector(selectPhase00Loading);

  const [selectedClassicFilter, setSelectedClassicFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Close custom filter menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Flatten all classic products across groups while preserving backend inventory & salesVelocity order
  const allClassicProducts = useMemo(() => {
    if (!Array.isArray(productGroups)) return [];
    return productGroups.flatMap((group) =>
      Array.isArray(group?.products) ? group.products : []
    );
  }, [productGroups]);

  // Dynamically filter Classic products in-place without page routing
  const filteredClassicProducts = useMemo(() => {
    if (selectedClassicFilter === "all") {
      return allClassicProducts;
    }
    const targetSlug = normalizeGroupSlug(selectedClassicFilter);
    return allClassicProducts.filter(
      (product) => normalizeGroupSlug(product.group) === targetSlug
    );
  }, [allClassicProducts, selectedClassicFilter]);

  const activeFilterObj =
    CLASSIC_FILTERS.find((f) => f.value === selectedClassicFilter) ||
    CLASSIC_FILTERS[0];

  return (
    <section
      className="w-full px-4 sm:px-5 lg:px-10 bg-[#f4f4f4]"
      id="home-product-section"
    >
      {/* ==================== 1. PHASE 00 SECTION ==================== */}
      <section
        className="w-full pt-8 pb-12 md:pt-14 md:pb-16 border-b border-zinc-200"
        id="user-phase-00-product-list-section"
      >
        {/* Responsive single-line PHASE 00 header without Explore Archive */}
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3 border-l-4 border-l-red-600 pl-2.5">
            <h2 className="phase-txt uppercase font-bold text-[#0f0f0f] tracking-wider text-base sm:text-xl md:text-2xl whitespace-nowrap leading-none">
              PHASE 00
            </h2>
            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-widest bg-red-600 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-xs">
              Limited Drop
            </span>
          </div>
        </div>

        {phase00Loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-4 md:gap-x-5 md:gap-y-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={`phase00-skeleton-${i}`} />
            ))}
          </div>
        ) : !phase00Products || phase00Products.length === 0 ? (
          <div className="w-full bg-white border border-zinc-200 border-dashed rounded-2xl py-12 px-4 text-center flex flex-col items-center justify-center">
            <p className="text-xs md:text-sm text-zinc-500 font-medium">
              Phase 00 exclusive drops will appear here once published.
            </p>
          </div>
        ) : (
          <ul className="homepage-product-list-container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-4 md:gap-x-5 md:gap-y-12">
            {phase00Products.map((product) => (
              <li key={`phase00-product-${product.id}`} className="h-full">
                <Link
                  to={`/products/${product.id}`}
                  className="block h-full"
                >
                  <ProductListItem product={product} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ==================== 2. NOCTOWLS CLASSIC SECTION ==================== */}
      <section
        className="w-full py-10 pb-24 md:py-14 md:pb-28"
        id="user-classic-product-list-section"
      >
        {/* Heading + Single Custom Filter Button with Animated Dropdown */}
        <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
          <div className="border-l-4 border-l-red-600 pl-2.5">
            <h2 className="uppercase font-bold text-[#0f0f0f] tracking-wide text-base sm:text-xl md:text-2xl whitespace-nowrap leading-none">
              NOCTOWLS CLASSIC
            </h2>
          </div>

          {/* Single Filter Button + Custom Animated Dropdown Menu */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-expanded={isFilterOpen}
              aria-haspopup="listbox"
              className={`group flex items-center gap-2 sm:gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer shadow-xs ${
                selectedClassicFilter !== "all" || isFilterOpen
                  ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                  : "bg-white text-[#0f0f0f] border-zinc-300 hover:border-[#0f0f0f]"
              }`}
            >
              <Icon
                icon="solar:tuning-2-bold"
                className={`text-sm sm:text-base transition-colors ${
                  selectedClassicFilter !== "all" || isFilterOpen
                    ? "text-red-500"
                    : "text-red-600"
                }`}
              />
              <span className="whitespace-nowrap">
                {selectedClassicFilter === "all"
                  ? "Filter"
                  : activeFilterObj.shortLabel}
              </span>
              {selectedClassicFilter !== "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              <Icon
                icon="iconoir:nav-arrow-down"
                className={`text-sm transition-transform duration-300 ${
                  isFilterOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {/* Custom Animated Dropdown List */}
            <div
              className={`absolute right-0 top-full mt-2 w-56 sm:w-60 bg-white border border-zinc-200 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.14)] overflow-hidden z-40 origin-top-right transition-all duration-200 ease-out ${
                isFilterOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
              role="listbox"
            >
              <div className="px-4 py-2.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Select Collection
                </span>
                {selectedClassicFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassicFilter("all");
                      setIsFilterOpen(false);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <ul className="py-1.5 divide-y divide-zinc-100">
                {CLASSIC_FILTERS.map((filter) => {
                  const isActive = selectedClassicFilter === filter.value;
                  return (
                    <li key={filter.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setSelectedClassicFilter(filter.value);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? "bg-red-50/80 text-red-600"
                            : "text-zinc-700 hover:bg-zinc-50 hover:text-[#0f0f0f]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              isActive ? "bg-red-600" : "bg-zinc-300"
                            }`}
                          />
                          {filter.label}
                        </span>
                        {isActive && (
                          <Icon
                            icon="mdi:check-bold"
                            className="text-red-600 text-sm"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Active Filter Pill Indicator (when a specific category is selected) */}
        {selectedClassicFilter !== "all" && (
          <div className="flex items-center gap-2 mb-5 animate-in fade-in duration-200">
            <span className="text-xs font-medium text-zinc-500">
              Showing{" "}
              <strong className="text-[#0f0f0f]">
                {filteredClassicProducts.length}
              </strong>{" "}
              in
            </span>
            <button
              type="button"
              onClick={() => setSelectedClassicFilter("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-300 text-xs font-bold uppercase tracking-wider text-[#0f0f0f] hover:border-red-600 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{activeFilterObj.label}</span>
              <Icon icon="mdi:close" className="text-sm" />
            </button>
          </div>
        )}

        {/* Classic Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-4 md:gap-x-5 md:gap-y-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={`classic-skeleton-${i}`} />
            ))}
          </div>
        ) : filteredClassicProducts.length === 0 ? (
          <div className="w-full bg-white border border-zinc-200 border-dashed rounded-2xl py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <Icon icon="solar:box-minimalistic-broken" className="text-2xl" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-[#0f0f0f] uppercase tracking-wide">
              No Classic Products Found
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 mt-1 mb-5 max-w-md">
              No products matched the{" "}
              <strong className="text-[#0f0f0f]">
                {activeFilterObj.label}
              </strong>{" "}
              filter right now.
            </p>
            {selectedClassicFilter !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedClassicFilter("all")}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors cursor-pointer"
              >
                Show All Classic Products
              </button>
            )}
          </div>
        ) : (
          <ul className="homepage-product-list-container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-4 md:gap-x-5 md:gap-y-16">
            {filteredClassicProducts.map((product) => (
              <li key={`home-product-${product.id}`} className="h-full">
                <Link
                  to={`/products/${product.id}`}
                  className="block h-full"
                >
                  <ProductListItem product={product} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default HomeProductSection;