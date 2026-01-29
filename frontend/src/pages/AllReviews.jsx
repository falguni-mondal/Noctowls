import { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchProductReviews,
    checkReviewEligibility,
    selectProductReviews,
    selectReviewEligibility,
    resetReviewState
} from "../store/features/user/reviewSlice";
import { getOneProduct } from "../store/features/user/productSlice";
import ReviewCard from "../components/product/product-review/ReviewCard";
import ReviewModal from "../components/product/product-review/ReviewModal";
import NoReview from "../components/product/product-review/NoReview";
import Loader from "../utils/loader/Loader";

const AllReviews = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    
    // States
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortBy, setSortBy] = useState("Featured");
    const sortRef = useRef(null);

    // Redux Selectors
    const reviews = useSelector(selectProductReviews);
    const fetchLoading = useSelector(state => state.reviews.fetchLoading);
    const reviewStats = useSelector(state => state.reviews.stats);
    const { product } = useSelector(state => state.products);
    const user = useSelector(state => state.auth.user);
    
    const reviewEligibility = useSelector(selectReviewEligibility);
    const { existingReview, hasReviewed } = reviewEligibility;

    // --- Stats Calculation ---
    const distribution = useMemo(() => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (reviewStats) return reviewStats.distribution;
        if (!reviews) return dist;
        reviews.forEach(r => {
            const rating = Math.round(r.rating);
            if (dist[rating] !== undefined) dist[rating]++;
        });
        return dist;
    }, [reviews, reviewStats]);

    // Filter out user's review from public list (to pin it top)
    const publicReviews = useMemo(() => {
        return reviews ? reviews.filter(r => r._id !== existingReview?._id) : [];
    }, [reviews, existingReview]);

    const handleSortChange = (option) => {
        setSortBy(option);
        setIsSortOpen(false);
    };

    // Effects
    useEffect(() => {
        dispatch(getOneProduct(productId));
        dispatch(checkReviewEligibility(productId));
        return () => { dispatch(resetReviewState()) };
    }, [dispatch, productId]);

    useEffect(() => {
        // Fetch ALL reviews (no limit implied by thunk/controller)
        dispatch(fetchProductReviews({ productId, sortBy }));
    }, [dispatch, productId, sortBy]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!product && !fetchLoading) return <Loader />;

    return (
        <div className="bg-black min-h-screen text-zinc-100 font-sans pb-20">
            {isReviewModalOpen && (
                <ReviewModal
                    productId={productId}
                    onClose={() => setIsReviewModalOpen(false)}
                    userName={user?.name}
                />
            )}

            {/* HEADER / NAV */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
                    <Link to={`/products/${productId}`} className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors text-white">
                        <Icon icon="solar:arrow-left-linear" className="text-2xl" />
                    </Link>
                    <div className="flex items-center gap-3">
                        {product?.images?.[0] && (
                            <img src={product.images[0].url} alt="Product" className="w-10 h-10 rounded object-cover border border-zinc-700" />
                        )}
                        <div>
                            <h1 className="text-sm font-bold uppercase tracking-wide text-zinc-200 line-clamp-1">{product?.name}</h1>
                            <p className="text-xs text-zinc-500">All Reviews ({reviews?.length || 0})</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-[1000px] mx-auto px-4 md:px-8 pt-8">
                
                {/* STATS & FILTER HEADER */}
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 md:items-start">
                        {/* Rating Big Number */}
                        <div className="flex flex-col items-center justify-center min-w-[140px] border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-8">
                            <span className="text-7xl font-bold text-white tracking-tighter">{product?.rating?.average?.toFixed(1) || "0.0"}</span>
                            <div className="flex text-red-600 text-xl my-2">
                                {[...Array(5)].map((_, i) => (
                                    <Icon key={i} icon={i < Math.round(product?.rating?.average || 0) ? "material-symbols:star-rounded" : "material-symbols:star-rounded"} className={i >= Math.round(product?.rating?.average || 0) ? "text-zinc-800" : ""} />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-zinc-400">{reviews?.length || 0} Ratings</span>
                        </div>

                        {/* Distribution Bars */}
                        <div className="flex-1 w-full space-y-3 pt-2">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <div key={star} className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                                    <span className="w-8 flex items-center gap-1">{star} <Icon icon="material-symbols:star-rounded" className="text-zinc-600" /></span>
                                    <div className="flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                        <div className="h-full bg-linear-to-r from-red-700 to-red-500 rounded-full" style={{ width: `${reviews?.length ? (distribution[star] / reviews.length) * 100 : 0}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{distribution[star]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-8 border-t border-zinc-800">
                        {/* Write/Edit Button */}
                        {reviewEligibility.canReview && (
                            <button 
                                onClick={() => setIsReviewModalOpen(true)} 
                                className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {reviewEligibility.hasReviewed ? "Edit Your Review" : "Write a Review"}
                            </button>
                        )}

                        {/* Filter Dropdown */}
                        <div className="relative" ref={sortRef}>
                            <button 
                                onClick={() => setIsSortOpen(!isSortOpen)} 
                                className="w-full sm:w-auto flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 text-zinc-300 px-5 py-3 rounded hover:border-zinc-600 transition-colors text-xs font-bold uppercase tracking-wide"
                            >
                                <span>Sort: <span className="text-white ml-1">{sortBy}</span></span>
                                <Icon icon="solar:alt-arrow-down-linear" className={`text-base transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                            </button>
                            
                            {isSortOpen && (
                                <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="bg-zinc-900/50 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-800">Sort Reviews By</div>
                                    {["Featured", "Photo priority", "Newest", "Oldest", "Highest Ratings", "Lowest Ratings"].map(opt => (
                                        <button 
                                            key={opt} 
                                            onClick={() => handleSortChange(opt)} 
                                            className={`w-full px-4 py-3 hover:bg-zinc-900 cursor-pointer text-xs font-medium flex justify-between items-center transition-colors text-left ${sortBy === opt ? "text-red-500 bg-red-500/5" : "text-zinc-300"}`}
                                        >
                                            {opt}
                                            {sortBy === opt && <Icon icon="solar:check-circle-bold" className="text-sm" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* REVIEWS GRID */}
                <div className="space-y-6">
                    {fetchLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            {/* User's Review Pinned */}
                            {hasReviewed && existingReview && (
                                <div className="mb-8 border border-red-900/30 rounded-lg bg-red-950/10 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-3 py-1 uppercase tracking-wider rounded-br">Your Review</div>
                                    <div className="p-1">
                                        <ReviewCard review={existingReview} isOwner={true} onEdit={() => setIsReviewModalOpen(true)} />
                                    </div>
                                </div>
                            )}

                            {/* Public Reviews */}
                            {publicReviews.length > 0 ? (
                                publicReviews.map((review) => (
                                    <ReviewCard key={review._id} review={review} />
                                ))
                            ) : (
                                !hasReviewed && <NoReview />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllReviews;