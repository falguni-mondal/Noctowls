import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect } from 'react';
import { useState } from 'react'
import { Link } from 'react-router-dom';

const MainDets = ({selectedSize, setselectedSize, dets}) => {
  const {name, description, sizes, reviewCount} = dets;
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


  // Helper function to check if size is in stock
  const isSizeInStock = (sizeValue) => {
    const sizeData = sizes?.find(s => s.value === sizeValue);
    return sizeData && sizeData.stock > 0;
  }

  // Helper function to handle size click
  const handleSizeClick = (sizeValue) => {
    if (isSizeInStock(sizeValue)) {
      setselectedSize(sizeValue);
    }
  }

  return (
    <div className="product-main-dets mt-10 px-3">
      <p className="brand-name uppercase text-sm font-medium tracking-wide">
        noctowls
      </p>
      <h1 className="product-name text-2xl uppercase font-semibold leading-none mt-2">
        {name}
      </h1>
      <div className="product-rating-container flex text-xl gap-3 mt-3">
        <div className="rating-stars flex">
          {
            ["1", "2", "3", "4", "5"].map((item, index) => (
              <Icon key={`${index}`} icon="material-symbols:star-rounded" />
            ))
          }
        </div>
        <div className="reviews-count text-sm font-medium">
          <span className="mr-1">({`${reviewCount}`})</span>
          <span>Reviews</span>
        </div>
      </div>

      <div className="price-container flex items-end gap-3 mt-3">
        <div className="original-price relative w-fit">
          <span>Rs. {price.original}.00</span>
          <span className="h-px absolute w-full top-1/2 left-0 -translate-y-1/2 bg-zinc-100"></span>
        </div>
        <div className="price-container">
          <span className="text-3xl font-medium">Rs. {price.discounted}.00</span>
        </div>
        <span className="sale-badge text-xs font-medium px-4 py-1 bg-red-600 text-white rounded-full self-start">
          Sale
        </span>
      </div>

      <div className="tax-text-container text-[0.6rem] flex items-center gap-1 mt-3">
        <p className="text-zinc-200">Tax Included.</p>
        <Link to="/shipping-policy" className="underline font-medium">Free Shipping.</Link>
      </div>

      <div className="size-switcher mt-3">
        <h3 className="size-selection-heading text-sm font-medium text-zinc-300">
          Size
        </h3>
        <div className="product-sizes grid grid-cols-3 w-[60%] text-sm font-medium gap-2 mt-2">
          {
            sizes?.map(sizeObj => {
              const isInStock = sizeObj.stock > 0;
              const isSelected = selectedSize === sizeObj.value;
              
              return (
                <span 
                  onClick={() => handleSizeClick(sizeObj.value)} 
                  key={`${sizeObj.value}-size-key`} 
                  className={`
                    py-1.5 border-[0.5px] rounded-full flex justify-center uppercase
                    ${isInStock 
                      ? `cursor-pointer ${isSelected ? "bg-white text-black" : "border-zinc-500 hover:border-zinc-300"}` 
                      : "border-zinc-700 text-zinc-600 cursor-not-allowed opacity-50 line-through"
                    }
                  `}
                >
                  {sizeObj.label || sizeObj.value}
                </span>
              )
            })
          }
        </div>
        
        {/* Show out of stock message */}
        {!isSizeInStock(selectedSize) && (
          <p className="text-red-500 text-xs mt-2">Selected size is out of stock</p>
        )}
      </div>

      <p className="product-description font-medium text-zinc-300 mt-5 leading-tight">
        {description}
      </p>
    </div>
  )
}

export default MainDets