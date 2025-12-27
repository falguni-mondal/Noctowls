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
        <li className='w-full relative'>
            {/* Loading Overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                    <Icon icon="eos-icons:loading" className="text-3xl text-white" />
                </div>
            )}

            <div className="wishlist-product-main-dets w-full">
                <Link to={`/products/${product._id}`} className='w-full flex justify-between'>
                    <div className="wishlist-product-img aspect-square rounded bg-zinc-800 overflow-hidden w-[33%] shrink-0 relative">
                        <img 
                            className='w-full h-full object-cover' 
                            src={product.images?.[0]?.url || '/placeholder-image.jpg'} 
                            alt={product.name}
                            onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                            }}
                        />
                        {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <span className="text-xs font-semibold text-red-400 bg-black/80 px-2 py-1 rounded">
                                    OUT OF STOCK
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="wishlist-product-dets w-[63%]">
                        <h2 className="wishlist-product-name font-medium text-lg tracking-wide w-full line-clamp-2">
                            {product.name}
                        </h2>
                        
                        {displayPrice && (
                            <>
                                {displayPrice.discount > 0 ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="wishlist-product-price font-medium text-lg tracking-wide">
                                            ₹{displayPrice.price}
                                        </p>
                                        <p className="text-sm text-zinc-500 line-through">
                                            ₹{displayPrice.formattedOriginalPrice}
                                        </p>
                                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                            {displayPrice.discount}% OFF
                                        </span>
                                    </div>
                                ) : (
                                    <p className="wishlist-product-price font-medium text-lg tracking-wide mt-1">
                                        ₹{displayPrice.price}
                                    </p>
                                )}
                            </>
                        )}

                        <p className="wishlist-product-category font-medium tracking-wide text-zinc-400 capitalize mt-1">
                            {product.category?.replace('-', ' ')}
                        </p>

                        {/* Stock Status */}
                        {!isOutOfStock && (
                            <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                                <Icon icon="mdi:check-circle" className="text-base" />
                                In Stock
                            </p>
                        )}

                        {/* Added date */}
                        <p className="text-xs text-zinc-500 mt-2">
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
                <div className="mt-4 p-4 bg-zinc-900 rounded border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium">Select Size:</label>
                        <button
                            onClick={() => setShowSizeSelector(false)}
                            className="text-zinc-500 hover:text-zinc-300"
                        >
                            <Icon icon="mdi:close" className="text-lg" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {availableSizes.map((size) => (
                            <button
                                key={size.value}
                                onClick={() => setSelectedSize(size.value)}
                                className={`px-3 py-2 rounded border text-sm font-medium transition ${
                                    selectedSize === size.value
                                        ? 'border-indigo-500 bg-indigo-600 text-white'
                                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                                }`}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="uppercase">{size.label || size.value}</span>
                                    <span className="text-xs text-zinc-400">₹{size.price}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {outOfStockSizes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-2">Out of stock sizes:</p>
                            <div className="flex flex-wrap gap-2">
                                {outOfStockSizes.map((size) => (
                                    <span
                                        key={size.value}
                                        className="px-2 py-1 text-xs bg-zinc-800 text-zinc-600 rounded line-through uppercase"
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
                        className="w-full mt-3 bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                        {moveLoading ? (
                            <>
                                <Icon icon="eos-icons:loading" className="text-lg" />
                                Moving to Cart...
                            </>
                        ) : (
                            <>
                                <Icon icon="material-symbols:add-shopping-cart" className="text-lg" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="wishlist-product-actions w-full flex items-center gap-3 mt-4">
                {!isOutOfStock ? (
                    <>
                        {/* Move to Cart Button */}
                        <button
                            onClick={() => setShowSizeSelector(!showSizeSelector)}
                            disabled={isUpdating || moveLoading}
                            className="flex-1 bg-red-600 text-white text-sm py-2.5 px-5 rounded font-medium hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            <Icon icon="material-symbols:add-shopping-cart" className="text-lg" />
                            {showSizeSelector ? 'Cancel' : 'Add to Cart'}
                        </button>

                        {/* View Product Button */}
                        <Link
                            to={`/products/${product._id}`}
                            className="flex-1 bg-zinc-800 text-white text-sm py-2.5 rounded font-medium hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                        >
                            <Icon icon="mdi:eye-outline" className="text-lg" />
                            View
                        </Link>
                    </>
                ) : (
                    <Link
                        to={`/products/${product._id}`}
                        className="flex-1 bg-zinc-800 text-white py-2.5 rounded font-medium hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                    >
                        <Icon icon="mdi:bell-outline" className="text-lg" />
                        Notify When Available
                    </Link>
                )}

                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    disabled={isUpdating || actionLoading}
                    className="w-12 h-10 bg-zinc-800 rounded flex items-center justify-center text-red-400 hover:bg-red-950 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Remove from wishlist"
                >
                    <Icon icon="material-symbols:favorite-rounded" className="text-xl" />
                </button>
            </div>
        </li>
    );
};

export default WishlistItem;