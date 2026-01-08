import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { 
    fetchAllReviews, 
    updateReviewStatus, 
    setReviewFilter,
    selectAdminReviews,
    selectAdminReviewPagination,
    selectAdminReviewFilter,
    selectAdminReviewLoading,
    selectAdminReviewActionLoading
} from "../../../store/features/admin/adminReviewSlice";
import Loader from "../../../utils/loader/Loader";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const AdminReviews = () => {
    const dispatch = useDispatch();
    
    // Redux State
    const reviews = useSelector(selectAdminReviews);
    const pagination = useSelector(selectAdminReviewPagination);
    const currentFilter = useSelector(selectAdminReviewFilter);
    const loading = useSelector(selectAdminReviewLoading);
    const actionLoading = useSelector(selectAdminReviewActionLoading);

    // Local State
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        dispatch(fetchAllReviews({ 
            status: currentFilter === "all" ? "" : currentFilter,
            page: pagination.current 
        }));
    }, [dispatch, currentFilter, pagination.current]);

    const handleFilterChange = (filter) => {
        dispatch(setReviewFilter(filter));
    };

    const handlePageChange = (newPage) => {
        dispatch(fetchAllReviews({ 
            status: currentFilter === "all" ? "" : currentFilter,
            page: newPage 
        }));
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

    // --- SUB-COMPONENTS ---

    const StatusBadge = ({ status }) => {
        const configs = {
            pending: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: "mdi:clock-outline" },
            accepted: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: "mdi:check-circle-outline" },
            rejected: { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", icon: "mdi:close-circle-outline" }
        };
        const config = configs[status] || configs.pending;

        return (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.border} ${config.bg} ${config.color} whitespace-nowrap`}>
                <Icon icon={config.icon} className="text-base" />
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">{status}</span>
            </div>
        );
    };

    const FilterTab = ({ label, active, onClick }) => (
        <button
            onClick={onClick}
            className={`relative px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap snap-center ${
                active 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
        >
            {label.charAt(0).toUpperCase() + label.slice(1)}
        </button>
    );

    return (
        <div className="admin-reviews-page p-4 md:p-8 w-full min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-x-hidden">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Review Management
                    </h1>
                    <p className="text-zinc-400 text-xs md:text-sm mt-2 ml-1">Monitor, approve, and manage customer feedback.</p>
                </div>

                {/* Filter Tabs - Horizontal Scroll on Mobile */}
                <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <div className="flex p-1 bg-zinc-900/80 backdrop-blur-sm rounded-full border border-zinc-800 min-w-max">
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
                <div className="flex justify-center items-center h-64"><Loader /></div>
            ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed mx-auto max-w-lg">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                        <Icon icon="solar:chat-square-like-linear" className="text-3xl text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300">No reviews found</h3>
                    <p className="text-zinc-500 text-sm mt-1">Try changing the filter status.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reviews.map((review) => (
                        <div key={review._id} className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                            <div className="flex flex-col lg:flex-row">
                                
                                {/* 1. Product Context (Left Sidebar on Desktop, Top Row on Mobile) */}
                                <div className="lg:w-64 p-4 md:p-5 bg-zinc-900 border-b lg:border-b-0 lg:border-r border-zinc-800 flex lg:flex-col gap-4 items-center lg:items-start shrink-0">
                                    <div className="w-12 h-12 md:w-16 md:h-16 lg:w-full lg:h-auto lg:aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 shadow-inner shrink-0">
                                        <img 
                                            src={review.product?.images?.[0]?.url || review.product?.image} 
                                            alt="Product" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-zinc-200 text-xs md:text-sm leading-tight mb-1 line-clamp-2 wrap-break-words" title={review.product?.name}>
                                            {review.product?.name || "Product Name"}
                                        </h4>
                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-1 rounded w-fit">
                                            <span className="opacity-50">#</span>
                                            {review.product?._id?.slice(-6)}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Main Review Content (Middle) */}
                                <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 min-w-0">
                                    {/* User & Rating Header */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                                                {review.userName?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h5 className="font-semibold text-zinc-200 truncate">{review.userName}</h5>
                                                    <span className="hidden sm:inline text-xs text-zinc-500">•</span>
                                                    <span className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex text-amber-400 text-sm mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Icon key={i} icon={i < review.rating ? "solar:star-bold" : "solar:star-linear"} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="self-start sm:self-auto">
                                            <StatusBadge status={review.status} />
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div className="bg-zinc-950/50 p-3 md:p-4 rounded-lg border border-zinc-800/50 text-sm text-zinc-300 leading-relaxed italic relative">
                                        <Icon icon="bxs:quote-alt-left" className="absolute top-2 left-2 text-zinc-800 text-xl md:text-2xl z-0" />
                                        <span className="relative z-10 wrap-break-words">{review.comment}</span>
                                    </div>

                                    {/* Images */}
                                    {review.images?.length > 0 && (
                                        <div className="flex gap-2 pt-2 border-t border-zinc-800/50 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                            {review.images.map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg border border-zinc-700 overflow-hidden cursor-zoom-in active:scale-95 transition-all"
                                                    onClick={() => setSelectedImage(img.url)}
                                                >
                                                    <img src={img.url} alt="Review attachment" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Actions (Right Sidebar on Desktop, Bottom Row on Mobile) */}
                                <div className="lg:w-48 bg-zinc-900/50 border-t lg:border-t-0 lg:border-l border-zinc-800 p-4 md:p-5 flex flex-row lg:flex-col justify-end lg:justify-center gap-3 shrink-0">
                                    {review.status === "pending" && (
                                        <>
                                            <button 
                                                onClick={() => handleStatusUpdate(review._id, "accepted")}
                                                disabled={actionLoading}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Icon icon="solar:check-circle-bold" className="text-lg" />
                                                <span className="lg:hidden xl:inline">Approve</span>
                                            </button>
                                            <button 
                                                onClick={() => handleStatusUpdate(review._id, "rejected")}
                                                disabled={actionLoading}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Icon icon="solar:close-circle-bold" className="text-lg" />
                                                <span className="lg:hidden xl:inline">Reject</span>
                                            </button>
                                        </>
                                    )}
                                    
                                    {review.status === "accepted" && (
                                        <button 
                                            onClick={() => handleStatusUpdate(review._id, "rejected")}
                                            className="w-full py-2 px-3 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Icon icon="solar:trash-bin-trash-linear" className="text-lg group-hover/btn:scale-110 transition-transform" />
                                            Revoke
                                        </button>
                                    )}

                                    {review.status === "rejected" && (
                                        <button 
                                            onClick={() => handleStatusUpdate(review._id, "accepted")}
                                            className="w-full py-2 px-3 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Icon icon="solar:restart-bold" className="text-lg group-hover/btn:spin-slow transition-transform" />
                                            Restore
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pb-10">
                    <button
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 text-zinc-400 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
                    </button>
                    <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-sm text-zinc-400">
                        Page <span className="text-indigo-400 font-bold">{pagination.current}</span> of {pagination.pages}
                    </div>
                    <button
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === pagination.pages}
                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 text-zinc-400 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
                    </button>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-999 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative w-full max-w-5xl flex flex-col items-center">
                        <img 
                            src={selectedImage} 
                            alt="Full size" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button className="absolute -top-12 right-0 md:top-4 md:right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all">
                            <Icon icon="solar:close-circle-bold" className="text-3xl" />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminReviews;