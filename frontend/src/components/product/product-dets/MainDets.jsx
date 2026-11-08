import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const MainDets = ({ selectedSize, setselectedSize, dets }) => {
  const { name, category, sizes, reviewCount } = dets;
  const [price, setPrice] = useState({
    original: "",
    discounted: "",
  });

  useEffect(() => {
    if (sizes && sizes.length > 0) {
      const selectedSizeData = sizes.find(
        (size) => size.value === selectedSize
      );

      if (selectedSizeData) {
        setPrice({
          original:
            selectedSizeData.formattedOriginalPrice ||
            selectedSizeData.originalPrice,
          discounted: selectedSizeData.price || selectedSizeData.numPrice,
        });
      }
    }
  }, [selectedSize, sizes]);

  const isSizeInStock = (sizeValue) => {
    const sizeData = sizes?.find((s) => s.value === sizeValue);
    return sizeData && sizeData.stock > 0;
  };

  const handleSizeClick = (sizeValue) => {
    if (isSizeInStock(sizeValue)) {
      setselectedSize(sizeValue);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check this Noctowls ${name}`,
          text: "Have a look at this product!",
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled: ", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!", toastControls);
    }
  };

  return (
    <div className="product-main-dets mt-2 md:mt-0 px-3 md:px-0">
      {/* COMPACT TOP ROW: BRAND, RATING (IF > 0), & SHARE */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="brand-name uppercase text-xs font-bold tracking-widest text-red-600">
            Noctowls
          </p>

          {reviewCount > 0 && (
            <div className="product-rating-container flex items-center gap-1.5">
              <div className="rating-stars flex text-amber-400 text-xs">
                {["1", "2", "3", "4", "5"].map((_, index) => (
                  <Icon key={index} icon="material-symbols:star-rounded" />
                ))}
              </div>
              <span className="reviews-count text-[11px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="share-icon text-zinc-500 hover:text-[#0f0f0f] cursor-pointer transition-colors hidden lg:flex items-center gap-1 text-xs tracking-wide"
        >
          <Icon icon="ic:baseline-share" />
          <span>Share</span>
        </button>
      </div>

      {/* PRODUCT NAME */}
      <h1 className="product-name text-lg sm:text-xl md:text-2xl lg:text-3xl uppercase font-bold tracking-wide leading-snug text-[#0f0f0f] mt-0.5">
        {name}
      </h1>

      {/* COMPACT INLINE PRICE SECTION */}
      <div className="price-container flex flex-wrap items-baseline justify-between gap-2 mt-2 border-b border-zinc-200 pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0f0f0f]">
            Rs. {price.discounted}.00
          </span>
          {price.original && price.original !== price.discounted && (
            <span className="text-xs sm:text-sm text-zinc-500 line-through">
              Rs. {price.original}.00
            </span>
          )}
        </div>

        <div className="tax-text-container text-[10px] text-zinc-500 uppercase tracking-wide">
          Tax included •{" "}
          <Link
            to="/policies/shipping-policy"
            className="underline hover:text-[#0f0f0f] font-semibold text-green-700"
          >
            Free shipping
          </Link>
        </div>
      </div>

      {/* COMPACT SIZE SELECTOR WITH DYNAMIC DIMENSIONS INLINE */}
      <div className="size-switcher mt-2.5">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="size-selection-heading text-xs font-bold text-[#0f0f0f] uppercase tracking-widest">
            Size
          </h3>

          {/* Dynamic Size Dimensions (L: 600x300mm, XL: 800x330mm, XXL: 900x400mm) */}
          {category?.toLowerCase() === "deskmat" && (
            <div className="size-details-container text-[11px] text-zinc-600 font-semibold tracking-wide bg-zinc-200/70 px-2.5 py-0.5 rounded-full">
              {selectedSize?.toLowerCase() === "l" &&
                "600mm × 300mm (60cm × 30cm) | 3mm"}
              {selectedSize?.toLowerCase() === "xl" &&
                "800mm × 330mm (80cm × 33cm) | 3mm"}
              {selectedSize?.toLowerCase() === "xxl" &&
                "900mm × 400mm (90cm × 40cm) | 3mm"}
            </div>
          )}
        </div>

        <div className="product-sizes flex flex-wrap gap-2">
          {sizes?.map((sizeObj) => {
            const isInStock = sizeObj.stock > 0;
            const isSelected = selectedSize === sizeObj.value;

            return (
              <button
                onClick={() => handleSizeClick(sizeObj.value)}
                key={`${sizeObj.value}-size-key`}
                disabled={!isInStock}
                className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 min-w-[56px] ${
                  isInStock
                    ? `cursor-pointer ${
                        isSelected
                          ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                          : "bg-white border-zinc-300 text-[#0f0f0f] hover:border-[#0f0f0f]"
                      }`
                    : "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through"
                }`}
              >
                {sizeObj.label || sizeObj.value}
              </button>
            );
          })}
        </div>

        {!isSizeInStock(selectedSize) && (
          <p className="text-red-600 text-xs mt-1.5 font-bold uppercase tracking-wide flex items-center gap-1">
            <Icon icon="mdi:close-circle" /> Out of stock
          </p>
        )}
      </div>
    </div>
  );
};

export default MainDets;