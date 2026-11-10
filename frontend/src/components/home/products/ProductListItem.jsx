import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import { trackEvent } from "../../../utils/pixel/pixel";
import { renderUnlockLineWithGreenFree } from "../../bag/CartDrawer";

const SIZE_CHIP_MAP = {
  l: "600x300mm | 3mm Heavy Density",
  xl: "800x330mm | 3mm Heavy Density",
  xxl: "900x400mm | 3mm Heavy Density",
};

const ProductListItem = ({ product }) => {
  const {
    id,
    name,
    images,
    rating,
    originalPrice,
    price,
    numPrice,
    inStock,
    primarySize = "l",
  } = product;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.auth.user);
  const isAdmin = useSelector((state) => state.adminAuth.admin);
  const isLoggedInUser = Boolean(user && !isAdmin);

  const cart = useSelector(selectCart);
  const isInWishlist = useSelector(selectIsProductInWishlist(id));

  const [mainLoaded, setMainLoaded] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const [hoverLoaded, setHoverLoaded] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Check if this product is in the cart & get total cart quantity
  const purchasedItems =
    cart?.items?.filter((item) => !item.isFreeGift) || [];
  const totalCartQuantity =
    cart?.summary?.totalQuantity ??
    purchasedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const isAddedToCart = purchasedItems.some((item) => {
    const itemProdId = String(
      item.product?._id || item.product?.id || item.product || ""
    );
    return itemProdId === String(id);
  });

  // Safe image access with responsive ImageKit transformation (500px instead of 2400px)
  const rawMainUrl = images?.[0]?.url || "";
  const rawHoverUrl = images?.[1]?.url || "";
  const hasDistinctHover = Boolean(rawHoverUrl && rawHoverUrl !== rawMainUrl);

  const mainImage = optimizeImage(rawMainUrl, { width: 500, quality: 80 });
  const hoverImage = hasDistinctHover
    ? optimizeImage(rawHoverUrl, { width: 500, quality: 80 })
    : "";

  const seoAltText = `${name} Extended Gaming Deskmat 900x400mm`;
  const specChipLabel =
    SIZE_CHIP_MAP[String(primarySize || "l").toLowerCase()] ||
    SIZE_CHIP_MAP.l;

  const handleMouseEnter = () => {
    if (
      hasDistinctHover &&
      !hasHovered &&
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches
    ) {
      setHasHovered(true);
    }
  };

  // Opens the 50-60% Bottom Slide-Up Quick-Add Drawer for size & quantity selection
  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (inStock === false || isAdmin) return;
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
      const result = await dispatch(toggleWishlist(id)).unwrap();
      if (result.isInWishlist) {
        const numericVal =
          numPrice ?? (Number(String(price || "0").replace(/,/g, "")) || 0);
        trackEvent("AddToWishlist", {
          content_name: name,
          content_ids: [id],
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

  // Helper to render 5 stars based on the average rating
  const renderStars = (avgRating) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      if (avgRating >= starValue) {
        return (
          <Icon
            key={index}
            icon="material-symbols:star-rounded"
            className="text-amber-400 text-xs md:text-base"
          />
        );
      } else if (avgRating >= starValue - 0.5) {
        return (
          <Icon
            key={index}
            icon="material-symbols:star-half-rounded"
            className="text-amber-400 text-xs md:text-base"
          />
        );
      } else {
        return (
          <Icon
            key={index}
            icon="material-symbols:star-outline-rounded"
            className="text-zinc-300 text-xs md:text-base"
          />
        );
      }
    });
  };

  const avgRating = rating?.average || 0;
  const reviewCount = rating?.count || 0;
  const isOutOfStock = inStock === false;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      className="group relative bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-red-600/30 transition-all duration-500 cursor-pointer h-full flex flex-col"
    >
      {/* --- IMAGE CONTAINER WITH LAZY LOADING SHIMMER --- */}
      <div className="image-container w-full aspect-square relative overflow-hidden bg-zinc-100">
        {!mainLoaded && (
          <div className="absolute inset-0 bg-zinc-200 animate-pulse z-0" />
        )}

        {/* Images (Zoom Effect Wrapper) */}
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-[107%] will-change-transform">
          {/* Main Image */}
          <img
            src={mainImage}
            alt={seoAltText}
            loading="lazy"
            decoding="async"
            onLoad={() => setMainLoaded(true)}
            className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-500 ${
              mainLoaded ? "opacity-100" : "opacity-0"
            } ${hoverLoaded ? "group-hover:opacity-0" : ""} ${
              isOutOfStock ? "opacity-75 grayscale-[30%]" : ""
            }`}
          />
          {/* Hover Image (Mounted ONLY on desktop hover to save 50% grid bandwidth) */}
          {hasHovered && hoverImage && (
            <img
              src={hoverImage}
              alt={seoAltText}
              loading="lazy"
              decoding="async"
              onLoad={() => setHoverLoaded(true)}
              className="w-full h-full object-cover absolute inset-0 z-0"
            />
          )}
        </div>

        {/* Sale / Out of Stock Badge */}
        {isOutOfStock ? (
          <div className="absolute top-0 left-0 z-30">
            <div className="bg-zinc-900/90 text-white text-[9px] md:text-[10px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-lg">
              Sold Out
            </div>
          </div>
        ) : (
          originalPrice > price && (
            <div className="absolute top-0 left-0 z-30">
              <div className="bg-gradient-to-r from-red-600 to-red-800 text-white text-[9px] md:text-[10px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-lg">
                Sale
              </div>
            </div>
          )
        )}

        {/* Persistent Hardware Spec Pill (Size L default dimensions matching default price) */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-start pointer-events-none">
          <span className="inline-flex items-center bg-black/75 backdrop-blur-md text-white border border-white/15 text-[8.5px] sm:text-[9.5px] md:text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full shadow-sm truncate">
            {specChipLabel}
          </span>
        </div>
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="p-2 lg:p-3.5 relative flex-1 flex flex-col justify-between bg-white">
        {/* Hover Gradient Line */}
        <div className="absolute top-0 left-0 w-0 h-px bg-gradient-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div>
          <span className="text-[9px] md:text-[10px] font-semibold lg:font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Noctowls
          </span>

          <h3 className="text-[#0f0f0f] text-xs md:text-sm font-semibold lg:font-bold uppercase tracking-wide leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
            {name}
          </h3>
        </div>

        <div className="mt-2.5 space-y-1.5">
          {/* Price & Rating Section */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {originalPrice && originalPrice !== price && (
                <span className="text-zinc-500 text-[11px] font-medium line-through decoration-zinc-300">
                  Rs. {originalPrice}.00
                </span>
              )}
              <span className="text-[#0f0f0f] text-sm md:text-base font-semibold lg:font-bold tracking-tight">
                Rs. {price}.00
              </span>
            </div>

            {/* Hide empty star components when reviewCount === 0 */}
            {reviewCount > 0 && (
              <div className="flex flex-col items-end gap-0.5 mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[#0f0f0f] leading-none">
                    {avgRating}
                  </span>
                  <div className="flex items-center">
                    {renderStars(avgRating)}
                  </div>
                </div>
                <span className="text-[9px] md:text-[10px] text-zinc-500 font-medium">
                  ({reviewCount} {reviewCount === 1 ? "Review" : "Reviews"})
                </span>
              </div>
            )}
          </div>

          {/* 1-Line Dynamic Unlock Message directly ON TOP of the Add to Cart button */}
          {isAddedToCart && totalCartQuantity > 0 && (
            <div className="w-full text-[9.5px] sm:text-[10.5px] font-semibold text-[#0f0f0f] bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-center leading-tight animate-in slide-in-from-bottom-1 fade-in duration-200 truncate">
              {renderUnlockLineWithGreenFree(totalCartQuantity)}
            </div>
          )}

          {/* Action Row: Rectangular Add to Cart / Added Button + Square Wishlist Button */}
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
    </div>
  );
};

export default ProductListItem;