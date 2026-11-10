import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import ImageSlider from "../components/product/ImageSlider";
import { Link, useNavigate, useParams } from "react-router-dom";
import offerImg from "../assets/images/offers.webp";
import MainDets from "../components/product/product-dets/MainDets";
import ProductQuantity from "../components/product/product-dets/ProductQuantity";
import DeliveryTimeline from "../components/product/product-extra-dets/DeliveryTimeline";
import NoReview from "../components/product/product-review/NoReview";
import ReviewCard from "../components/product/product-review/ReviewCard";
import CartDrawer from "../components/bag/CartDrawer";
import { addToRecentlyViewed } from "../utils/helpers/recentlyViewedHelper";
import { optimizeImage } from "../utils/helpers/imageOptimizer";

import { useDispatch, useSelector } from "react-redux";
import {
  getOneProduct,
  validateProductStock,
  clearStockValidation,
} from "../store/features/user/productSlice";
import {
  addToCart,
  selectActionLoading,
  selectCart,
} from "../store/features/user/cartSlice";
import {
  toggleWishlist,
  selectIsProductInWishlist,
  selectWishlistActionLoading,
} from "../store/features/user/wishlistSlice";

import {
  fetchRecentReviews,
  checkReviewEligibility,
  selectProductReviews,
  selectReviewEligibility,
  resetReviewState,
} from "../store/features/user/reviewSlice";

import Loader from "../utils/loader/Loader";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";

// IMPORT PIXEL TRACKING
import { trackEvent } from "../utils/pixel/pixel";

// Lazy-loaded below-the-fold sections & modals for faster initial Product Page render
const ReviewModal = lazy(() =>
  import("../components/product/product-review/ReviewModal")
);
const ProductFeature = lazy(() =>
  import("../components/product/product-features/ProductFeature")
);
const ProductSpecs = lazy(() =>
  import("../components/product/product-specs/ProductSpecs")
);
const BestSelling = lazy(() =>
  import("../components/product/best-selling/BestSelling")
);
const RecentlyViewed = lazy(() =>
  import("../components/product/recently-viewed/RecentlyViewed")
);

const GLOBAL_DEFAULT_TITLE =
  "Buy Premium Gaming Deskmats & Mousepads India | Noctowls";

const upsertMetaTag = (attrName, attrValue, content) => {
  if (typeof document === "undefined" || !content) return;
  let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const Productpage = () => {
  const [selectedSize, setselectedSize] = useState("l");
  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState({});

  const markGalleryImageLoaded = (key) => {
    setLoadedGalleryImages((prev) =>
      prev[key] ? prev : { ...prev, [key]: true }
    );
  };

  // Conditionally mount mobile slider OR desktop grid so both DOM trees don't download simultaneously
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleResize = (e) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  // Zoom state now accepts a dynamic CSS style object
  const [zoomState, setZoomState] = useState({
    show: false,
    url: "",
    x: 0,
    y: 0,
    style: {},
  });

  const [sortBy, setSortBy] = useState("Featured");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();

  const { product, productLoading, productError, stockValidation } =
    useSelector((state) => state.products);
  const cartActionLoading = useSelector(selectActionLoading);
  const cart = useSelector(selectCart);

  // Reviews State
  const reviews = useSelector(selectProductReviews);
  const fetchLoading = useSelector((state) => state.reviews.fetchLoading);
  const reviewStats = useSelector((state) => state.reviews.stats);

  const reviewEligibility = useSelector(selectReviewEligibility);
  const { existingReview, hasReviewed } = reviewEligibility;

  const isInWishlist = useSelector(selectIsProductInWishlist(productId));
  const wishlistActionLoading = useSelector(selectWishlistActionLoading);

  const user = useSelector((state) => state.auth.user);
  const isAdmin = useSelector((state) => state.adminAuth.admin);
  const isLoggedInUser = Boolean(user && !isAdmin);

  const validationTimerRef = useRef(null);
  const sortRef = useRef(null);

  const trackedProductId = useRef(null);

  // Reference to capture the exact layout dimensions of the right column
  const rightColRef = useRef(null);

  // --- Review Stats Calculation ---
  const calculateDistribution = (reviewsList) => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewStats) return reviewStats.distribution;

    if (!reviewsList) return dist;
    reviewsList.forEach((r) => {
      const ratingVal = Math.round(r.rating);
      if (dist[ratingVal] !== undefined) dist[ratingVal]++;
    });
    return dist;
  };

  const distribution = calculateDistribution(reviews);

  const publicReviews = useMemo(() => {
    return reviews
      ? reviews.filter((r) => r._id !== existingReview?._id)
      : [];
  }, [reviews, existingReview]);

  const handleSortChange = (option) => {
    setSortBy(option);
    setIsSortOpen(false);
  };

  // Hover Logic separated to capture DOM layout on Enter (loads 2400px master image ONLY when user hovers on desktop)
  const handleMouseEnter = (e, rawUrl) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    let style = {};
    if (rightColRef.current) {
      const rightRect = rightColRef.current.getBoundingClientRect();
      style = {
        position: "fixed",
        top: "96px",
        left: `${rightRect.left}px`,
        width: `${rightRect.width}px`,
        height: "calc(100vh - 150px)",
        maxHeight: "750px",
        zIndex: 100,
      };
    }
    const zoomUrl = optimizeImage(rawUrl, { width: 2400, quality: 85 });
    setZoomState({ show: true, url: zoomUrl, x, y, style });
  };

  const handleMouseMove = (e) => {
    if (!zoomState.show) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomState((prev) => ({ ...prev, x, y }));
  };

  const handleMouseLeave = () => {
    setZoomState({ show: false, url: "", x: 0, y: 0, style: {} });
  };

  // Effect 1: Initial Data
  useEffect(() => {
    setLoadedGalleryImages({});
    dispatch(getOneProduct(productId));

    return () => {
      dispatch(clearStockValidation());
      dispatch(resetReviewState());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (product && !productLoading && !productError) {
      if (trackedProductId.current !== product.id) {
        addToRecentlyViewed(product);

        const price = product.sizes?.[0]?.numPrice || 0;

        trackEvent("ViewContent", {
          content_name: product.name,
          content_ids: [product.id],
          content_type: "product",
          value: price,
          currency: "INR",
        });

        trackedProductId.current = product.id;
      }
    }
  }, [product, productLoading, productError]);

  useEffect(() => {
    if (product && product.id) {
      dispatch(fetchRecentReviews({ productId: product.id, sortBy }));
      dispatch(checkReviewEligibility(product.id));
    }
  }, [dispatch, product?.id, sortBy]);

  useEffect(() => {
    if (product?.sizes) {
      const firstAvailableSize = product.sizes.find((s) => s.stock > 0);
      if (firstAvailableSize) {
        setselectedSize(firstAvailableSize.value);
      }
    }
  }, [product]);

  useEffect(() => {
    dispatch(clearStockValidation());
    setQuantity(1);
  }, [selectedSize, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSizeData = product?.sizes?.find((s) => s.value === selectedSize);
  const isSizeInStock = Boolean(currentSizeData && currentSizeData.stock > 0);

  // Dynamic SEO Title, OpenGraph Meta Tags & Product JSON-LD Schema
  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const activeSize = currentSizeData || product.sizes?.[0] || {};
    const numericPrice =
      activeSize.numPrice ??
      (Number(String(activeSize.price || "0").replace(/,/g, "")) || 0);
    const inStockState =
      activeSize.stock !== undefined
        ? activeSize.stock > 0
        : Boolean(product.inStock);

    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: Array.isArray(product.images)
        ? product.images.map((img) => img.url).filter(Boolean)
        : [],
      description:
        product.description ||
        `${product.name} Extended Gaming Deskmat 900x400mm | 3mm Heavy Density by Noctowls.`,
      sku: activeSize.skuCode || String(product.id || productId),
      brand: {
        "@type": "Brand",
        name: "Noctowls",
      },
      offers: {
        "@type": "Offer",
        url:
          typeof window !== "undefined"
            ? window.location.href
            : `https://noctowls.com/products/${product.id || productId}`,
        priceCurrency: "INR",
        price: String(numericPrice),
        availability: inStockState
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    if (product.rating?.count > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(product.rating.average || 5),
        reviewCount: String(product.rating.count),
      };
    }

    return schema;
  }, [product, currentSizeData, productId]);

  useEffect(() => {
    if (!product) return;
    const activeSize = currentSizeData || product.sizes?.[0] || {};
    const numericPrice = activeSize.numPrice ?? 0;
    const inStockState =
      activeSize.stock !== undefined
        ? activeSize.stock > 0
        : Boolean(product.inStock);

    const pageTitle = `${product.name} | ${GLOBAL_DEFAULT_TITLE}`;
    document.title = pageTitle;

    const primaryImageUrl =
      product.images?.[0]?.url || "https://noctowls.com/seo/noctowls-banner.png";
    const pageUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://noctowls.com/products/${product.id || productId}`;

    upsertMetaTag("property", "og:title", pageTitle);
    upsertMetaTag(
      "property",
      "og:description",
      product.description ||
        `${product.name} Extended Gaming Deskmat 900x400mm | 3mm Heavy Density.`
    );
    upsertMetaTag("property", "og:image", primaryImageUrl);
    upsertMetaTag("property", "og:url", pageUrl);
    upsertMetaTag("property", "og:type", "product");
    upsertMetaTag("property", "product:price:amount", String(numericPrice));
    upsertMetaTag("property", "product:price:currency", "INR");
    upsertMetaTag(
      "property",
      "product:availability",
      inStockState ? "in stock" : "out of stock"
    );
    upsertMetaTag("name", "twitter:title", pageTitle);
    upsertMetaTag("name", "twitter:image", primaryImageUrl);

    return () => {
      document.title = GLOBAL_DEFAULT_TITLE;
      upsertMetaTag("property", "og:title", GLOBAL_DEFAULT_TITLE);
      upsertMetaTag("property", "og:type", "website");
    };
  }, [product, currentSizeData, productId]);

  const validateStock = useCallback(
    (newQuantity, size) => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      validationTimerRef.current = setTimeout(() => {
        dispatch(
          validateProductStock({
            productId,
            size,
            requestedQuantity: newQuantity,
          })
        );
      }, 500);
    },
    [dispatch, productId]
  );

  const quantitySetter = (action) => {
    let newQuantity = quantity;
    let shouldValidate = false;

    if (action === "increment") {
      newQuantity = quantity + 1;
      setQuantity(newQuantity);
      shouldValidate = true;
    } else if (action === "decrement" && quantity > 1) {
      newQuantity = quantity - 1;
      setQuantity(newQuantity);
      shouldValidate = true;
    }

    if (shouldValidate && newQuantity !== quantity) {
      validateStock(newQuantity, selectedSize);
    }
  };

  const isProductInCart = useCallback(() => {
    if (
      !cart ||
      !cart.items ||
      !Array.isArray(cart.items) ||
      !productId ||
      !selectedSize
    ) {
      return false;
    }
    return cart.items.some((item) => {
      if (item.isFreeGift) return false;
      const itemProductId = String(
        item.product?._id || item.product?.id || item.product || ""
      );
      const currentId = String(product?.id || productId);
      return (
        itemProductId === currentId &&
        item.size?.value?.toLowerCase() === selectedSize?.toLowerCase()
      );
    });
  }, [cart, productId, selectedSize, product]);

  const isInCart = isProductInCart();

  const canPurchase =
    isSizeInStock &&
    stockValidation?.data?.isAvailable !== false &&
    !stockValidation.loading &&
    !isAdmin;

  const addToCartHandler = async () => {
    if (!canPurchase || cartActionLoading) return;

    try {
      await dispatch(
        addToCart({
          productId: product?.id || productId,
          sizeValue: selectedSize,
          quantity: quantity,
        })
      ).unwrap();

      const itemPrice = currentSizeData?.numPrice || 0;

      trackEvent("AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: itemPrice,
        currency: "INR",
        contents: [{ id: product.id, quantity: quantity }],
      });
    } catch (error) {
      toast.error(error || "Failed to add!", toastControls);
    }
  };

  const buyNowHandler = async () => {
    if (!canPurchase || cartActionLoading) return;

    const itemPrice = currentSizeData?.numPrice || 0;

    trackEvent("InitiateCheckout", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: itemPrice * quantity,
      currency: "INR",
      num_items: quantity,
    });

    try {
      if (!isInCart) {
        await dispatch(
          addToCart({
            productId: product?.id || productId,
            sizeValue: selectedSize,
            quantity: quantity,
          })
        ).unwrap();
      }
      navigate("/checkout");
    } catch (error) {
      console.error("Buy Now Error:", error);
      toast.error(error || "Failed to proceed to checkout", toastControls);
    }
  };

  // Wishlist toggle: if not logged in, redirects to Login/Signup page (/account/signin)
  const handleWishlistToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isLoggedInUser) {
      toast.info(
        isAdmin
          ? "Please logout from admin account!"
          : "Please login to add items to your wishlist!",
        toastControls
      );
      navigate("/account/signin", { state: { from: `/products/${productId}` } });
      return;
    }
    if (wishlistActionLoading) return;

    try {
      const idToToggle = product?.id || productId;
      const result = await dispatch(toggleWishlist(idToToggle)).unwrap();

      if (result.isInWishlist) {
        const price = product.sizes?.[0]?.numPrice || 0;

        trackEvent("AddToWishlist", {
          content_name: product.name,
          content_ids: [idToToggle],
          content_type: "product",
          value: price,
          currency: "INR",
        });
      }

      toast.success(
        result.message ||
          (result.isInWishlist ? "Added to wishlist!" : "Removed from wishlist"),
        toastControls
      );
    } catch (error) {
      toast.error(error || "Failed to update wishlist", toastControls);
    }
  };

  if (productLoading) return <Loader />;

  if (productError || !product) {
    return (
      <div className="w-full py-20 flex justify-center items-center bg-[#f4f4f4] text-[#0f0f0f]">
        <p className="bg-red-50 border-red-200 text-red-600 font-medium border rounded px-5 py-2">
          Product not found.
        </p>
      </div>
    );
  }

  const {
    name,
    category,
    group,
    images,
    highlightImages,
    sizes,
    rating,
    description,
  } = product;

  const isPhase00 = group === "phase-00";
  const seoAltText = `${name} Extended Gaming Deskmat 900x400mm`;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check this Noctowls ${name}`,
          text: "Have a look at this product!",
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled: ", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied to clipboard!", toastControls);
    }
  };

  return (
    <div className="product-page-wrapper pb-10 bg-[#f4f4f4] min-h-screen text-[#0f0f0f] font-sans">
      {/* Inject Product JSON-LD Schema with price, in-stock state, and INR currency */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      {isReviewModalOpen && (
        <Suspense fallback={null}>
          <ReviewModal
            productId={product?.id || productId}
            onClose={() => setIsReviewModalOpen(false)}
            userName={user?.name}
          />
        </Suspense>
      )}

      {/* Render the Zoom Overlay outside of the document flow structure */}
      {zoomState.show && (
        <div
          className="hidden lg:block bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden pointer-events-none"
          style={zoomState.style}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${zoomState.url})`,
              backgroundPosition: `${zoomState.x}% ${zoomState.y}%`,
              backgroundSize: "400%",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      )}

      {/* MAIN CONTENT SECTION (Optimized padding so Add to Cart & Buy Now sit above the fold) */}
      <div className="lg:flex lg:gap-8 xl:gap-12 relative max-w-[1600px] mx-auto md:px-8 lg:px-12 xl:px-16 md:py-5">
        {/* LEFT: IMAGES (Conditionally mounted so mobile & desktop trees never double-download) */}
        <div className="product-left-col w-full lg:w-[58%]">
          {!isDesktop ? (
            <div className="relative">
              <ImageSlider images={images} productName={name} />
              <div
                onClick={handleShare}
                className="product-link-share-btn absolute top-3 right-3 z-20 w-9 aspect-square rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-zinc-200 flex justify-center items-center text-[#0f0f0f] text-base cursor-pointer"
              >
                <Icon icon="ic:baseline-share" />
              </div>

              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={
                  isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
                className={`absolute top-3 left-3 z-20 w-9 aspect-square rounded-full flex justify-center items-center text-base shadow-sm cursor-pointer border border-zinc-200 backdrop-blur-md ${
                  isInWishlist
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white/80 text-[#0f0f0f]"
                }`}
              >
                <Icon
                  icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"}
                />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {images.map((img, idx) => {
                if (idx === 0) {
                  const mainKey = `desktop-main-${idx}`;
                  return (
                    <div
                      key={`prod-img-${idx}`}
                      className="w-full relative group overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 cursor-crosshair min-h-[320px]"
                      onMouseEnter={(e) => handleMouseEnter(e, img.url)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {!loadedGalleryImages[mainKey] && (
                        <div className="absolute inset-0 bg-zinc-200 animate-pulse z-0" />
                      )}
                      <img
                        src={optimizeImage(img.url, {
                          width: 1000,
                          quality: 82,
                        })}
                        alt={seoAltText}
                        fetchPriority="high"
                        decoding="async"
                        onLoad={() => markGalleryImageLoaded(mainKey)}
                        className={`w-full h-auto max-h-[68vh] object-cover transition-opacity duration-500 ${
                          loadedGalleryImages[mainKey]
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={handleWishlistToggle}
                        onMouseMove={(e) => e.stopPropagation()}
                        aria-label={
                          isInWishlist
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        className={`absolute top-5 left-5 z-20 w-11 aspect-square rounded-full flex justify-center items-center text-xl cursor-pointer shadow-sm transition border border-zinc-200 backdrop-blur-md ${
                          isInWishlist
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white/80 text-[#0f0f0f] hover:bg-white"
                        }`}
                      >
                        <Icon
                          icon={
                            isInWishlist ? "mdi:heart" : "mdi:heart-outline"
                          }
                        />
                      </button>
                    </div>
                  );
                }
                return null;
              })}
              <div className="grid grid-cols-2 gap-4">
                {images.slice(1).map((img, idx) => {
                  const gridKey = `desktop-grid-${idx}`;
                  return (
                    <div
                      key={`prod-img-grid-${idx}`}
                      className="w-full aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 relative cursor-crosshair"
                      onMouseEnter={(e) => handleMouseEnter(e, img.url)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {!loadedGalleryImages[gridKey] && (
                        <div className="absolute inset-0 bg-zinc-200 animate-pulse z-0" />
                      )}
                      <img
                        src={optimizeImage(img.url, { width: 600, quality: 80 })}
                        alt={seoAltText}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => markGalleryImageLoaded(gridKey)}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${
                          loadedGalleryImages[gridKey]
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS (Compact above-the-fold layout so Add to Cart & Buy Now are visible immediately) */}
        <div
          ref={rightColRef}
          className="product-right-col w-full lg:w-[42%] md:pt-0 relative"
        >
          <div className="sticky top-20 h-fit pb-6">
            <div className="product-dets-container">
              <MainDets
                selectedSize={selectedSize}
                setselectedSize={setselectedSize}
                dets={{
                  name,
                  description,
                  category,
                  group,
                  sizes,
                  reviewCount: rating?.count || 0,
                }}
              />

              <ProductQuantity
                quantitySetter={quantitySetter}
                quantity={quantity}
                stockValidation={stockValidation}
                isValidating={stockValidation.loading}
              />

              {/* ACTION BUTTONS CONTAINER WITH NON-BLOCKING SLIDE-UP OFFER BAR ON TOP */}
              <div className="product-page-btns px-3 md:px-0 mt-3 space-y-2.5">
                {/* Inline Slide-Up Offer Bar directly on top of Action Buttons */}
                <CartDrawer />

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={addToCartHandler}
                    disabled={!canPurchase || cartActionLoading}
                    className={`product-add-to-cart-btn w-full py-3.5 px-3 text-center rounded-md uppercase text-xs sm:text-sm font-bold tracking-wider transition-all relative ${
                      isInCart
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-md"
                        : canPurchase && !cartActionLoading
                        ? "bg-[#0f0f0f] text-white hover:bg-zinc-800 shadow-md shadow-black/10 cursor-pointer"
                        : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {cartActionLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon icon="eos-icons:loading" className="text-base" />
                        Adding...
                      </span>
                    ) : isInCart ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon icon="mdi:check-circle" className="text-base" />
                        Added
                      </span>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>

                  <button
                    onClick={buyNowHandler}
                    disabled={!canPurchase || cartActionLoading}
                    className={`product-buy-btn w-full py-3.5 px-3 text-center rounded-md uppercase text-xs sm:text-sm font-bold tracking-wider transition-all ${
                      canPurchase && !cartActionLoading
                        ? "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20 cursor-pointer"
                        : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {cartActionLoading ? "Processing..." : "Buy Now"}
                  </button>
                </div>

                {/* Wishlist Button: Always clickable so guests are redirected to Login/Signup */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={wishlistActionLoading}
                  className={`w-full py-2.5 text-center rounded-md uppercase text-xs font-semibold transition-all border cursor-pointer ${
                    isInWishlist
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-white border-zinc-300 text-[#0f0f0f] hover:border-red-300 hover:text-red-600 hover:bg-red-50/40"
                  } flex items-center justify-center gap-2`}
                >
                  {wishlistActionLoading ? (
                    <>
                      <Icon icon="eos-icons:loading" className="text-base" />{" "}
                      {isInWishlist ? "Removing..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <Icon
                        icon={
                          isInWishlist ? "mdi:heart" : "mdi:heart-outline"
                        }
                        className={`text-base ${
                          isInWishlist ? "text-red-600" : ""
                        }`}
                      />{" "}
                      {isInWishlist
                        ? "Remove from Wishlist"
                        : "Add to Wishlist"}
                    </>
                  )}
                </button>
              </div>

              <div className="product-extra-dets mt-5">
                <DeliveryTimeline />
                <div className="offer-banner px-3 md:px-0 mt-5">
                  <img
                    className="w-full aspect-auto rounded-md"
                    src={offerImg}
                    alt="Noctowls Free Gift Offers"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="size-warning-banner mt-4 mx-3 md:mx-0 p-3.5 bg-amber-400 rounded-md text-black text-xs sm:text-sm font-bold leading-snug shadow-md border border-amber-500">
                  please choose the size carefully as our return policy does{" "}
                  <Link
                    to="/policies/refund-policy"
                    className="text-blue-700 underline decoration-blue-700 underline-offset-2 font-black hover:text-blue-900 uppercase transition-colors"
                  >
                    NOT COVER SIZE EXCHANGES.
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="product-review-container bg-[#f4f4f4] w-full py-12 border-t border-zinc-200 mt-4 relative">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <h2
            id="reviews-title"
            className="uppercase font-bold text-xl md:text-3xl text-[#0f0f0f] mb-8"
          >
            Customer Reviews
          </h2>

          <div className="flex flex-col items-center md:flex-row md:items-start gap-10 mb-10 pb-10 border-b border-zinc-200 flex-wrap">
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-6xl font-bold text-[#0f0f0f] tracking-tighter">
                {rating?.average?.toFixed(1) || "0.0"}
              </span>
              {(rating?.count || 0) > 0 && (
                <div className="flex text-red-600 text-lg my-1">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      icon="material-symbols:star-rounded"
                      className={
                        i >= Math.round(rating?.average || 0)
                          ? "text-zinc-300"
                          : ""
                      }
                    />
                  ))}
                </div>
              )}
              <span className="text-sm font-bold text-zinc-500">
                {rating?.count || 0} reviews
              </span>
            </div>
            <div className="flex-1 w-full max-w-md space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div
                  key={star}
                  className="flex items-center gap-3 text-xs font-bold text-zinc-500"
                >
                  <span className="w-12">{star} Star</span>
                  <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600"
                      style={{
                        width: `${
                          rating?.count
                            ? (distribution[star] / rating.count) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-4 text-right">{distribution[star]}</span>
                </div>
              ))}
            </div>
            <div className="md:ml-auto flex gap-2 h-fit relative">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className={`px-14 sm:px-20 md:px-6 py-2 ${
                  reviewEligibility.canReview
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-zinc-200 text-zinc-500"
                } text-sm font-bold uppercase tracking-wide rounded-xs transition-colors`}
                disabled={!reviewEligibility.canReview}
              >
                {reviewEligibility.hasReviewed
                  ? "Edit Review"
                  : "Write a review"}
              </button>

              <div className="relative pr-4 lg:pr-0" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="h-full aspect-square bg-red-600 text-white flex items-center justify-center rounded-xs hover:bg-red-700 transition-colors"
                >
                  <Icon icon="mi:filter" className="text-xl" />
                </button>
                {isSortOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white text-[#0f0f0f] border border-zinc-200 rounded shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                      Sort by
                    </div>
                    {[
                      "Featured",
                      "Photo priority",
                      "Newest",
                      "Highest Ratings",
                      "Lowest Ratings",
                    ].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => handleSortChange(opt)}
                        className={`px-4 py-2 hover:bg-zinc-50 cursor-pointer text-sm font-medium flex justify-between items-center ${
                          sortBy === opt ? "text-red-600 font-bold" : ""
                        }`}
                      >
                        {opt}
                        {sortBy === opt && <Icon icon="mdi:check" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="reviews space-y-6 pb-10">
            {(publicReviews && publicReviews.length > 0) ||
            (hasReviewed && existingReview) ? (
              <>
                {hasReviewed && existingReview && (
                  <ReviewCard
                    review={existingReview}
                    isOwner={true}
                    onEdit={() => setIsReviewModalOpen(true)}
                  />
                )}
                {publicReviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </>
            ) : (
              <NoReview />
            )}

            {fetchLoading && (
              <div className="py-4 text-center">
                <Icon
                  icon="eos-icons:loading"
                  className="text-3xl text-red-600 inline-block"
                />
              </div>
            )}
          </div>

          {(rating?.count > 5 ||
            (reviewStats && reviewStats.totalReviews > 5)) && (
            <div className="flex justify-center pb-10">
              <Link
                to={`/products/${productId}/reviews`}
                className="bg-white border border-zinc-300 text-[#0f0f0f] px-10 py-3 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-zinc-50 hover:border-red-600 hover:text-red-600 transition-all flex items-center gap-2 group shadow-sm"
              >
                See All Reviews
                <Icon
                  icon="solar:arrow-right-linear"
                  className="text-lg group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* LAZY-LOADED FEATURES, HIGHLIGHTS, SPECS & RECOMMENDATIONS */}
      <Suspense fallback={<div className="w-full py-12" />}>
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <ProductFeature />
        </div>
      </Suspense>

      {/* CONDITIONAL HIGHLIGHTS SECTION: ONLY SHOW IF NOT PHASE-00 */}
      {!isPhase00 && highlightImages && highlightImages.length > 0 && (
        <div className="product-highlights bg-[#f4f4f4] w-full mt-12 py-12 border-t border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row">
            <div className="product-highlights-header lg:w-1/3 text-left mb-8">
              <h2 className="product-highlights-heading uppercase font-bold text-2xl md:text-3xl text-[#0f0f0f] mb-2 border-l-4 border-red-600 pl-4">
                Highlights
              </h2>
              <p className="font-medium text-sm md:text-base text-zinc-500 pl-5">
                Precision meets aesthetics.
              </p>
            </div>
            <div className="product-hightlights-image-container lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {highlightImages.map((highlight, idx) => {
                const hlKey = `highlight-${idx}`;
                return (
                  <div
                    key={`${highlight.url}-highlight-${idx}`}
                    className={`${
                      idx === 0 && "lg:col-span-2"
                    } highlight-img-container w-full bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 relative min-h-[200px]`}
                  >
                    {!loadedGalleryImages[hlKey] && (
                      <div className="absolute inset-0 bg-zinc-200 animate-pulse z-0" />
                    )}
                    <img
                      className={`w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500 ${
                        loadedGalleryImages[hlKey] ? "opacity-90" : "opacity-0"
                      }`}
                      src={optimizeImage(highlight.url, {
                        width: idx === 0 ? 1000 : 600,
                        quality: 80,
                      })}
                      alt={seoAltText}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => markGalleryImageLoaded(hlKey)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="w-full py-12" />}>
        <div className="max-w-6xl mx-auto px-4 mt-32 pb-20">
          <ProductSpecs />
        </div>

        {/* BEST SELLING SECTION */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-10">
          <BestSelling />
        </div>

        {/* RECENTLY VIEWED SECTION */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-10">
          <RecentlyViewed />
        </div>
      </Suspense>
    </div>
  );
};

export default Productpage;