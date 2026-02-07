import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { updateCartItemQuantity, removeCartItem, selectActionLoading } from '../../store/features/user/cartSlice';
import { useState } from 'react';

const BagItem = ({ item }) => {
    const dispatch = useDispatch();
    const actionLoading = useSelector(selectActionLoading);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleQuantityChange = async (action) => {
        if (isUpdating || actionLoading) return;

        setIsUpdating(true);
        let newQuantity = item.quantity;

        if (action === 'increment') {
            newQuantity = item.quantity + 1;
        } else if (action === 'decrement' && item.quantity > 1) {
            newQuantity = item.quantity - 1;
        } else if (action === 'decrement' && item.quantity === 1) {
            // Remove item if quantity would be 0
            await dispatch(removeCartItem(item._id));
            setIsUpdating(false);
            return;
        }

        try {
            await dispatch(updateCartItemQuantity({ 
                itemId: item._id, 
                quantity: newQuantity 
            })).unwrap();
        } catch (error) {
            console.error('Failed to update quantity:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemove = async () => {
        if (isUpdating || actionLoading) return;

        setIsUpdating(true);
        try {
            await dispatch(removeCartItem(item._id)).unwrap();
        } catch (error) {
            console.error('Failed to remove item:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <li className='w-full relative'>
            {/* Loading Overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                    <Icon icon="eos-icons:loading" className="text-3xl text-white" />
                </div>
            )}

            <div className="cart-product-main-dets w-full">
                <Link to={`/products/${item.product._id}`} className='w-full flex justify-between'>
                    <div className="cart-product-img aspect-square rounded bg-zinc-800 overflow-hidden w-[33%] shrink-0">
                        <img 
                            className='w-full h-full object-cover' 
                            src={item.image || '/placeholder-image.jpg'} 
                            alt={item.name}
                            onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                            }}
                        />
                    </div>
                    <div className="cart-product-dets w-[63%]">
                        <h2 className="cart-product-name font-medium text-lg tracking-wide w-full truncate">
                            {item.name}
                        </h2>
                        
                        {item.discount > 0 && (
                            <div className="flex items-center gap-2">
                                <p className="cart-product-price font-medium text-lg tracking-wide">
                                    ₹{item.price.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-zinc-500 line-through">
                                    ₹{item.originalPrice.toLocaleString('en-IN')}
                                </p>
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                    {item.discount}% OFF
                                </span>
                            </div>
                        )}
                        {item.discount === 0 && (
                            <p className="cart-product-price font-medium text-lg tracking-wide">
                                ₹{item.price.toLocaleString('en-IN')}
                            </p>
                        )}

                        {item.couponDiscountPerItem > 0 && (
                            <p className="text-sm text-green-400">
                                Coupon: -₹{item.totalCouponDiscount.toLocaleString('en-IN')}
                            </p>
                        )}

                        <p className="cart-product-category font-medium tracking-wide text-zinc-400 capitalize">
                            {item.category.replace('-', ' ')}
                        </p>
                        <p className="cart-product-size font-medium text-zinc-400">
                            Size: <span className='underline uppercase'>{item.size.label || item.size.value}</span>
                        </p>
                    </div>
                </Link>
            </div>

            <div className="cart-product-actions w-full flex items-center gap-5 mt-1">
                <div className="cart-product-quantity w-[33%] rounded-full flex items-center justify-between border border-zinc-800">
                    <button 
                        onClick={() => handleQuantityChange('decrement')}
                        disabled={isUpdating || actionLoading}
                        className='w-10 aspect-square rounded-full font-medium text-lg flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition'
                    >
                        <Icon icon="ic:baseline-minus" />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                        onClick={() => handleQuantityChange('increment')}
                        disabled={isUpdating || actionLoading}
                        className='w-10 aspect-square rounded-full font-medium text-lg flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition'
                    >
                        <Icon icon="material-symbols:add" />
                    </button>
                </div>
                
                {/* Wishlist Button */}
                <div className="add-to-wishlist-btn w-10 aspect-square rounded-full border border-zinc-800 flex justify-center items-center text-xl hover:bg-zinc-800 transition cursor-pointer">
                    <Icon icon="material-symbols-light:favorite-outline" />
                </div>

                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    disabled={isUpdating || actionLoading}
                    className="ml-auto text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove item"
                >
                    <Icon icon="material-symbols:delete-outline" className="text-xl pointer-events-none" />
                </button>
            </div>
        </li>
    );
};

export default BagItem;