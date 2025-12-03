import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react'

const ProductListItem = ({ product }) => {
    const { name, sizes, images, rating, reviews } = product;
    return (
        <div className='w-full'>
            <div className="image-container w-full aspect-square rounded-sm relative overflow-hidden">
                <img className='w-full h-full absolute top-0 left-0 hover:opacity-0 transition-all duration-300' src={images[0]} alt="" />
                <img className='w-full h-full' src={images[1]} alt="" />
                <span className="sale-icon uppercase relative top-[-50px] px-4 py-2 bg-red-600 text-[0.65rem]">sale</span>
            </div>
            <p className="product-name text-[0.6rem] tracking-wider font-semibold uppercase mt-2">{name}</p>
            <div className="rating-preview flex gap-2 items-center mt-2">
                <div className="stars-container flex">
                    {
                        ["","","","",""].map((index) => (
                            <Icon key={`${name}-rating-star-${index}`} icon="material-symbols:star-rounded" />
                        ))
                    }
                </div>
                <p className="users-count font-medium text-xs">( {reviews.length} )</p>
            </div>
            <div className="original-price-preview text-xs font-semibold mt-2 text-zinc-600 relative w-fit">
                <span>
                    Rs. {sizes[0].originalPrice}
                </span>
                <span className='h-px bg-zinc-600 absolute w-full top-1/2 left-0 -translate-y-1/2'></span>
            </div>
            <div className="price-container font-medium tracking-wider mt-2">
                From Rs. {sizes[0].price}
            </div>
        </div>
    )
}

export default ProductListItem