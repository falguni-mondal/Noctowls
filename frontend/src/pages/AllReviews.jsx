import { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductReviews,
  checkReviewEligibility,
  selectProductReviews,
  selectReviewEligibility,
  resetReviewState,
} from "../store/features/user/reviewSlice";
import { getOneProduct } from "../store/features/user/productSlice";
import ReviewCard from "../components/product/product-review/ReviewCard";
import ReviewModal from "../components/product/product-review/ReviewModal";
import NoReview from "../components/product/product-review/NoReview";
import Loader from "../utils/loader/Loader";
import { optimizeImage } from "../utils/helpers/imageOptimizer";

const REVIEWS_PER_PAGE = 10;

const AllReviews = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Sync sort and page with URL query params
  const sortBy = searchParams.get("sort") || "Featured";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const reviews = useSelector(selectProductReviews);
  const fetchLoading = useSelector((state) => state.reviews.fetchLoading);
  const reviewStats = useSelector((state) => state.reviews.stats);
  const { product } = useSelector((state) => state.products);
  const user = useSelector((state) => state.auth.user);

  const reviewEligibility = useSelector(selectReviewEligibility);
  const { existingReview, hasReviewed } = reviewEligibility;

  const distribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewStats) return reviewStats.distribution;
    if (!reviews) return dist;
    reviews.forEach((r) => {
      const rating = Math.round(r.rating);
      if (dist[rating] !== undefined) dist[rating]++;
    });
    return dist;
  }, [reviews, reviewStats]);

  const publicReviews = useMemo(() => {
    return reviews
      ? reviews.filter((r) => r._id !== existingReview?._id)
      : [];
  }, [reviews, existingReview]);

  const totalPages = Math.max(
    1,
    Math.ceil(publicReviews.length / REVIEWS_PER_PAGE)
  );
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return publicReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [publicReviews, currentPage]);

  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (key === "sort" && val === "Featured")
      ) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  const handleSortChange = (option) => {
    setIsSortOpen(false);
    updateUrlParams({ sort: option, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrlParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    dispatch(getOneProduct(productId));
    dispatch(checkReviewEligibility(productId));
    return () => {
      dispatch(resetReviewState());
    };
  }, [dispatch, productId]);

  useEffect(() => {
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
    <div className="bg-[#f4f4f4] min-h-screen text-[#0f0f0f] font-sans pb-20">
      {isReviewModalOpen && (
        <ReviewModal
          productId={productId}
          onClose={() => setIsReviewModalOpen(false)}
          userName={user?.name}
        />
      )}

      {/* HEADER / NAV */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Link
            to={`/products/${productId}`}
            className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors text-[#0f0f0f]"
          >
            <Icon icon="solar:arrow-left-linear" className="text-2xl" />
          </Link>
          <div className="flex items-center gap-3">
            {product?.images?.[0] && (
              <img
                src={optimizeImage(product.images[0].url, {
                  width: 100,
                  quality: 75,
                })}
                alt="Product"
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded object-cover border border-zinc-200 bg-zinc-50"
              />
            )}
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wide text-[#0f0f0f] line-clamp-1">
                {product?.name}
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                All Reviews ({reviews?.length || 0})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 pt-8">
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 md:items-start">
            <div className="flex flex-col items-center justify-center min-w-[140px] border-b md:border-b-0 md:border-r border-zinc-200 pb-6 md:pb-0 md:pr-8">
              <span className="text-7xl font-bold text-[#0f0f0f] tracking-tighter">
                {product?.rating?.average?.toFixed(1) || "0.0"}
              </span>
              <div className="flex text-red-600 text-xl my-2">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    icon="material-symbols:star-rounded"
                    className={
                      i >= Math.round(product?.rating?.average || 0)
                        ? "text-zinc-300"
                        : ""
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-zinc-500">
                {reviews?.length || 0} Ratings
              </span>
            </div>

            <div className="flex-1 w-full space-y-3 pt-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div
                  key={star}
                  className="flex items-center gap-4 text-xs font-bold text-zinc-500"
                >
                  <span className="w-8 flex items-center gap-1">
                    {star}{" "}
                    <Icon
                      icon="material-symbols:star-rounded"
                      className="text-zinc-400"
                    />
                  </span>
                  <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{
                        width: `${
                          reviews?.length
                            ? (distribution[star] / reviews.length) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-8 text-right text-zinc-600">
                    {distribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-8 border-t border-zinc-200">
            {reviewEligibility.canReview && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="flex-1 sm:flex-none bg-[#0f0f0f] text-white hover:bg-zinc-800 px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all shadow-md"
              >
                {reviewEligibility.hasReviewed
                  ? "Edit Your Review"
                  : "Write a Review"}
              </button>
            )}

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white border border-zinc-300 text-zinc-600 px-5 py-3 rounded-lg hover:border-[#0f0f0f] hover:text-[#0f0f0f] shadow-sm transition-colors text-xs font-bold uppercase tracking-wide"
              >
                <span>
                  Sort: <span className="text-[#0f0f0f] ml-1">{sortBy}</span>
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`text-base transition-transform ${
                    isSortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSortOpen && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-zinc-50 px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-200">
                    Sort Reviews By
                  </div>
                  {[
                    "Featured",
                    "Photo priority",
                    "Newest",
                    "Oldest",
                    "Highest Ratings",
                    "Lowest Ratings",
                  ].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSortChange(opt)}
                      className={`w-full px-4 py-3 hover:bg-zinc-50 cursor-pointer text-xs font-bold flex justify-between items-center transition-colors text-left ${
                        sortBy === opt
                          ? "text-red-600 bg-red-50/50"
                          : "text-zinc-600"
                      }`}
                    >
                      {opt}
                      {sortBy === opt && (
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-sm"
                        />
                      )}
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
              {hasReviewed && existingReview && (
                <div className="mb-8 border border-red-200 rounded-xl bg-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-3 py-1 uppercase tracking-wider rounded-br-lg shadow-sm">
                    Your Review
                  </div>
                  <div className="p-3 pt-6 bg-red-50/30">
                    <ReviewCard
                      review={existingReview}
                      isOwner={true}
                      onEdit={() => setIsReviewModalOpen(true)}
                    />
                  </div>
                </div>
              )}

              {paginatedReviews.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-2">
                  {paginatedReviews.map((review) => (
                    <div key={review._id} className="p-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              ) : (
                !hasReviewed && <NoReview />
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-[#0f0f0f] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon icon="solar:alt-arrow-left-linear" />
                  </button>
                  <span className="text-sm text-zinc-500 font-medium">
                    Page{" "}
                    <span className="text-[#0f0f0f] font-bold">
                      {currentPage}
                    </span>{" "}
                    of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-[#0f0f0f] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon icon="solar:alt-arrow-right-linear" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllReviews;