import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";
import {
  openQuickAddDrawer,
  selectCart,
} from "../../../store/features/user/cartSlice";
import {
  toggleWishlist,
  selectIsProductInWishlist,
} from "../../../store/features/user/wishlistSlice";
import { getRecentlyViewed } from "../../../utils/helpers/recentlyViewedHelper";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import { trackEvent } from "../../../utils/pixel/pixel";
import { renderUnlockLineWithGreenFree } from "../../bag/CartDrawer";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const SIZE_CHIP_MAP = {
  l: "600x300mm | 3mm Heavy Density",
  xl: "800x330mm | 3mm Heavy Density",
  xxl: "900x400mm | 3mm Heavy Density",
};

const RecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState([]);

  const loadProducts = () => {
    const products = getRecentlyViewed();
    setRecentProducts(products);
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener("recentlyViewedUpdated", loadProducts);

    return () => {
      window.removeEventListener("recentlyViewedUpdated", loadProducts);
    };
  }, []);

  if (!recentProducts || recentProducts.length === 0) return null;

  return (
    <section className="recently-viewed-section mt-10 pt-10 border-t border-zinc-200 w-full">
      <h2 className="text-[#0f0f0f] text-xl md:text-2xl font-black uppercase mb-8 tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
        Recently Viewed{" "}
        <Icon icon="mdi:eye-outline" className="text-red-600" />
      </h2>

      {/* ==================== MOBILE / TABLET (SWIPER) ==================== */}
      <div className="block lg:hidden">
        <Swiper
          slidesPerView={1.4}
          spaceBetween={16}
          breakpoints={{
            500: { slidesPerView: 2.2, spaceBetween: 16 },
            768: { slidesPerView: 2.5, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="pb-4 px-1"
        >
          {recentProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ==================== DESKTOP (GRID) ==================== */}
      <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

// ==================== REUSABLE PRODUCT CARD COMPONENT ====================
const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.auth.user);
  const isAdmin = useSelector((state) => state.adminAuth.admin);
  const isLoggedInUser = Boolean(user && !isAdmin);

  const cart = useSelector(selectCart);
  const isInWishlist = useSelector(selectIsProductInWishlist(product.id));

  const [imgLoaded, setImgLoaded] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const purchasedItems =
    cart?.items?.filter((item) => !item.isFreeGift) || [];
  const totalCartQuantity =
    cart?.summary?.totalQuantity ??
    purchasedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const isAddedToCart = purchasedItems.some((item) => {
    const itemProdId = String(
      item.product?._id || item.product?.id || item.product || ""
    );
    return itemProdId === String(product.id);
  });

  const rawMainUrl =
    product.images && product.images.length > 0 ? product.images[0].url : "";
  const mainImage = optimizeImage(rawMainUrl, { width: 500, quality: 80 });
  const seoAltText = `${product.name} Extended Gaming Deskmat 900x400mm`;
  const specChipLabel =
    SIZE_CHIP_MAP[String(product.primarySize || "l").toLowerCase()] ||
    SIZE_CHIP_MAP.l;
  const isOutOfStock = product.inStock === false;

  const discount =
    product.originalPrice &&
    product.price &&
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  // Opens the 50-60% Bottom Slide-Up Quick-Add Drawer for size & quantity selection
  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isAdmin) return;
    dispatch(openQuickAddDrawer(product));
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedInUser) {
      toast.info(
        isAdmin
          ? "Please logout from admin account!"
          : "Please login to add items to your wishlist!",
        toastControls
      );
      navigate("/account/signin", { state: { from: location.pathname } });
      return;
    }

    if (togglingWishlist) return;
    setTogglingWishlist(true);

    try {
      const result = await dispatch(toggleWishlist(product.id)).unwrap();
      if (result.isInWishlist) {
        const numericVal =
          Number(String(product.price || "0").replace(/,/g, "")) || 0;
        trackEvent("AddToWishlist", {
          content_name: product.name,
          content_ids: [product.id],
          content_type: "product",
          value: numericVal,
          currency: "INR",
        });
      }
      toast.success(
        result.message ||
          (result.isInWishlist
            ? "Added to wishlist!"
            : "Removed from wishlist"),
        toastControls
      );
    } catch (error) {
      toast.error(error || "Failed to update wishlist", toastControls);
    } finally {
      setTogglingWishlist(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-300 h-full flex flex-col"
      onClick={() => window.scrollTo(0, 0)}
    >
      {/* Image Container with Lazy Shimmer */}
      <div className="w-full aspect-4/3 overflow-hidden bg-zinc-100 relative">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-zinc-200 animate-pulse z-0" />
        )}
        <img
          src={mainImage}
          alt={seoAltText}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 will-change-transform ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute top-0 left-0 z-10">
          <div className="bg-linear-to-r from-zinc-100 to-zinc-200 text-zinc-600 text-[9px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-sm border-b border-r border-zinc-200">
            Recent
          </div>
        </div>

        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded z-10">
            -{discount}%
          </div>
        )}

        {/* Persistent Hardware Spec Pill (Size L default dimensions) */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-start pointer-events-none">
          <span className="inline-flex items-center bg-black/75 backdrop-blur-md text-white border border-white/15 text-[8.5px] sm:text-[9.5px] md:text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full shadow-sm truncate">
            {specChipLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 relative bg-white flex-1 flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="text-[#0f0f0f] text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              {product.originalPrice &&
                product.originalPrice !== product.price && (
                  <span className="text-zinc-400 text-[10px] font-medium line-through decoration-zinc-300">
                    Rs. {product.originalPrice}
                  </span>
                )}
              <span className="text-[#0f0f0f] text-sm md:text-base font-black tracking-tight">
                Rs. {product.price}
              </span>
            </div>
          </div>

          {/* 1-Line Dynamic Unlock Message directly ON TOP of the Add to Cart button */}
          {isAddedToCart && totalCartQuantity > 0 && (
            <div className="w-full text-[9.5px] sm:text-[10.5px] font-semibold text-[#0f0f0f] bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-center leading-tight animate-in slide-in-from-bottom-1 fade-in duration-200 truncate">
              {renderUnlockLineWithGreenFree(totalCartQuantity)}
            </div>
          )}

          {/* Action Row: Rectangular Add to Cart + Square Wishlist Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleQuickAddToCart}
              disabled={isOutOfStock || isAdmin}
              className={`flex-1 h-8 md:h-9 px-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isOutOfStock
                  ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                  : isAddedToCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                  : "bg-[#0f0f0f] text-white hover:bg-red-600 cursor-pointer shadow-xs"
              }`}
            >
              {isOutOfStock ? (
                <span>Out of Stock</span>
              ) : isAddedToCart ? (
                <>
                  <Icon icon="mdi:check-circle" className="text-sm" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Icon
                    icon="material-symbols:shopping-bag-outline"
                    className="text-sm"
                  />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWishlistClick}
              disabled={togglingWishlist}
              aria-label={
                isInWishlist ? "Remove from wishlist" : "Add to wishlist"
              }
              title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className={`w-8 h-8 md:w-9 md:h-9 aspect-square shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                isInWishlist
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  : "bg-white border-zinc-200 text-zinc-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              }`}
            >
              {togglingWishlist ? (
                <Icon icon="eos-icons:loading" className="text-sm text-red-600" />
              ) : (
                <Icon
                  icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"}
                  className="text-base md:text-lg"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecentlyViewed;