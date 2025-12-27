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
      <div className="w-full min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // Check if wishlist is empty
  const isWishlistEmpty = !items || items.length === 0;

  return (
    <div className='py-10 min-h-[70vh]' id='wishlist-page'>
      <div className="page-header px-3 mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-heading text-2xl font-medium">
              Your Wishlist
            </h1>
            {!isWishlistEmpty && (
              <p className="text-sm text-zinc-400 mt-1">
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} saved
              </p>
            )}
          </div>
          
          {!isWishlistEmpty && (
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Icon icon="material-symbols:delete-outline" className="text-lg" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty Wishlist */}
      {isWishlistEmpty ? (
        <div className="empty-wishlist px-3 pt-5 pb-20 text-center flex flex-col items-center justify-center">
          <Icon
            icon="mdi:heart-outline"
            className="text-zinc-600 text-8xl mb-6"
          />

          <h2 className="text-2xl font-semibold mb-3">Your wishlist is empty</h2>
          <p className="text-zinc-400 mb-8 max-w-md">
            Save your favorite items here and never lose track of what you love!
          </p>

          <Link
            to="/catalog"
            className="inline-block bg-red-600 text-white px-8 py-3 rounded font-medium hover:bg-red-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Wishlist Items */}
          <section className='px-3' id="wishlist-items-collection-container">
            <ul className="wishlist-items-collection space-y-8">
              {items.map((item) => (
                <WishlistItem key={item._id} item={item} />
              ))}
            </ul>
          </section>

          {/* Wishlist Benefits Banner */}
          <section className="px-3 mt-10">
            <div className="bg-linear-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-900/50 rounded-lg p-5">
              <div className="flex items-start gap-4">
                <Icon icon="solar:star-bold" className="text-indigo-400 text-2xl mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-indigo-200 font-medium mb-2">
                    Why use wishlist?
                  </h3>
                  <ul className="space-y-2 text-sm text-indigo-300">
                    <li className="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-green-400" />
                      Save items for later and never lose them
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-green-400" />
                      Get notified when prices drop (coming soon)
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-green-400" />
                      Share your wishlist with friends & family
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Continue Shopping */}
          <section className="px-3 mt-8">
            <Link
              to="/catalog"
              className="w-full bg-zinc-800 text-white py-3 rounded font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <Icon icon="material-symbols:add-shopping-cart" className="text-xl" />
              Continue Shopping
            </Link>
          </section>
        </>
      )}
    </div>
  );
};

export default WishlistPage;