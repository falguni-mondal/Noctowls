import { useState, useEffect, useCallback, useRef } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { getOneProduct, validateProductStock, clearStockValidation } from "../store/features/user/productSlice";
import { addToCart, selectActionLoading, selectCart } from "../store/features/user/cartSlice";
import {
    toggleWishlist,
    selectIsProductInWishlist,
    selectWishlistActionLoading
} from "../store/features/user/wishlistSlice";

// Import Review Actions/Selectors
import {
    fetchProductReviews,
    checkReviewEligibility,
    selectProductReviews,
    selectReviewEligibility,
    resetReviewState
} from "../store/features/user/reviewSlice";

import Loader from "../utils/loader/Loader";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";

const Productpage = () => {
    const [selectedSize, setselectedSize] = useState("l");
    const [quantity, setQuantity] = useState(1);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // Modal State

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { productId } = useParams();

    // Product state
    const { product, productLoading, productError, stockValidation } = useSelector(state => state.products);

    // Cart state
    const cartActionLoading = useSelector(selectActionLoading);
    const cart = useSelector(selectCart);

    // Review State
    const reviews = useSelector(selectProductReviews); // Public Accepted Reviews
    const reviewEligibility = useSelector(selectReviewEligibility);
    
    // ✅ EXTRACT USER'S REVIEW DATA
    const { existingReview, hasReviewed } = reviewEligibility;

    // Wishlist state
    const isInWishlist = useSelector(selectIsProductInWishlist(productId));
    const wishlistActionLoading = useSelector(selectWishlistActionLoading);

    // Auth state 
    const user = useSelector(state => state.auth.user);
    const isAdmin = useSelector(state => state.adminAuth.admin);
    const isLoggedInUser = user && !isAdmin;

    const validationTimerRef = useRef(null);

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        dispatch(getOneProduct(productId));
        // Fetch Reviews
        dispatch(fetchProductReviews({ productId }));
        // Check if user can review
        dispatch(checkReviewEligibility(productId));

        return () => {
            dispatch(clearStockValidation());
            dispatch(resetReviewState()); // Cleanup reviews on unmount
        };
    }, [dispatch, productId])

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
            return itemProductId === productId &&
                item.size?.value.toLowerCase() === selectedSize?.toLowerCase();
        });
    }, [cart, productId, selectedSize]);

    const isInCart = isProductInCart();
    const canPurchase = stockValidation?.data?.isAvailable !== false && !stockValidation.loading && !isAdmin;

    const addToCartHandler = async () => {
        if (isInCart) {
            toast.info("This item is already in your cart!", toastControls);
            return;
        }
        if (!canPurchase || cartActionLoading) return;

        try {
            await dispatch(addToCart({
                productId,
                sizeValue: selectedSize,
                quantity: quantity
            })).unwrap();
            toast.success("Added to cart!", toastControls);
        } catch (error) {
            toast.error(error || "Failed to add!", toastControls);
        }
    };

    const buyNowHandler = async () => {
        if (!canPurchase || cartActionLoading) return;
        try {
            if (!isInCart) {
                await dispatch(addToCart({
                    productId,
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
            const result = await dispatch(toggleWishlist(productId)).unwrap();
            toast.success(result.message || (result.isInWishlist ? "Added to wishlist!" : "Removed from wishlist"), toastControls);
        } catch (error) {
            toast.error(error || "Failed to update wishlist", toastControls);
        }
    };

    if (productLoading) return <Loader />

    if (productError || !product) {
        return (
            <div className="w-full py-20 flex justify-center items-center">
                <p className="bg-red-950 border-red-700 border rounded px-5 py-2">Product not found.</p>
            </div>
        )
    }

    const { name, description, category, images, highlightImages, sizes, inStock, salesCount, rating } = product;

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

    // ✅ Filter Public Reviews: Don't show my review in the public list if it's already there
    // This avoids duplication since we show "Your Review" at the top separately.
    const publicReviews = reviews
        ? reviews.filter(r => r._id !== existingReview?._id)
        : [];

    return (
        <div className="product-page-wrapper pb-10">
            {/* Modal */}
            {isReviewModalOpen && (
                <ReviewModal
                    productId={productId}
                    onClose={() => setIsReviewModalOpen(false)}
                    userName={user?.name}
                />
            )}

            <div className="product-image-slider w-full pt-5 relative">
                <ImageSlider images={images} />
                <div onClick={handleShare} className="product-link-share-btn absolute top-7 right-3 z-99 w-10 aspect-square rounded-full bg-indigo-200 flex justify-center items-center text-black text-[1.5rem] cursor-pointer hover:bg-indigo-300 transition">
                    <Icon icon="ic:baseline-share" />
                </div>
                <div
                    onClick={handleWishlistToggle}
                    className={`product-wishlist-btn absolute top-7 left-3 z-99 w-10 aspect-square rounded-full flex justify-center items-center text-[1.5rem] cursor-pointer transition ${isInWishlist ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white/90 text-red-600 hover:bg-white'
                        } ${!isLoggedInUser ? 'opacity-70' : ''} ${wishlistActionLoading ? 'pointer-events-none' : ''}`}
                >
                    {wishlistActionLoading ? (
                        <Icon icon="eos-icons:loading" className="text-2xl" />
                    ) : (
                        <Icon icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"} className={`text-2xl ${isInWishlist ? 'animate-pulse' : ''}`} />
                    )}
                </div>
            </div>

            <div className="product-dets-container">
                <MainDets
                    selectedSize={selectedSize}
                    setselectedSize={setselectedSize}
                    dets={{ name, description, category, sizes, reviewCount: rating?.count || 0 }}
                />
                <ProductQuantity
                    quantitySetter={quantitySetter}
                    quantity={quantity}
                    stockValidation={stockValidation}
                    isValidating={stockValidation.loading}
                />

                <div className="product-page-btns px-3 mt-5 space-y-2">
                    <button
                        onClick={addToCartHandler}
                        disabled={!canPurchase || cartActionLoading || isInCart}
                        className={`product-add-to-cart-btn w-full py-3 text-center rounded-[3px] uppercase text-xs font-semibold transition-all relative ${isInCart ? 'bg-red-400 text-white cursor-default' : canPurchase && !cartActionLoading ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-400 text-zinc-100 cursor-not-allowed'
                            }`}
                    >
                        {cartActionLoading ? (
                            <span className="flex items-center justify-center gap-2"><Icon icon="eos-icons:loading" className="text-lg" /> Adding...</span>
                        ) : isInCart ? (
                            <span className="flex items-center justify-center gap-2"><Icon icon="mdi:check-circle" className="text-lg" /> Added to cart</span>
                        ) : ('Add to cart')}
                    </button>

                    <button
                        onClick={buyNowHandler}
                        disabled={!canPurchase || cartActionLoading}
                        className={`product-buy-btn w-full py-3 text-center rounded-[3px] uppercase text-xs font-semibold transition-all ${canPurchase && !cartActionLoading ? 'bg-zinc-100 text-black hover:bg-zinc-300' : 'bg-gray-500 text-zinc-800 cursor-not-allowed'
                            }`}
                    >
                        {cartActionLoading ? 'Processing...' : 'Buy now'}
                    </button>

                    <button
                        onClick={handleWishlistToggle}
                        disabled={wishlistActionLoading || !isLoggedInUser}
                        className={`w-full py-3 text-center rounded-[3px] uppercase text-xs font-semibold transition-all border ${isInWishlist ? 'bg-indigo-400 text-black hover:bg-indigo-500' : 'bg-indigo-600 border-indigo-700 text-zinc-300 hover:border-indigo-500'
                            } ${!isLoggedInUser ? 'opacity-50 cursor-not-allowed' : ''} flex items-center justify-center gap-2`}
                    >
                        {wishlistActionLoading ? (
                            <><Icon icon="eos-icons:loading" className="text-lg" /> {isInWishlist ? 'Removing...' : 'Adding...'}</>
                        ) : (
                            <><Icon icon={isInWishlist ? "mdi:heart" : "mdi:heart-outline"} className="text-lg" /> {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</>
                        )}
                    </button>

                    {!isLoggedInUser && (
                        <p className="text-xs text-center text-zinc-500">
                            <Link to="/account/signin" className="text-indigo-400 hover:text-indigo-300 underline">Login</Link> to save items to your wishlist
                        </p>
                    )}
                </div>

                <div className="product-extra-dets">
                    <DeliveryTimeline />
                    <div className="offer-banner px-3 mt-5">
                        <img className="w-full aspect-auto" src={offerImg} alt="Offers.png" />
                    </div>
                </div>
            </div>

            {/* ========== REVIEWS SECTION ========== */}
            <div className="product-review-container px-3 mt-8 py-10 border-y border-zinc-700">
                <div className="product-review-header flex flex-col gap-3">
                    <h2 className="product-review-header uppercase text-center font-semibold text-xl">
                        customer reviews
                    </h2>

                    {/* Rating Summary Header */}
                    <div className="flex flex-col items-center justify-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold">{rating?.average || 0}</span>
                            <Icon icon="material-symbols:star-rounded" className="text-3xl text-amber-500" />
                        </div>
                        <span className="text-sm text-zinc-400">Based on {rating?.count || 0} reviews</span>
                    </div>

                    {/* Write Review Button (Condition Logic) */}
                    {reviewEligibility.canReview ? (
                        <div
                            onClick={() => setIsReviewModalOpen(true)}
                            className={`add-review-btn w-full py-3 text-center text-sm font-medium border rounded cursor-pointer transition ${reviewEligibility.hasReviewed
                                    ? "bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-zinc-200" // Edit Style
                                    : "bg-red-600 border-red-600 hover:bg-red-700 text-white"       // Write Style
                                }`}
                        >
                            {reviewEligibility.hasReviewed ? "Edit your review" : "Write a review"}
                        </div>
                    ) : reviewEligibility.hasReviewed ? (
                        <div className="w-full py-2 text-center text-xs text-green-500 bg-green-500/10 rounded border border-green-500/20">
                            You have reviewed.
                        </div>
                    ) : (
                        <div className="w-full py-2 text-center text-xs text-zinc-500 bg-zinc-900 rounded border border-zinc-800">
                            Purchase to review.
                        </div>
                    )}

                </div>

                <div className="reviews mt-6 max-h-[700px] overflow-y-scroll">
                    
                    {/* SHOW USER'S OWN REVIEW (Pinned at Top) */}
                    {hasReviewed && existingReview && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center justify-between mb-2 px-1">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Your Review</h4>
                            </div>
                            
                            <ReviewCard 
                                review={existingReview} 
                                isOwner={true} 
                                onEdit={() => setIsReviewModalOpen(true)}
                            />
                        </div>
                    )}

                    {/* SHOW PUBLIC REVIEWS (Filtered) */}
                    {(publicReviews && publicReviews.length > 0) || (hasReviewed && existingReview) ? (
                        <div className="space-y-4">
                            {publicReviews.map((review) => (
                                <ReviewCard key={review._id} review={review} />
                            ))}
                        </div>
                    ) : (
                        <NoReview />
                    )}
                </div>

                <ProductFeature />
            </div>

            <div className="product-highlights px-3 py-10 border-b-[0.5px] border-zinc-700">
                <div className="product-highlights-header">
                    <h2 className="product-highlights-heading uppercase font-semibold mb-2">highlights</h2>
                    <p className="font-medium text-sm leading-tight">Performance wrapped in art, built for modern warriors of precision.</p>
                </div>
                <div className="product-hightlights-image-container mt-10">
                    {highlightImages.map(highlight => (
                        <div key={`${highlight.url}-highlight-img-key`} className="highlight-img-container w-full bg-zinc-950 rounded mt-3">
                            <img className="w-full aspect-auto" src={highlight.url} alt="" />
                        </div>
                    ))}
                    <div className="highlight-last-img mt-10">
                        <p className="font-medium text-sm leading-tight">Designed to endure daily use, delivering consistent quality and control — day after day.</p>
                        <div className="highlight-img-container w-full bg-zinc-950 rounded mt-5">
                            <img className="w-full aspect-auto" src="https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823" alt="" />
                        </div>
                    </div>
                </div>
            </div>
            <ProductSpecs />
        </div>
    )
}

export default Productpage;