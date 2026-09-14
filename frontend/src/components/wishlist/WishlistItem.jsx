import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { 
  removeFromWishlist, 
  moveToCart,
  selectWishlistActionLoading,
  selectWishlistMoveToCartLoading 
} from '../../store/features/user/wishlistSlice';
import { useState } from 'react';
import { toast } from 'react-toastify';
import toastControls from '../../utils/global/toastControls';

const WishlistItem = ({ item }) => {
    const dispatch = useDispatch();
    const actionLoading = useSelector(selectWishlistActionLoading);
    const moveLoading = useSelector(selectWishlistMoveToCartLoading);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [showSizeSelector, setShowSizeSelector] = useState(false);

    const product = item.product;

    // Get available sizes (in stock)
    const availableSizes = product?.sizes?.filter(size => size.stock > 0) || [];
    const outOfStockSizes = product?.sizes?.filter(size => size.stock === 0) || [];

    const handleRemove = async () => {
        if (isUpdating || actionLoading) return;

        setIsUpdating(true);
        try {
            await dispatch(removeFromWishlist(product._id)).unwrap();
            toast.success('Removed from wishlist', toastControls);
        } catch (error) {
            toast.error(error || 'Failed to remove item', toastControls);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMoveToCart = async () => {
        if (!selectedSize) {
            setShowSizeSelector(true);
            toast.info('Please select a size', toastControls);
            return;
        }

        if (isUpdating || moveLoading) return;

        setIsUpdating(true);
        try {
            const result = await dispatch(moveToCart({
                productId: product._id,
                sizeValue: selectedSize,
                quantity: 1
            })).unwrap();
            
            toast.success(result.message || 'Moved to cart successfully!', toastControls);
            setShowSizeSelector(false);
            setSelectedSize('');
        } catch (error) {
            toast.error(error || 'Failed to move to cart', toastControls);
        } finally {
            setIsUpdating(false);
        }
    };

    // Get first available size (for quick add)
    const firstAvailableSize = availableSizes[0];

    // Check if product is out of stock
    const isOutOfStock = availableSizes.length === 0;

    // Get price display (from first size)
    const displayPrice = product?.sizes?.[0];

    return (
        <li className='w-full relative bg-white border border-zinc-200 shadow-sm rounded-xl p-4'>
            {/* Loading Overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-20">
                    <Icon icon="eos-icons:loading" className="text-3xl text-red-600" />
                </div>
            )}

            <div className="wishlist-product-main-dets w-full">
                <Link to={`/products/${product._id}`} className='w-full flex justify-between'>
                    <div className="wishlist-product-img aspect-square rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden w-[30%] shrink-0 relative">
                        <img 
                            className='w-full h-full object-cover' 
                            src={product.images?.[0]?.url || '/placeholder-image.jpg'} 
                            alt={product.name}
                            onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                            }}
                        />
                        {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-[10px] font-bold text-red-600 bg-white border border-red-200 shadow-sm px-2 py-1 rounded uppercase tracking-wider">
                                    OUT OF STOCK
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="wishlist-product-dets w-[65%] pl-2">
                        <h2 className="wishlist-product-name font-bold text-[#0f0f0f] text-lg tracking-wide w-full line-clamp-2">
                            {product.name}
                        </h2>
                        
                        {displayPrice && (
                            <>
                                {displayPrice.discount > 0 ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="wishlist-product-price font-black text-[#0f0f0f] text-lg tracking-wide">
                                            ₹{displayPrice.price.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm font-medium text-zinc-400 line-through">
                                            ₹{displayPrice.originalPrice.toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded">
                                            {displayPrice.discount}% OFF
                                        </span>
                                    </div>
                                ) : (
                                    <p className="wishlist-product-price font-black text-[#0f0f0f] text-lg tracking-wide mt-1">
                                        ₹{displayPrice.price.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </>
                        )}

                        <p className="wishlist-product-category font-bold uppercase text-[10px] tracking-widest text-zinc-400 mt-2">
                            {product.category?.replace('-', ' ')}
                        </p>

                        {/* Stock Status */}
                        {!isOutOfStock && (
                            <p className="text-xs font-bold text-green-600 mt-1.5 flex items-center gap-1">
                                <Icon icon="mdi:check-circle" className="text-base" />
                                In Stock
                            </p>
                        )}

                        {/* Added date */}
                        <p className="text-xs font-medium text-zinc-400 mt-3">
                            Added {new Date(item.addedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Size Selector (Expandable) */}
            {showSizeSelector && !isOutOfStock && (
                <div className="mt-4 p-5 bg-white border border-zinc-200 shadow-sm rounded-xl relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-[#0f0f0f] uppercase tracking-wider">Select Size:</label>
                        <button
                            onClick={() => setShowSizeSelector(false)}
                            className="text-zinc-400 hover:text-[#0f0f0f] transition-colors"
                        >
                            <Icon icon="mdi:close" className="text-xl" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        {availableSizes.map((size) => (
                            <button
                                key={size.value}
                                onClick={() => setSelectedSize(size.value)}
                                className={`px-3 py-2.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${
                                    selectedSize === size.value
                                        ? 'border-[#0f0f0f] bg-[#0f0f0f] text-white shadow-black/20'
                                        : 'border-zinc-300 bg-white hover:border-[#0f0f0f] text-[#0f0f0f]'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="uppercase">{size.label || size.value}</span>
                                    <span className={`text-[10px] ${selectedSize === size.value ? 'text-zinc-300' : 'text-zinc-500'}`}>₹{size.price}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {outOfStockSizes.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-100">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Out of stock sizes:</p>
                            <div className="flex flex-wrap gap-2">
                                {outOfStockSizes.map((size) => (
                                    <span
                                        key={size.value}
                                        className="px-2 py-1 text-xs font-bold bg-zinc-100 border border-zinc-200 text-zinc-400 rounded line-through uppercase"
                                    >
                                        {size.label || size.value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleMoveToCart}
                        disabled={!selectedSize || moveLoading}
                        className="w-full mt-5 bg-[#0f0f0f] text-white py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        {moveLoading ? (
                            <>
                                <Icon icon="eos-icons:loading" className="text-xl" />
                                Moving to Cart...
                            </>
                        ) : (
                            <>
                                <Icon icon="material-symbols:add-shopping-cart" className="text-xl" />
                                Confirm & Add
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="wishlist-product-actions w-full flex items-center gap-3 mt-5 border-t border-zinc-100 pt-4">
                {!isOutOfStock ? (
                    <>
                        {/* Move to Cart Button */}
                        <button
                            onClick={() => setShowSizeSelector(!showSizeSelector)}
                            disabled={isUpdating || moveLoading}
                            className={`flex-1 text-sm py-3 px-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm border ${
                                showSizeSelector 
                                ? 'bg-white border-zinc-300 text-[#0f0f0f] hover:bg-zinc-50' 
                                : 'bg-[#0f0f0f] border-[#0f0f0f] text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Icon icon="material-symbols:add-shopping-cart" className="text-lg" />
                            {showSizeSelector ? 'Cancel' : 'Add to Cart'}
                        </button>

                        {/* View Product Button */}
                        <Link
                            to={`/products/${product._id}`}
                            className="flex-1 bg-white border border-zinc-300 text-[#0f0f0f] text-sm py-3 rounded-lg font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Icon icon="mdi:eye-outline" className="text-lg text-zinc-500" />
                            View
                        </Link>
                    </>
                ) : (
                    <Link
                        to={`/products/${product._id}`}
                        className="flex-1 bg-white border border-zinc-300 text-[#0f0f0f] py-3 rounded-lg font-bold hover:bg-zinc-50 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <Icon icon="mdi:bell-outline" className="text-lg text-amber-500" />
                        Notify When Available
                    </Link>
                )}

                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    disabled={isUpdating || actionLoading}
                    className="w-[52px] h-[46px] bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="Remove from wishlist"
                >
                    <Icon icon="material-symbols:favorite-rounded" className="text-2xl" />
                </button>
            </div>
        </li>
    );
};

export default WishlistItem;