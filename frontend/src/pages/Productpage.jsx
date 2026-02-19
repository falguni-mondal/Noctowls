import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Icon } from "@iconify/react/dist/iconify.js"
import ImageSlider from "../components/product/ImageSlider"
import { Link, useNavigate, useParams } from "react-router-dom";
import offerImg from "../assets/images/offers.png"
import ProductFeature from "../components/product/product-features/ProductFeature";
import MainDets from "../components/product/product-dets/MainDets";
import ProductQuantity from "../components/product/product-dets/ProductQuantity";
import DeliveryTimeline from "../components/product/product-extra-dets/DeliveryTimeline";
import NoReview from "../components/product/product-review/NoReview";
import ReviewCard from "../components/product/product-review/ReviewCard";
import ReviewModal from "../components/product/product-review/ReviewModal";
import ProductSpecs from "../components/product/product-specs/ProductSpecs";
import BestSelling from "../components/product/best-selling/BestSelling";
// NEW IMPORTS
import RecentlyViewed from "../components/product/recently-viewed/RecentlyViewed";
import { addToRecentlyViewed } from "../utils/helpers/recentlyViewedHelper";

import { useDispatch, useSelector } from "react-redux";
import { getOneProduct, validateProductStock, clearStockValidation } from "../store/features/user/productSlice";
import { addToCart, selectActionLoading, selectCart } from "../store/features/user/cartSlice";
import {
    toggleWishlist,
    selectIsProductInWishlist,
    selectWishlistActionLoading
} from "../store/features/user/wishlistSlice";

import {
    fetchRecentReviews,
    checkReviewEligibility,
    selectProductReviews,
    selectReviewEligibility,
    resetReviewState
} from "../store/features/user/reviewSlice";

import Loader from "../utils/loader/Loader";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";

// IMPORT PIXEL TRACKING
import { trackEvent } from "../utils/pixel/pixel";

const Productpage = () => {
    const [selectedSize, setselectedSize] = useState("l");
    const [quantity, setQuantity] = useState(1);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const [sortBy, setSortBy] = useState("Featured");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { productId } = useParams();

    const { product, productLoading, productError, stockValidation } = useSelector(state => state.products);
    const cartActionLoading = useSelector(selectActionLoading);
    const cart = useSelector(selectCart);

    // Reviews State
    const reviews = useSelector(selectProductReviews);
    const fetchLoading = useSelector(state => state.reviews.fetchLoading);
    const reviewStats = useSelector(state => state.reviews.stats);

    const reviewEligibility = useSelector(selectReviewEligibility);
    const { existingReview, hasReviewed } = reviewEligibility;

    const isInWishlist = useSelector(selectIsProductInWishlist(productId));
    const wishlistActionLoading = useSelector(selectWishlistActionLoading);

    const user = useSelector(state => state.auth.user);
    const isAdmin = useSelector(state => state.adminAuth.admin);
    const isLoggedInUser = user && !isAdmin;

    const validationTimerRef = useRef(null);
    const sortRef = useRef(null);
    
    // Ref to prevent duplicate Pixel firing
    const viewContentFired = useRef(false);

    // --- Review Stats Calculation ---
    const calculateDistribution = (reviews) => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        // Use stats from backend if available for accurate total distribution
        if (reviewStats) return reviewStats.distribution;

        // Fallback for visual display if stats not yet loaded
        if (!reviews) return dist;
        reviews.forEach(r => {
            const rating = Math.round(r.rating);
            if (dist[rating] !== undefined) dist[rating]++;
        });
        return dist;
    };

    const distribution = calculateDistribution(reviews);

    const publicReviews = useMemo(() => {
        return reviews ? reviews.filter(r => r._id !== existingReview?._id) : [];
    }, [reviews, existingReview]);

    const handleSortChange = (option) => {
        setSortBy(option);
        setIsSortOpen(false);
    };

    // Effect 1: Initial Data
    useEffect(() => {
        dispatch(getOneProduct(productId));
        // We defer checking eligibility until we have the real product.id to avoid CastErrors
        
        return () => {
            dispatch(clearStockValidation());
            dispatch(resetReviewState());
        };
    }, [dispatch, productId]);

    // Reset Pixel ref if user navigates to a new product
    useEffect(() => {
        viewContentFired.current = false;
    }, [productId]);

    // EFFECT 2: Add to Recently Viewed & Pixel Tracking (Fires exactly ONCE)
    useEffect(() => {
        if (product && !productLoading && !productError && !viewContentFired.current) {
            addToRecentlyViewed(product);

            // FIX: Get price from the first size
            const price = product.sizes?.[0]?.numPrice || 0;

            // FIX: Use product.id (Real Database ID) for Pixel
            trackEvent('ViewContent', {
                content_name: product.name,
                content_ids: [product.id], 
                content_type: 'product',
                value: price,
                currency: 'INR'
            });

            // Mark as fired so it doesn't run again when sorting reviews
            viewContentFired.current = true;
        }
    }, [product, productLoading, productError]);

    // EFFECT 3: Fetch Reviews & Check Eligibility (Separated so it safely reacts to sortBy changes)
    useEffect(() => {
        if (product && product.id) {
            dispatch(fetchRecentReviews({ productId: product.id, sortBy }));
            dispatch(checkReviewEligibility(product.id));
        }
    }, [dispatch, product?.id, sortBy]);

    useEffect(() => {
        if (product?.sizes) {
            const firstAvailableSize = product.sizes.find(s => s.stock > 0);
            if (firstAvailableSize) {
                setselectedSize(firstAvailableSize.value);
            }
        }
    }, [product])

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

    const validateStock = useCallback((newQuantity, size) => {
        if (validationTimerRef.current) {
            clearTimeout(validationTimerRef.current);
        }
        validationTimerRef.current = setTimeout(() => {
            dispatch(validateProductStock({
                productId,
                size,
                requestedQuantity: newQuantity
            }));
        }, 500);
    }, [dispatch, productId]);

    const quantitySetter = (action) => {
        let newQuantity = quantity;
        let shouldValidate = false;

        if (action === "increment") {
            newQuantity = quantity + 1;
            setQuantity(newQuantity);
            shouldValidate = true;
        }
        else if (action === "decrement" && quantity > 1) {
            newQuantity = quantity - 1;
            setQuantity(newQuantity);
            shouldValidate = true;
        }

        if (shouldValidate && newQuantity !== quantity) {
            validateStock(newQuantity, selectedSize);
        }
    }

    const isProductInCart = useCallback(() => {
        if (!cart || !cart.items || !Array.isArray(cart.items) || !productId || !selectedSize) {
            return false;
        }
        return cart.items.some(item => {
            const itemProductId = item.product?._id || item.product;
            // Robust check: match against product.id if loaded, else fallback to param
            const currentId = product?.id || productId;
            return itemProductId === currentId &&
                item.size?.value.toLowerCase() === selectedSize?.toLowerCase();
        });
    }, [cart, productId, selectedSize, product]);

    const isInCart = isProductInCart();

    const currentSizeData = product?.sizes?.find(s => s.value === selectedSize);
    const isSizeInStock = currentSizeData && currentSizeData.stock > 0;

    const canPurchase = isSizeInStock && stockValidation?.data?.isAvailable !== false && !stockValidation.loading && !isAdmin;

    const addToCartHandler = async () => {
        if (isInCart) {
            toast.info("This item is already in your cart!", toastControls);
            return;
        }
        if (!canPurchase || cartActionLoading) return;

        try {
            await dispatch(addToCart({
                productId: product?.id || productId, // Use safe ID
                sizeValue: selectedSize,
                quantity: quantity
            })).unwrap();

            const itemPrice = currentSizeData?.numPrice || 0;

            // FIX: Use product.id for AddToCart
            trackEvent('AddToCart', {
                content_name: product.name,
                content_ids: [product.id],
                content_type: 'product',
                value: itemPrice,
                currency: 'INR',
                contents: [{ id: product.id, quantity: quantity }]
            });

            toast.success("Added to cart!", toastControls);
        } catch (error) {
            toast.error(error || "Failed to add!", toastControls);
        }
    };

    const buyNowHandler = async () => {
        if (!canPurchase || cartActionLoading) return;

        const itemPrice = currentSizeData?.numPrice || 0;

        // FIX: Use product.id for InitiateCheckout
        trackEvent('InitiateCheckout', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: itemPrice * quantity,
            currency: 'INR',
            num_items: quantity
        });

        try {
            if (!isInCart) {
                await dispatch(addToCart({
                    productId: product?.id || productId,
                    sizeValue: selectedSize,
                    quantity: quantity
                })).unwrap();
            }
            navigate("/checkout");
        } catch (error) {
            console.error("Buy Now Error:", error);
            toast.error(error || 'Failed to proceed to checkout', toastControls);
        }
    };

    const handleWishlistToggle = async () => {
        if (!isLoggedInUser) {
            toast.info(`${isAdmin ? "Please logout from admin account!" : "Please login to add items to your wishlist!"}`, toastControls);
            navigate('/account/signin', { state: { from: `/products/${productId}` } });
            return;
        }
        if (wishlistActionLoading) return;

        try {
            const idToToggle = product?.id || productId;
            const result = await dispatch(toggleWishlist(idToToggle)).unwrap();

            // FIX: Use product.id for AddToWishlist
            if (result.isInWishlist) {
                const price = product.sizes?.[0]?.numPrice || 0;

                trackEvent('AddToWishlist', {
                    content_name: product.name,
                    content_ids: [idToToggle],
                    content_type: 'product',
                    value: price,
                    currency: 'INR'
                });
            }

            toast.success(result.message || (result.isInWishlist ? "Added to wishlist!" : "Removed from wishlist"), toastControls);
        } catch (error) {
            toast.error(error || "Failed to update wishlist", toastControls);
        }
    };

    if (productLoading) return <Loader />

    if (productError || !product) {
        return (
            <div className="w-full py-20 flex justify-center items-center bg-black text-white">
                <p className="bg-red-950 border-red-700 border rounded px-5 py-2">Product not found.</p>
            </div>
        )
    }

    const { name, category, images, highlightImages, sizes, rating, description } = product;

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
        <div className="product-page-wrapper pb-10 bg-black min-h-screen text-zinc-100 font-sans">
            {isReviewModalOpen && (
                <ReviewModal
                    productId={product?.id || productId}
                    onClose={() => setIsReviewModalOpen(false)}
                    userName={user?.name}
                />
            )}

            {/* MAIN CONTENT SECTION */}
            <div className="lg:flex lg:gap-10 xl:gap-14 relative max-w-[1600px] mx-auto md:px-8 lg:px-12 xl:px-16 md:py-10">
                {/* LEFT: IMAGES */}
                <div className="product-left-col w-full lg:w-[60%]">
                    <div className="lg:hidden relative">
                        <ImageSlider images={images} />
                        <div onClick={handleShare} className="product-link-share-btn absolute top-4 right-4 z-20 w-10 aspect-square rounded-full bg-black/50 backdrop-blur-sm border border-zinc-700 flex justify-center items-center text-white text-lg cursor-pointer">
                            <Icon icon="ic:baseline-share" />
                        </div>
                        <div onClick={handleWishlistToggle} className={`absolute top-4 left-4 z-20 w-10 aspect-square rounded-full flex justify-center items-center text-lg cursor-pointer border border-zinc-700 backdrop-blur-sm ${isInWishlist ? 'bg-red-600 text-white border-red-600' : 'bg-black/50 text-white'}`}>
                            <Icon icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"} />
                        </div>
                    </div>
                    <div className="hidden lg:flex flex-col gap-4">
                        {images.map((img, idx) => {
                            if (idx === 0) {
                                return (
                                    <div key={`prod-img-${idx}`} className="w-full relative group overflow-hidden rounded-lg border border-zinc-900">
                                        <img src={img.url} alt={`${name}-${idx}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in" />
                                        <div onClick={handleWishlistToggle} className={`absolute top-6 left-6 z-20 w-12 aspect-square rounded-full flex justify-center items-center text-2xl cursor-pointer transition border border-zinc-700 backdrop-blur-sm ${isInWishlist ? 'bg-red-600 text-white border-red-600' : 'bg-black/60 text-white hover:bg-zinc-800'}`}>
                                            <Icon icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"} />
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                        <div className="grid grid-cols-2 gap-4">
                            {images.slice(1).map((img, idx) => (
                                <div key={`prod-img-grid-${idx}`} className="w-full overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950">
                                    <img src={img.url} alt={`detail-${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: DETAILS */}
                <div className="product-right-col w-full lg:w-[40%] md:pt-0 relative">
                    <div className="sticky top-24 h-fit pb-10">
                        <div className="product-dets-container">
                            <MainDets selectedSize={selectedSize} setselectedSize={setselectedSize} dets={{ name, description, category, sizes, reviewCount: rating?.count || 0 }} />
                            <ProductQuantity quantitySetter={quantitySetter} quantity={quantity} stockValidation={stockValidation} isValidating={stockValidation.loading} />

                            <div className="product-page-btns px-3 md:px-0 mt-6 space-y-3">
                                <button onClick={addToCartHandler} disabled={!canPurchase || cartActionLoading || isInCart} className={`product-add-to-cart-btn w-full py-4 text-center rounded-sm uppercase text-sm font-bold tracking-widest transition-all relative ${isInCart ? 'bg-zinc-800 text-white border border-zinc-700 cursor-pointer' : canPurchase && !cartActionLoading ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                                    {cartActionLoading ? <span className="flex items-center justify-center gap-2"><Icon icon="eos-icons:loading" className="text-lg" /> Adding...</span> : isInCart ? <span className="flex items-center justify-center gap-2"><Icon icon="mdi:check-circle" className="text-lg" /> Added to Cart</span> : 'Add to Cart'}
                                </button>

                                <button onClick={buyNowHandler} disabled={!canPurchase || cartActionLoading} className={`product-buy-btn w-full py-4 text-center rounded-sm uppercase text-sm font-bold tracking-widest transition-all ${canPurchase && !cartActionLoading ? 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10 cursor-pointer' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                                    {cartActionLoading ? 'Processing...' : 'Buy Now'}
                                </button>

                                <button
                                    onClick={handleWishlistToggle}
                                    disabled={wishlistActionLoading || !isLoggedInUser}
                                    className={`w-full py-4 text-center rounded-[3px] uppercase text-sm font-semibold transition-all border ${isInWishlist ? 'bg-purple-500 text-black hover:bg-purple-600' : 'bg-purple-700 border-purple-800 text-white hover:bg-purple-800'
                                        } ${!isLoggedInUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-center gap-2`}
                                >
                                    {wishlistActionLoading ? (
                                        <><Icon icon="eos-icons:loading" className="text-lg" /> {isInWishlist ? 'Removing...' : 'Adding...'}</>
                                    ) : (
                                        <><Icon icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"} className="text-lg" /> {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</>
                                    )}
                                </button>

                                {!isLoggedInUser && <p className="text-xs text-center text-zinc-500 mt-2"><Link to="/account/signin" className="text-zinc-300 hover:text-white underline">Login</Link> to save items to your wishlist</p>}
                            </div>

                            <div className="product-extra-dets md:mt-8">
                                <DeliveryTimeline />
                                <div className="offer-banner px-3 md:px-0 mt-6"><img className="w-full aspect-auto rounded-md" src={offerImg} alt="Offers.png" /></div>
                                <div className="size-warning-banner mt-5 mx-3 md:mx-0 p-4 bg-amber-400 rounded-md text-black text-sm font-bold leading-snug shadow-md border border-amber-500">
                                    please choose the size carefully as our return policy does <Link to="/return-policy" className="text-blue-700 underline decoration-blue-700 underline-offset-2 font-black hover:text-blue-900 uppercase transition-colors">NOT COVER SIZE EXCHANGES.</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="product-review-container bg-black w-full py-12 border-t border-zinc-900 mt-4 relative">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                    <h2 id="reviews-title" className="uppercase font-bold text-xl md:text-3xl text-white mb-8">Customer Reviews</h2>

                    {/* Review Distribution Header */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-10 mb-10 pb-10 border-b border-zinc-800 flex-wrap">
                        <div className="flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-6xl font-bold text-white tracking-tighter">{rating?.average?.toFixed(1) || "0.0"}</span>
                            <div className="flex text-red-600 text-lg my-1">
                                {[...Array(5)].map((_, i) => (
                                    <Icon key={i} icon={i < Math.round(rating?.average || 0) ? "material-symbols:star-rounded" : "material-symbols:star-rounded"} className={i >= Math.round(rating?.average || 0) ? "text-zinc-800" : ""} />
                                ))}
                            </div>
                            <span className="text-sm font-bold text-zinc-400">{rating?.count || 0} reviews</span>
                        </div>
                        <div className="flex-1 w-full max-w-md space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <div key={star} className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                                    <span className="w-12">{star} Star</span>
                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600" style={{ width: `${rating?.count ? (distribution[star] / rating.count) * 100 : 0}%` }}></div>
                                    </div>
                                    <span className="w-4 text-right">{distribution[star]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="md:ml-auto flex gap-2 h-fit relative">

                            <button onClick={() => setIsReviewModalOpen(true)} className={`px-14 sm:px-20 md:px-6 py-2 ${reviewEligibility.canReview ? "bg-red-600" : "bg-zinc-600"} text-white text-sm font-bold uppercase tracking-wide rounded-xs hover:bg-red-700 transition-colors`} disabled={!reviewEligibility.canReview}>
                                {reviewEligibility.hasReviewed ? "Edit Review" : "Write a review"}
                            </button>

                            {/* Sorting Filter */}
                            <div className="relative pr-4 lg:pr-0" ref={sortRef}>
                                <button onClick={() => setIsSortOpen(!isSortOpen)} className="h-full aspect-square bg-red-600 text-white flex items-center justify-center rounded-xs hover:bg-red-700 transition-colors">
                                    <Icon icon="mi:filter" className="text-xl" />
                                </button>
                                {isSortOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white text-black rounded shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wide">Sort by</div>
                                        {["Featured", "Photo priority", "Newest", "Highest Ratings", "Lowest Ratings"].map(opt => (
                                            <div
                                                key={opt}
                                                onClick={() => handleSortChange(opt)}
                                                className={`px-4 py-2 hover:bg-zinc-100 cursor-pointer text-sm font-medium flex justify-between items-center ${sortBy === opt ? "text-red-600 font-bold" : ""}`}
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

                    {/* Review List (Limit 5) */}
                    <div className="reviews space-y-6 pb-10">
                        {(publicReviews && publicReviews.length > 0) || (hasReviewed && existingReview) ? (
                            <>
                                {hasReviewed && existingReview && <ReviewCard review={existingReview} isOwner={true} onEdit={() => setIsReviewModalOpen(true)} />}
                                {publicReviews.map((review) => <ReviewCard key={review._id} review={review} />)}
                            </>
                        ) : <NoReview />}

                        {fetchLoading && (
                            <div className="py-4 text-center">
                                <Icon icon="eos-icons:loading" className="text-3xl text-red-600 inline-block" />
                            </div>
                        )}
                    </div>

                    {/* SEE ALL REVIEWS BUTTON */}
                    {(rating?.count > 5 || (reviewStats && reviewStats.totalReviews > 5)) && (
                        <div className="flex justify-center pb-10">
                            <Link
                                to={`/products/${productId}/reviews`}
                                className="bg-zinc-900 border border-zinc-700 text-white px-10 py-3 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-zinc-800 hover:border-red-600 transition-all flex items-center gap-2 group"
                            >
                                See All Reviews
                                <Icon icon="solar:arrow-right-linear" className="text-lg group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* FEATURES & HIGHLIGHTS & SPECS */}
            <div className="max-w-6xl mx-auto px-4 mt-8"><ProductFeature /></div>
            <div className="product-highlights bg-black w-full mt-12 py-12 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row">
                    <div className="product-highlights-header lg:w-1/3 text-left mb-8">
                        <h2 className="product-highlights-heading uppercase font-bold text-2xl md:text-3xl text-white mb-2 border-l-4 border-red-600 pl-4">Highlights</h2>
                        <p className="font-medium text-sm md:text-base text-zinc-400 pl-5">Precision meets aesthetics.</p>
                    </div>
                    <div className="product-hightlights-image-container lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {highlightImages.map((highlight, idx) => (
                            <div key={`${highlight.url}-highlight-${idx}`} className={`${idx === 0 && "lg:col-span-2"} highlight-img-container w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800`}>
                                <img className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" src={highlight.url} alt="Highlight" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 mt-12 pb-20"><ProductSpecs /></div>

            {/* BEST SELLING SECTION */}
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-10">
                <BestSelling />
            </div>

            {/* NEW: RECENTLY VIEWED SECTION */}
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-10">
                <RecentlyViewed />
            </div>
        </div>
    )
}

export default Productpage;