import { Icon } from '@iconify/react/dist/iconify.js';

const ProductListItem = ({ product }) => {
    const { name, images, rating, originalPrice, price } = product;

    // Safe image access
    const mainImage = images?.[0]?.url || "";
    const hoverImage = images?.[1]?.url || mainImage;

    // Helper to render 5 stars based on the average rating
    const renderStars = (avgRating) => {
        return Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            if (avgRating >= starValue) {
                // Full Star
                return <Icon key={index} icon="material-symbols:star-rounded" className="text-amber-400 text-xs md:text-base" />;
            } else if (avgRating >= starValue - 0.5) {
                // Half Star
                return <Icon key={index} icon="material-symbols:star-half-rounded" className="text-amber-400 text-xs md:text-base" />;
            } else {
                // Empty Star
                return <Icon key={index} icon="material-symbols:star-outline-rounded" className="text-zinc-700 text-xs md:text-base" />;
            }
        });
    };

    const avgRating = rating?.average || 0;
    const reviewCount = rating?.count || 0;

    return (
        <div className="group relative bg-zinc-950 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-500 cursor-pointer h-full flex flex-col">
            
            {/* --- IMAGE CONTAINER --- */}
            <div className="image-container w-full aspect-square relative overflow-hidden bg-black">
                
                {/* Images (Zoom Effect Wrapper) */}
                <div className="w-full h-full transition-transform duration-700 group-hover:scale-[107%] will-change-transform">
                    {/* Main Image */}
                    <img 
                        src={mainImage} 
                        alt={name} 
                        className="w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-500 group-hover:opacity-0" 
                    />
                    {/* Hover Image (Reveals underneath) */}
                    <img 
                        src={hoverImage} 
                        alt={name} 
                        className="w-full h-full object-cover absolute inset-0 z-0" 
                    />
                </div>

                {/* Sale Badge */}
                {originalPrice > price && (
                    <div className="absolute top-0 left-0 z-30">
                        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white text-[9px] md:text-[10px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-lg">
                            Sale
                        </div>
                    </div>
                )}
            </div>

            {/* --- DETAILS SECTION --- */}
            <div className="p-2 lg:p-4 relative flex-1 flex flex-col justify-between bg-zinc-950">
                
                {/* Hover Gradient Line */}
                <div className="absolute top-0 left-0 w-0 h-px bg-gradient-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

                <div>
                    {/* Category/Tag */}
                    <span className="text-[9px] md:text-[10px] font-semibold lg:font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                        Noctowls
                    </span>

                    {/* Product Name */}
                    <h3 className="text-zinc-100 text-xs md:text-sm font-semibold lg:font-bold uppercase tracking-wide leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                        {name}
                    </h3>
                </div>

                {/* Price & Rating Section */}
                <div className="mt-3 flex items-end justify-between gap-2">
                    
                    {/* Left Side: Price */}
                    <div className="flex flex-col">
                        {originalPrice && originalPrice !== price && (
                            <span className="text-zinc-500 text-[12px] font-medium line-through decoration-zinc-600/50">
                                Rs. {originalPrice}.00
                            </span>
                        )}
                        <span className="text-white text-sm md:text-base font-semibold lg:font-bold tracking-tight">
                            Rs. {price}.00
                        </span>
                    </div>
                    
                    {/* Right Side: Rating & Reviews */}
                    <div className="flex flex-col items-end gap-0.5 mb-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] md:text-xs font-medium text-white leading-none">
                                {avgRating}
                            </span>
                            <div className="flex items-center">
                                {renderStars(avgRating)}
                            </div>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-zinc-400 font-medium">
                            ({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductListItem;