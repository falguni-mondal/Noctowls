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
                // Empty Star - Updated for light theme
                return <Icon key={index} icon="material-symbols:star-outline-rounded" className="text-zinc-300 text-xs md:text-base" />;
            }
        });
    };

    const avgRating = rating?.average || 0;
    const reviewCount = rating?.count || 0;

    return (
        // Updated to bg-white and border-zinc-200
        <div className="group relative bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-red-600/30 transition-all duration-500 cursor-pointer h-full flex flex-col">
            
            {/* --- IMAGE CONTAINER --- */}
            {/* Updated to bg-zinc-100 for a soft backdrop behind products */}
            <div className="image-container w-full aspect-square relative overflow-hidden bg-zinc-100">
                
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
            {/* Updated bg to white */}
            <div className="p-2 lg:p-4 relative flex-1 flex flex-col justify-between bg-white">
                
                {/* Hover Gradient Line */}
                <div className="absolute top-0 left-0 w-0 h-px bg-gradient-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

                <div>
                    {/* Category/Tag */}
                    <span className="text-[9px] md:text-[10px] font-semibold lg:font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                        Noctowls
                    </span>

                    {/* Product Name - Updated to dark text */}
                    <h3 className="text-[#0f0f0f] text-xs md:text-sm font-semibold lg:font-bold uppercase tracking-wide leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                        {name}
                    </h3>
                </div>

                {/* Price & Rating Section */}
                <div className="mt-3 flex items-end justify-between gap-2">
                    
                    {/* Left Side: Price */}
                    <div className="flex flex-col">
                        {originalPrice && originalPrice !== price && (
                            <span className="text-zinc-500 text-[12px] font-medium line-through decoration-zinc-300">
                                Rs. {originalPrice}.00
                            </span>
                        )}
                        {/* Current price updated to dark text */}
                        <span className="text-[#0f0f0f] text-sm md:text-base font-semibold lg:font-bold tracking-tight">
                            Rs. {price}.00
                        </span>
                    </div>
                    
                    {/* Right Side: Rating & Reviews */}
                    <div className="flex flex-col items-end gap-0.5 mb-0.5">
                        <div className="flex items-center gap-1.5">
                            {/* Rating number updated to dark text */}
                            <span className="text-[10px] md:text-xs font-semibold text-[#0f0f0f] leading-none">
                                {avgRating}
                            </span>
                            <div className="flex items-center">
                                {renderStars(avgRating)}
                            </div>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-zinc-500 font-medium">
                            ({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductListItem;