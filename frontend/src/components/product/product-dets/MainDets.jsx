import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect } from 'react';
import { useState } from 'react'
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const MainDets = ({ selectedSize, setselectedSize, dets }) => {
  const { name, description, category, sizes, reviewCount } = dets;
  const [price, setPrice] = useState({
    original: "",
    discounted: "",
  })

  useEffect(() => {
    if (sizes && sizes.length > 0) {
      const selectedSizeData = sizes.find(size => size.value === selectedSize);

      if (selectedSizeData) {
        setPrice({
          original: selectedSizeData.formattedOriginalPrice || selectedSizeData.originalPrice,
          discounted: selectedSizeData.price || selectedSizeData.numPrice,
        });
      }
    }
  }, [selectedSize, sizes])

  const isSizeInStock = (sizeValue) => {
    const sizeData = sizes?.find(s => s.value === sizeValue);
    return sizeData && sizeData.stock > 0;
  }

  const handleSizeClick = (sizeValue) => {
    if (isSizeInStock(sizeValue)) {
      setselectedSize(sizeValue);
    }
  }

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
    <div className="product-main-dets mt-5 md:mt-0 px-3 md:px-0">

      {/* SHARE & BRAND */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex flex-col gap-4">
          <div
            onClick={handleShare}
            className="share-icon text-white hover:text-white cursor-pointer transition-colors hidden lg:flex items-center gap-1 text-xs tracking-wide"
          >
            <Icon icon="ic:baseline-share" />
            <span>Share</span>
          </div>
          <p className="brand-name uppercase text-sm font-bold tracking-wide text-zinc-500">
            Noctowls
          </p>
          {/* SHARE BUTTON: Hidden on Mobile/Tablet (lg:hidden), Visible on Desktop (lg:flex) */}
        </div>
      </div>

      {/* PRODUCT NAME */}
      <h1 className="product-name text-2xl md:text-4xl uppercase font-bold tracking-wide leading-tight text-white mt-1">
        {name}
      </h1>

      {/* REVIEWS */}
      <div className="product-rating-container flex items-center text-lg gap-2 mt-2">
        <div className="rating-stars flex text-amber-400 text-sm">
          {
            ["1", "2", "3", "4", "5"].map((item, index) => (
              <Icon key={`${index}`} icon="material-symbols:star-rounded" />
            ))
          }
        </div>
        <div className="reviews-count text-xs font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-2">
          {`${reviewCount}`} reviews
        </div>
      </div>

      {/* PRICE SECTION */}
      <div className="price-container flex flex-col mt-6 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 line-through">Rs. {price.original}.00</span>
          <span className="sale-badge text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-600 text-white rounded-xs">
            Sale
          </span>
        </div>
        <div className="price-val mt-1">
          <span className="text-3xl md:text-4xl font-bold text-white">Rs. {price.discounted}.00</span>
        </div>
        <div className="tax-text-container text-[10px] text-zinc-500 mt-1 uppercase tracking-wide">
          Tax included. <Link to="/policies/shipping-policy" className="underline hover:text-zinc-300">Free shipping</Link> available.
        </div>
      </div>

      {/* SIZE SELECTOR */}
      <div className="size-switcher mt-6">
        <div className="flex justify-between items-end mb-3">
          <h3 className="size-selection-heading text-xs font-bold text-zinc-300 uppercase tracking-widest">
            Size
          </h3>
        </div>

        <div className="product-sizes flex flex-wrap gap-3">
          {
            sizes?.map(sizeObj => {
              const isInStock = sizeObj.stock > 0;
              const isSelected = selectedSize === sizeObj.value;

              return (
                <button
                  onClick={() => handleSizeClick(sizeObj.value)}
                  key={`${sizeObj.value}-size-key`}
                  disabled={!isInStock}
                  className={`
                            px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 min-w-[60px]
                            ${isInStock
                      ? `cursor-pointer ${isSelected ? "bg-white text-black border-white" : "bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500"}`
                      : "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed"
                    }
                        `}
                >
                  {sizeObj.label || sizeObj.value}
                </button>
              )
            })
          }
        </div>

        {/* --- SIZE DETAILS CONTAINER --- */}
        {category?.toLowerCase() === "deskmat" && (
          <div className="size-details-container mt-3 text-xs text-zinc-400 font-medium tracking-wide">
            {selectedSize?.toLowerCase() === "l" && "60cm x 30cm"}
            {selectedSize?.toLowerCase() === "xl" && "80cm x 33cm"}
            {selectedSize?.toLowerCase() === "xxl" && "90cm x 40cm"}
          </div>
        )}

        {!isSizeInStock(selectedSize) && (
          <p className="text-red-500 text-xs mt-3 font-bold uppercase tracking-wide flex items-center gap-1">
            <Icon icon="mdi:close-circle" /> Out of stock
          </p>
        )}
      </div>
    </div>
  )
}

export default MainDets;