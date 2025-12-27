import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, selectCart, selectCartLoading, selectCartError } from '../store/features/user/cartSlice';
import BagItem from '../components/bag/BagItem';
import BagGiftItem from '../components/bag/BagGiftItem';
import Loader from '../utils/loader/Loader';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

const Bagpage = () => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const loading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);
  const user = useSelector(state => state.auth.user);
  const admin = useSelector(state => state.adminAuth.admin);

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch, user, admin]);

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

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // Check if cart is empty
  const isCartEmpty = !cart || purchasedItems.length === 0;

  return (
    <div className='py-10 min-h-screen' id='bag-page'>
      <div className="page-header px-3 mb-10">
        <h1 className="page-heading text-2xl font-medium">
          Your Bag
        </h1>
        {cart && !isCartEmpty && (
          <p className="text-sm text-zinc-400 mt-1">
            {cart.summary.itemsCount} {cart.summary.itemsCount === 1 ? 'item' : 'items'}
            {' '}({cart.summary.totalQuantity} total)
            {freeGiftItems.length > 0 && (
              <span className="text-green-400 ml-2">
                + {freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0)} free gift{freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0) > 1 ? 's' : ''}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Empty Cart */}
      {isCartEmpty ? (
        <div className="empty-bag px-3 pt-5 pb-20 text-center flex flex-col items-center justify-center">
          <Icon
            icon="solar:bag-4-broken"
            className="text-zinc-600 text-8xl mb-6"
          />

          <h2 className="text-2xl font-semibold mb-3">Your bag is empty</h2>
          <p className="text-zinc-400 mb-8 max-w-md">
            There are no products in your cart. Start shopping now!
          </p>

          <Link
            to="/catalog"
            className="inline-block bg-red-600 text-white px-8 py-3 rounded font-medium hover:bg-red-700 transition"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <>
          {/* Purchased Items */}
          <section className='px-3' id="bag-items-collection-container">
            <h2 className="text-lg font-medium mb-4">Your Items</h2>
            <ul className="bag-items-collection space-y-8">
              {purchasedItems.map((item) => (
                <BagItem key={item._id} item={item} />
              ))}
            </ul>
          </section>

          {/* Free Gifts Section */}
          {freeGiftItems.length > 0 && (
            <section className='px-3 mt-10'>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <Icon icon="solar:gift-bold" className="text-green-400 text-xl" />
                  <span>Free Gifts</span>
                  {cart?.freeGifts?.highestTier && (
                    <span className="text-sm text-zinc-400 font-normal">
                      (Tier {cart.freeGifts.highestTier})
                    </span>
                  )}
                </h2>
              </div>

              <ul className="bag-items-collection space-y-5">
                {freeGiftItems.map((gift) => (
                  <BagGiftItem key={gift._id} gift={gift} />
                ))}
              </ul>
            </section>
          )}

          {/* Next Tier Info */}
          {cart?.freeGifts?.eligible && cart?.nextTierInfo && cart.nextTierInfo.itemsNeeded > 0 && (
            <div className="px-3 mt-5">
              <div className="bg-indigo-900/30 border border-indigo-700 rounded p-4">
                <div className="flex items-start gap-3">
                  <Icon icon="solar:star-bold" className="text-indigo-400 text-xl mt-0.5 shrink-0" />
                  <div>
                    <p className="text-indigo-200 font-medium mb-1">
                      Unlock More Free Gifts!
                    </p>
                    <p className="text-indigo-300 text-sm">
                      {cart.nextTierInfo.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No free gifts yet */}
          {!cart?.freeGifts?.eligible && (
            <div className="px-3 mt-5">
              <div className="bg-amber-900/30 border border-amber-700 rounded p-4">
                <div className="flex items-start gap-3">
                  <Icon icon="solar:gift-linear" className="text-amber-400 text-xl mt-0.5 shrink-0" />
                  <div>
                    <p className="text-amber-200 font-medium mb-1">
                      Get Free Gifts!
                    </p>
                    <p className="text-amber-300 text-sm">
                      Add items to your cart to unlock amazing free gifts!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Summary */}
          <section className="px-3 mt-10">
            <div className="bg-zinc-900 rounded p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-medium">₹{cart.summary.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart?.coupon?.isApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount ({cart.coupon.code})</span>
                  <span>-₹{cart.summary.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {freeGiftItems.length > 0 && (
                <div className="flex justify-between text-green-400 text-sm">
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:gift-bold" className="text-base" />
                    Free Gifts ({freeGiftItems.reduce((sum, gift) => sum + gift.quantity, 0)})
                  </span>
                  <span className="font-semibold">FREE</span>
                </div>
              )}

              <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{cart.summary.total.toLocaleString('en-IN')}</span>
              </div>

              {cart.summary.couponDiscount > 0 && (
                <p className="text-sm text-green-400 flex items-center gap-1">
                  <Icon icon="mdi:tag" />
                  <span>You saved ₹{cart.summary.couponDiscount.toLocaleString('en-IN')}!</span>
                </p>
              )}
            </div>

            <button className="w-full bg-red-600 text-white py-4 rounded font-semibold mt-5 hover:bg-red-700 transition-all">
              Proceed to Checkout
            </button>
          </section>
        </>
      )}
    </div>
  );
};

export default Bagpage;