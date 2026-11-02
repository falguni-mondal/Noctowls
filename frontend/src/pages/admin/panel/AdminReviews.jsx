import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  fetchAllReviews,
  updateReviewStatus,
  deleteReview,
  setReviewFilter,
  selectAdminReviews,
  selectAdminReviewPagination,
  selectAdminReviewLoading,
  selectAdminReviewActionLoading,
} from "../../../store/features/admin/adminReviewSlice";
import Loader from "../../../utils/loader/Loader";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

// Format date strictly as dd/mm/yyyy
const formatDateDDMMYYYY = (dateVal) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "mdi:clock-outline",
    },
    accepted: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "mdi:check-circle-outline",
    },
    rejected: {
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: "mdi:close-circle-outline",
    },
  };
  const config = configs[status] || configs.pending;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.border} ${config.bg} ${config.color} whitespace-nowrap`}
    >
      <Icon icon={config.icon} className="text-base" />
      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">
        {status}
      </span>
    </div>
  );
};

const FilterTab = ({ label, active, onClick }) => (
  <div className="relative group">
    <button
      type="button"
      className={`px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all duration-200 rounded-full whitespace-nowrap snap-center border pointer-events-none ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-transparent text-zinc-600 border-transparent group-hover:text-zinc-900 group-hover:bg-zinc-100"
      }`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
    <span
      onClick={onClick}
      className="absolute inset-0 z-10 cursor-pointer rounded-full"
    />
  </div>
);

const AdminReviews = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read status filter and page from URL query params
  const currentFilter = searchParams.get("status") || "all";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // Redux State
  const reviews = useSelector(selectAdminReviews);
  const pagination = useSelector(selectAdminReviewPagination);
  const loading = useSelector(selectAdminReviewLoading);
  const actionLoading = useSelector(selectAdminReviewActionLoading);

  const [selectedImage, setSelectedImage] = useState(null);

  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (key === "status" && val === "all")
      ) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  useEffect(() => {
    dispatch(setReviewFilter(currentFilter));
    dispatch(
      fetchAllReviews({
        status: currentFilter === "all" ? "" : currentFilter,
        page: currentPage,
      })
    );
  }, [dispatch, currentFilter, currentPage]);

  const handleFilterChange = (filter) => {
    updateUrlParams({ status: filter, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      updateUrlParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStatusUpdate = async (reviewId, status) => {
    if (actionLoading) return;
    try {
      await dispatch(updateReviewStatus({ reviewId, status })).unwrap();
      toast.success(`Review ${status} successfully!`, toastControls);
    } catch (error) {
      toast.error(error || "Action failed", toastControls);
    }
  };

  const handleDelete = async (reviewId) => {
    if (actionLoading) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this review? This will also delete any attached images."
      )
    )
      return;

    try {
      await dispatch(deleteReview(reviewId)).unwrap();
      toast.success("Review deleted successfully", toastControls);
    } catch (error) {
      toast.error(error || "Deletion failed", toastControls);
    }
  };

  return (
    <div className="admin-reviews-page p-4 md:p-8 w-full min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Review Management
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-2 ml-1">
            Monitor, approve, and manage customer feedback.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <div className="flex p-1 bg-white rounded-full border border-zinc-200 shadow-sm min-w-max gap-1">
            {["all", "pending", "accepted", "rejected"].map((filter) => (
              <FilterTab
                key={filter}
                label={filter}
                active={currentFilter === filter}
                onClick={() => handleFilterChange(filter)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 border-dashed mx-auto max-w-lg shadow-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Icon
              icon="solar:chat-square-like-linear"
              className="text-3xl text-zinc-400"
            />
          </div>
          <h3 className="text-lg font-medium text-zinc-800">
            No reviews found
          </h3>
          <p className="text-zinc-500 text-sm mt-1">
            Try changing the filter status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="group bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col lg:flex-row">
                {/* 1. Product Context */}
                <div className="lg:w-64 p-4 md:p-5 bg-zinc-50/70 border-b lg:border-b-0 lg:border-r border-zinc-200 flex lg:flex-col gap-4 items-center lg:items-start shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 lg:w-full lg:h-auto lg:aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                    <img
                      src={optimizeImage(
                        review.product?.images?.[0]?.url ||
                          review.product?.image,
                        { width: 240, quality: 75 }
                      )}
                      loading="lazy"
                      decoding="async"
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="font-semibold text-zinc-900 text-xs md:text-sm leading-tight mb-1 line-clamp-2 wrap-break-words"
                      title={review.product?.name}
                    >
                      {review.product?.name || "Product Name"}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-zinc-600 font-mono bg-zinc-100 border border-zinc-200 px-2 py-1 rounded w-fit">
                      <span className="opacity-60">#</span>
                      {review.product?._id}
                    </div>
                  </div>
                </div>

                {/* 2. Main Review Content */}
                <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {review.userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-semibold text-zinc-900 truncate">
                            {review.userName}
                          </h5>
                          <span className="hidden sm:inline text-xs text-zinc-400">
                            •
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatDateDDMMYYYY(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex text-amber-500 text-sm mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              icon={
                                i < review.rating
                                  ? "solar:star-bold"
                                  : "solar:star-linear"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="self-start sm:self-auto">
                      <StatusBadge status={review.status} />
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 md:p-4 rounded-lg border border-zinc-200 text-sm text-zinc-700 leading-relaxed italic relative">
                    <Icon
                      icon="bxs:quote-alt-left"
                      className="absolute top-2 left-2 text-zinc-200 text-xl md:text-2xl z-0"
                    />
                    <span className="relative z-10 wrap-break-words">
                      {review.comment}
                    </span>
                  </div>

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-zinc-200 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                      {review.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg border border-zinc-200 overflow-hidden cursor-zoom-in active:scale-95 transition-all relative group/img bg-zinc-100"
                        >
                          <img
                            src={optimizeImage(img.url, {
                              width: 160,
                              quality: 75,
                            })}
                            alt="Review attachment"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <span
                            onClick={() => setSelectedImage(img.url)}
                            className="absolute inset-0 z-10 cursor-pointer bg-black/0 group-hover/img:bg-black/10 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Actions */}
                <div className="lg:w-48 bg-zinc-50/70 border-t lg:border-t-0 lg:border-l border-zinc-200 p-4 md:p-5 flex flex-col justify-between shrink-0">
                  <div className="flex flex-row lg:flex-col gap-3">
                    {review.status === "pending" && (
                      <>
                        <div className="relative flex-1 group/btn">
                          <button
                            disabled={actionLoading}
                            className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 pointer-events-none group-hover/btn:bg-emerald-500"
                          >
                            <Icon
                              icon="solar:check-circle-bold"
                              className="text-lg"
                            />
                            <span className="lg:hidden xl:inline">Approve</span>
                          </button>
                          <span
                            onClick={() =>
                              handleStatusUpdate(review._id, "accepted")
                            }
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                          />
                        </div>

                        <div className="relative flex-1 group/btn">
                          <button
                            disabled={actionLoading}
                            className="w-full bg-white text-zinc-700 border border-zinc-300 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 pointer-events-none group-hover/btn:bg-zinc-100 group-hover/btn:text-zinc-900 group-hover/btn:border-zinc-400"
                          >
                            <Icon
                              icon="solar:close-circle-bold"
                              className="text-lg"
                            />
                            <span className="lg:hidden xl:inline">Reject</span>
                          </button>
                          <span
                            onClick={() =>
                              handleStatusUpdate(review._id, "rejected")
                            }
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {review.status === "accepted" && (
                      <div className="relative w-full group/btn">
                        <button
                          disabled={actionLoading}
                          className="w-full py-2 px-3 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 text-sm font-medium transition-all flex items-center justify-center gap-2 pointer-events-none group-hover/btn:bg-rose-100"
                        >
                          <Icon
                            icon="solar:close-circle-bold"
                            className="text-lg group-hover/btn:scale-110 transition-transform"
                          />
                          Revoke
                        </button>
                        <span
                          onClick={() =>
                            handleStatusUpdate(review._id, "rejected")
                          }
                          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                        />
                      </div>
                    )}

                    {review.status === "rejected" && (
                      <div className="relative w-full group/btn">
                        <button
                          disabled={actionLoading}
                          className="w-full py-2 px-3 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 text-sm font-medium transition-all flex items-center justify-center gap-2 pointer-events-none group-hover/btn:bg-emerald-100"
                        >
                          <Icon
                            icon="solar:restart-bold"
                            className="text-lg group-hover/btn:spin-slow transition-transform"
                          />
                          Restore
                        </button>
                        <span
                          onClick={() =>
                            handleStatusUpdate(review._id, "accepted")
                          }
                          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="relative w-full mt-3 group/btn">
                    <button
                      disabled={actionLoading}
                      className="w-full py-2 px-3 rounded-lg text-red-600 border border-transparent text-sm font-medium transition-all flex items-center justify-center gap-2 pointer-events-none group-hover/btn:text-red-700 group-hover/btn:bg-red-50 group-hover/btn:border-red-200"
                    >
                      <Icon
                        icon="solar:trash-bin-trash-linear"
                        className="text-lg group-hover/btn:scale-110 transition-transform"
                      />
                      Delete
                    </button>
                    <span
                      onClick={() => handleDelete(review._id)}
                      className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-10">
          <div className="relative w-10 h-10">
            <button
              disabled={currentPage <= 1}
              className="w-full h-full rounded-lg flex items-center justify-center bg-white text-zinc-700 border border-zinc-200 shadow-sm disabled:opacity-50 transition-colors pointer-events-none"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="text-xl"
              />
            </button>
            {currentPage > 1 && (
              <span
                onClick={() => handlePageChange(currentPage - 1)}
                className="absolute inset-0 z-10 cursor-pointer rounded-lg"
              />
            )}
          </div>

          <div className="px-4 py-2 bg-white rounded-lg border border-zinc-200 shadow-sm text-sm text-zinc-600">
            Page{" "}
            <span className="text-indigo-600 font-bold">{currentPage}</span> of{" "}
            {pagination.pages}
          </div>

          <div className="relative w-10 h-10">
            <button
              disabled={currentPage >= pagination.pages}
              className="w-full h-full rounded-lg flex items-center justify-center bg-white text-zinc-700 border border-zinc-200 shadow-sm disabled:opacity-50 transition-colors pointer-events-none"
            >
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="text-xl"
              />
            </button>
            {currentPage < pagination.pages && (
              <span
                onClick={() => handlePageChange(currentPage + 1)}
                className="absolute inset-0 z-10 cursor-pointer rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-999 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <span
            onClick={() => setSelectedImage(null)}
            className="absolute inset-0 z-0 cursor-pointer"
          />
          <div className="relative w-full max-w-5xl flex flex-col items-center z-10 pointer-events-none">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
            />
            <div className="absolute -top-12 right-0 md:top-4 md:right-4 pointer-events-auto">
              <div className="relative p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all">
                <Icon
                  icon="solar:close-circle-bold"
                  className="text-3xl text-white pointer-events-none"
                />
                <span
                  onClick={() => setSelectedImage(null)}
                  className="absolute inset-0 z-10 cursor-pointer rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
