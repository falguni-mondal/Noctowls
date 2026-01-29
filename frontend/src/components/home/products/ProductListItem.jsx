import { Icon } from '@iconify/react/dist/iconify.js';

const ProductListItem = ({ product }) => {
    const { name, images, rating, originalPrice, price } = product;

    // Safe image access
    const mainImage = images?.[0]?.url || "";
    const hoverImage = images?.[1]?.url || mainImage;

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

                {/* Glassmorphism Button Overlay */}
                {/* <div className="absolute inset-0 z-20 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-6">
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-full tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-white hover:text-black hover:border-white flex items-center gap-2">
                        View Details <Icon icon="solar:arrow-right-linear" />
                    </span>
                </div> */}

                {/* Sale Badge */}
                {originalPrice > price && (
                    <div className="absolute top-0 left-0 z-30">
                        <div className="bg-linear-to-r from-red-600 to-red-800 text-white text-[9px] md:text-[10px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-lg">
                            Sale
                        </div>
                    </div>
                )}

                {/* Rating Badge (Overlaid on image for cleaner look) */}
                <div className="absolute top-2 right-2 z-30 bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-1 rounded flex items-center gap-1">
                    <Icon icon="material-symbols:star-rounded" className="text-amber-400 text-xs" />
                    <span className="text-[10px] font-semibold lg:font-bold text-white">{rating?.average || 0}</span>
                </div>
            </div>

            {/* --- DETAILS SECTION --- */}
            <div className="p-2 lg:p-4 relative flex-1 flex flex-col justify-between bg-zinc-950">
                
                {/* Hover Gradient Line */}
                <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

                <div>
                    {/* Category/Tag (Optional, if you have it in data, otherwise generic) */}
                    <span className="text-[9px] md:text-[10px] font-semibold lg:font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                        Noctowls
                    </span>

                    {/* Product Name */}
                    <h3 className="text-zinc-100 text-xs md:text-sm font-semibold lg:font-bold uppercase tracking-wide leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                        {name}
                    </h3>
                </div>

                {/* Price Section */}
                <div className="mt-3 flex items-end gap-2">
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
                    
                    {/* Visual spacer or reviews count */}
                    <span className="text-[10px] text-zinc-300 mb-1 ml-auto font-medium">
                        ({rating?.count || 0} Reviews)
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductListItem;