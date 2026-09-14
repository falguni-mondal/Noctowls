import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getWishlist, 
  clearWishlist,
  selectWishlistItems, 
  selectWishlistLoading, 
  selectWishlistItemsCount,
  selectWishlistActionLoading 
} from '../store/features/user/wishlistSlice';
import WishlistItem from '../components/wishlist/WishlistItem';
import Loader from '../utils/loader/Loader';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { toast } from 'react-toastify';
import toastControls from '../utils/global/toastControls';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectWishlistItems);
  const loading = useSelector(selectWishlistLoading);
  const itemsCount = useSelector(selectWishlistItemsCount);
  const actionLoading = useSelector(selectWishlistActionLoading);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch, user]);

  const handleClearAll = async () => {
    if (window.confirm(`Are you sure you want to remove all ${itemsCount} items from your wishlist?`)) {
      try {
        await dispatch(clearWishlist()).unwrap();
        toast.success('Wishlist cleared successfully!', toastControls);
      } catch (error) {
        toast.error(error || 'Failed to clear wishlist', toastControls);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );
  }

  // Check if wishlist is empty
  const isWishlistEmpty = !items || items.length === 0;

  return (
    // Light theme main wrapper
    <div className='py-10 min-h-[70vh] bg-[#f4f4f4] text-[#0f0f0f]' id='wishlist-page'>
      <div className="page-header px-3 md:px-6 max-w-3xl mx-auto mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-heading text-2xl md:text-3xl font-bold uppercase tracking-wide">
              Your Wishlist
            </h1>
            {!isWishlistEmpty && (
              <p className="text-sm text-zinc-500 mt-1 font-medium">
                <span className="font-bold text-[#0f0f0f]">{itemsCount}</span> {itemsCount === 1 ? 'item' : 'items'} saved
              </p>
            )}
          </div>
          
          {!isWishlistEmpty && (
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="text-sm font-bold text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <Icon icon="material-symbols:delete-outline" className="text-xl" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Empty Wishlist */}
        {isWishlistEmpty ? (
          <div className="empty-wishlist px-3 pt-5 pb-20 text-center flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-white border border-zinc-200 shadow-sm rounded-full flex items-center justify-center mb-6">
                <Icon
                icon="mdi:heart-outline"
                className="text-zinc-300 text-7xl"
                />
            </div>

            <h2 className="text-2xl font-bold mb-3 text-[#0f0f0f]">Your wishlist is empty</h2>
            <p className="text-zinc-500 font-medium mb-8 max-w-md">
              Save your favorite items here and never lose track of what you love!
            </p>

            <Link
              to="/catalog"
              className="inline-block bg-red-600 text-white px-10 py-3.5 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-red-600/20 hover:bg-red-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Items */}
            <section className='px-3 md:px-6' id="wishlist-items-collection-container">
              <ul className="wishlist-items-collection space-y-6">
                {items.map((item) => (
                  <WishlistItem key={item._id} item={item} />
                ))}
              </ul>
            </section>

            {/* Wishlist Benefits Banner - Light Theme Pastel */}
            <section className="px-3 md:px-6 mt-10">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <Icon icon="solar:star-bold" className="text-indigo-500 text-2xl mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-indigo-900 font-bold mb-3 uppercase tracking-wider text-sm">
                      Why use wishlist?
                    </h3>
                    <ul className="space-y-2 text-sm font-medium text-indigo-700/80">
                      <li className="flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="text-green-600 text-base" />
                        Save items for later and never lose them
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="text-green-600 text-base" />
                        Get notified when prices drop (coming soon)
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="text-green-600 text-base" />
                        Share your wishlist with friends & family
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Continue Shopping */}
            <section className="px-3 md:px-6 mt-8">
              <Link
                to="/catalog"
                className="w-full bg-white border border-zinc-300 shadow-sm text-[#0f0f0f] py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all"
              >
                <Icon icon="material-symbols:add-shopping-cart" className="text-xl" />
                Continue Shopping
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;