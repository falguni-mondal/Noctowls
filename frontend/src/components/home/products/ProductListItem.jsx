import { Icon } from '@iconify/react/dist/iconify.js';

const ProductListItem = ({ product }) => {
    const { name, images, rating, originalPrice, price  } = product;
    
    return (
        <div className='w-full group cursor-pointer'>
            <div className="image-container w-full aspect-square rounded-sm relative overflow-hidden bg-zinc-100">
                {/* Image hover effect remains the same */}
                <img className='w-full h-full object-cover absolute top-0 left-0 hover:opacity-0 transition-all duration-300 z-10' src={images[0].url} alt={name} />
                <img className='w-full h-full object-cover' src={images[1].url} alt={name} />
                
                {/* Sale Icon: Adjusted font size for tablet/desktop (md:text-xs) */}
                <span className="sale-icon uppercase absolute top-0 left-0 z-20 px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white text-[0.65rem] md:text-xs font-bold tracking-wider">sale</span>
            </div>

            {/* Product Name: Scaled text size (md:text-xs lg:text-sm) */}
            <p className="product-name text-[0.65rem] md:text-xs lg:text-sm tracking-wider font-semibold uppercase mt-2 md:mt-3 leading-tight group-hover:underline decoration-1 underline-offset-2 transition-all">
                {name}
            </p>

            {/* Rating Section */}
            <div className="rating-preview flex gap-2 items-center mt-1.5 md:mt-2">
                <div className="stars-container flex text-amber-400 text-xs md:text-sm">
                    {
                        ["","","","",""].map((item, index) => (
                            <Icon key={`${name}-rating-star-${index}`} icon="material-symbols:star-rounded" />
                        ))
                    }
                </div>
                {/* User Count: Scaled text size */}
                <p className="users-count font-medium text-xs md:text-sm text-zinc-500">( {rating.count} )</p>
            </div>

            {/* Price Section */}
            <div className="price-details flex flex-col items-start mt-1 md:mt-2">
                <div className="original-price-preview text-xs md:text-sm font-semibold text-zinc-500 relative w-fit">
                    <span>
                        Rs. {originalPrice}.00
                    </span>
                    <span className='h-px bg-zinc-500 absolute w-full top-1/2 left-0 -translate-y-1/2'></span>
                </div>
                
                {/* Final Price: Scaled text size and weight (md:text-base) */}
                <div className="price-container font-bold text-sm md:text-base tracking-wider leading-none mt-1">
                    From Rs. {price}.00
                </div>
            </div>
        </div>
    )
}

export default ProductListItem;