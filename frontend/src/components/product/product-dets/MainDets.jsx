import { Icon } from '@iconify/react/dist/iconify.js';
import { useState } from 'react'
import { Link } from 'react-router-dom';

const MainDets = ({selectedSize, setselectedSize}) => {

  return (
    <div className="product-main-dets mt-10 px-3">
      <p className="brand-name uppercase text-sm font-medium tracking-wide">
        noctowls
      </p>
      <h1 className="product-name text-2xl uppercase font-semibold leading-none mt-2">
        chains of desire
      </h1>
      <div className="product-rating-container flex text-xl gap-3 mt-3">
        <div className="rating-stars flex">
          {
            ["1", "2", "3", "4", "5"].map((index) => (
              <Icon key={`${index}`} icon="material-symbols:star-rounded" />
            ))
          }
        </div>
        <div className="reviews-count text-sm font-medium">
          <span className="mr-1">({`${0}`})</span>
          <span>Reviews</span>
        </div>
      </div>

      <div className="price-container flex items-end gap-3 mt-3">
        <div className="original-price relative w-fit">
          <span>Rs. 1,599.00</span>
          <span className="h-[1px] absolute w-full top-1/2 left-0 -translate-y-1/2 bg-zinc-100"></span>
        </div>
        <div className="price-container">
          <span className="text-3xl font-medium">Rs. 649.00</span>
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
            ["l", "xl", "xxl"].map(item => (
              <span onClick={() => setselectedSize(item)} key={`${item}-size-key`} className={`py-1.5 border-[0.5px] ${selectedSize === item ? "bg-white text-black" : "border-zinc-500"} rounded-full flex justify-center uppercase`}>{item}</span>
            ))
          }
        </div>
      </div>

      <p className="product-description font-medium text-zinc-300 mt-5 leading-tight">
        A violent passion forged in steel and blood — where love cuts as deep as the blade that binds it.
      </p>
    </div>
  )
}

export default MainDets