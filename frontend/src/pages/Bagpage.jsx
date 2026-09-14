import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, selectCart, selectCartLoading, selectCartError } from '../store/features/user/cartSlice';
import BagItem from '../components/bag/BagItem';
import BagGiftItem from '../components/bag/BagGiftItem';
import Loader from '../utils/loader/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

// IMPORT PIXEL TRACKING
import { trackEvent } from '../utils/pixel/pixel';

const Bagpage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const loading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);
  const user = useSelector(state => state.auth.user);
  const admin = useSelector(state => state.adminAuth.admin);

  // Ref to ensure ViewCart only fires once per page visit
  const viewCartFired = useRef(false);

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch, user, admin]);

  // TRACK ViewCart EVENT (Optimized)
  useEffect(() => {
    // Only fire if: Cart loaded, has items, and hasn't fired yet
    if (!loading && cart && cart.items && cart.items.length > 0 && !viewCartFired.current) {
        
        // 1. Filter out Free Gifts (product is null) to avoid errors & catalog mismatches
        const pixelItems = cart.items.filter(item => item.product && !item.isFreeGift);
        
        if (pixelItems.length > 0) {
            // 2. Helper to get clean ID (Handle both .id and ._id from API)
            const getProductId = (item) => item.product._id || item.product.id;

            trackEvent('ViewCart', {
                currency: 'INR',
                value: Number(cart.summary.total),
                content_ids: pixelItems.map(item => getProductId(item)),
                content_type: 'product',
                contents: pixelItems.map(item => ({
                    id: getProductId(item),
                    quantity: item.quantity,
                    item_price: item.price
                }))
            });

            // Mark as fired so it doesn't fire again on quantity updates
            viewCartFired.current = true;
        }
    }
  }, [cart, loading]);

  // Filter purchased items
  const purchasedItems = cart?.items?.filter(item => !item.isFreeGift) || [];

  // Convert freeGifts.gifts array to items format
  const freeGiftItems = cart?.freeGifts?.eligible && cart?.freeGifts?.gifts?.length > 0
    ? cart.freeGifts.gifts.map((gift, index) => ({
      _id: `gift-${gift.category}-${index}`,
      name: gift.name,
      image: gift.image,
      category: gift.category || "gift",
      quantity: gift.quantity,
      originalPrice: (gift.originalPrice * gift.quantity) || 0,
    }))
    : [];

  const handleCheckout = () => {
    if (cart && cart.items.length > 0) {
        // Filter out free gifts for pixel accuracy
        const pixelItems = cart.items.filter(item => item.product && !item.isFreeGift);
        
        if (pixelItems.length > 0) {
            const getProductId = (item) => item.product._id || item.product.id;

            trackEvent('InitiateCheckout', {
                currency: 'INR',
                value: Number(cart.summary.total),
                num_items: cart.summary.totalQuantity,
                content_ids: pixelItems.map(item => getProductId(item)),
                content_type: 'product',
                contents: pixelItems.map(item => ({
                    id: getProductId(item),
                    quantity: item.quantity,
                    item_price: item.price
                }))
            });
        }
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      // Light theme loader wrapper
      <div className="w-full min-h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );
  }

  // Check if cart is empty
  const isCartEmpty = !cart || purchasedItems.length === 0;

  return (
    // Light theme main wrapper
    <div className='py-10 min-h-[80vh] bg-[#f4f4f4] text-[#0f0f0f]' id='bag-page'>
      
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="page-header mb-8 lg:mb-10 border-b border-zinc-200 pb-4 px-5 md:px-10">
          <h1 className="page-heading text-2xl md:text-3xl font-bold uppercase tracking-wide">
            Your Bag
          </h1>
          {cart && !isCartEmpty && (
            <p className="text-sm text-zinc-500 mt-2">
              <span className="font-semibold text-[#0f0f0f]">{cart.summary.itemsCount} {cart.summary.itemsCount === 1 ? 'item' : 'items'}</span>
              {' '} <span className="text-zinc-300 mx-1">|</span> Total Qty: {cart.summary.totalQuantity}
              {freeGiftItems.length > 0 && (
                <span className="text-green-600 ml-3 font-medium flex-inline items-center gap-1">
                  <Icon icon="solar:gift-bold" className="inline text-lg -mt-0.5" />
                  + {freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0)} Free Gift{freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0) > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Empty Cart State */}
        {isCartEmpty ? (
          <div className="empty-bag pb-20 flex flex-col items-center justify-center text-center">
            {/* Light theme empty state icon */}
            <div className="w-32 h-32 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                <Icon icon="solar:bag-4-broken" className="text-zinc-400 text-6xl" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[#0f0f0f]">Your bag is empty</h2>
            <p className="text-zinc-500 mb-8 max-w-md text-sm md:text-base">
              Looks like you haven't added anything to your cart yet.
            </p>

            <Link
              to="/catalog"
              className="bg-red-600 text-white px-10 py-3.5 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex px-5 md:px-10 flex-col lg:flex-row gap-8 xl:gap-12 relative">
            
            {/* --- LEFT COLUMN: ITEMS --- */}
            <div className="w-full lg:w-2/3 space-y-8">
              
              {/* Purchased Items */}
              <section id="bag-items-collection-container">
                <ul className="bag-items-collection space-y-6">
                  {purchasedItems.map((item) => (
                    <BagItem key={item._id} item={item} />
                  ))}
                </ul>
              </section>

              {/* Free Gifts Section */}
              {freeGiftItems.length > 0 && (
                <section className='pt-6 border-t border-zinc-200'>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-1.5 bg-green-100 rounded-full">
                        <Icon icon="solar:gift-bold" className="text-green-600 text-xl" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0f0f0f]">Free Gifts</h2>
                    {cart?.freeGifts?.highestTier && (
                        // Light theme tier badge
                        <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase tracking-wider border border-zinc-200">
                            Tier {cart.freeGifts.highestTier}
                        </span>
                    )}
                  </div>

                  <ul className="bag-items-collection space-y-4">
                    {freeGiftItems.map((gift) => (
                      <BagGiftItem key={gift._id} gift={gift} />
                    ))}
                  </ul>
                </section>
              )}

              {/* Next Tier Info - Light theme pastel box */}
              {cart?.freeGifts?.eligible && cart?.nextTierInfo && cart.nextTierInfo.itemsNeeded > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <Icon icon="solar:star-bold-duotone" className="text-indigo-500 text-2xl mt-0.5 shrink-0" />
                    <div>
                      <p className="text-indigo-700 font-bold mb-1 uppercase text-sm tracking-wider">
                        Unlock More Free Gifts!
                      </p>
                      <p className="text-indigo-600 text-sm leading-relaxed">
                        {cart.nextTierInfo.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No free gifts yet - Light theme warm box */}
              {!cart?.freeGifts?.eligible && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <Icon icon="solar:gift-linear" className="text-amber-500 text-2xl mt-0.5 shrink-0" />
                    <div>
                      <p className="text-amber-700 font-bold mb-1 uppercase text-sm tracking-wider">
                        Get Free Gifts!
                      </p>
                      <p className="text-amber-600 text-sm leading-relaxed">
                        Add items to your cart to unlock amazing free gifts!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- RIGHT COLUMN: SUMMARY (Sticky) --- */}
            <div className="w-full lg:w-1/3 h-fit lg:sticky lg:top-28">
              {/* Light theme solid white summary box */}
              <section className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold uppercase tracking-wider text-[#0f0f0f] mb-6 border-b border-zinc-200 pb-4">
                    Order Summary
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Subtotal</span>
                    <span className="font-bold text-[#0f0f0f]">₹{cart.summary.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {cart?.coupon?.isApplied && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center gap-1">
                          <Icon icon="mdi:ticket-percent" /> Coupon ({cart.coupon.code})
                      </span>
                      <span className="font-bold">-₹{cart.summary.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {freeGiftItems.length > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:gift-bold" />
                        Free Gifts ({freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0)})
                      </span>
                      {/* Light theme free badge */}
                      <span className="font-bold uppercase text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">Free</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-zinc-200 pt-4 mt-2">
                    <div className="flex justify-between items-end">
                        <span className="text-zinc-600 font-semibold text-base">Total</span>
                        <span className="text-xl font-black text-[#0f0f0f]">₹{cart.summary.total.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-zinc-500 text-right mt-1">Including all taxes</p>
                  </div>

                  {cart.summary.couponDiscount > 0 && (
                    // Light theme savings box
                    <div className="bg-green-50 border border-green-200 rounded p-2.5 text-center mt-2">
                        <p className="text-xs font-bold text-green-700 flex items-center justify-center gap-1">
                        <Icon icon="mdi:party-popper" className="text-base" />
                        You saved ₹{cart.summary.couponDiscount.toLocaleString('en-IN')} on this order!
                        </p>
                    </div>
                  )}
                </div>

                <button 
                    onClick={handleCheckout} 
                    className="w-full bg-red-600 text-white py-3.5 rounded font-bold uppercase mt-8 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group lg:text-sm"
                >
                  Checkout
                  <Icon icon="solar:arrow-right-linear" className="text-lg group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="mt-6 flex justify-center gap-5 text-zinc-400">
                    <Icon icon="logos:visa" className="text-lg opacity-50 grayscale hover:grayscale-0 transition-all" />
                    <Icon icon="logos:mastercard" className="text-lg opacity-50 grayscale hover:grayscale-0 transition-all" />
                    <Icon icon="logos:google-pay" className="text-lg opacity-50 grayscale hover:grayscale-0 transition-all" />
                    <Icon icon="logos:phonepe" className="text-lg opacity-50 grayscale hover:grayscale-0 transition-all" />
                </div>
              </section>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Bagpage;