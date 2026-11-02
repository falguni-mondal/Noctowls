import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import {
  getAllWishlists,
  deleteWishlist,
  setWishlistFilter,
  selectAdminWishlists,
  selectAdminWishlistPagination,
  selectAdminWishlistLoading,
  selectAdminWishlistActionLoading,
} from "../../../store/features/admin/adminWishlistSlice";
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

const getWishlistTimestamp = (doc) => {
  const dateStr = doc?.updatedAt || doc?.createdAt || doc?.addedAt;
  if (dateStr) {
    const t = new Date(dateStr).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const idStr = String(doc?._id || "");
  return /^[0-9a-fA-F]{24}$/.test(idStr)
    ? parseInt(idStr.substring(0, 8), 16) * 1000
    : 0;
};

const AdminWishlists = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read page and search from URL query params
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchQuery = searchParams.get("search") || "";

  // Redux State
  const wishlists = useSelector(selectAdminWishlists);
  const pagination = useSelector(selectAdminWishlistPagination);
  const loading = useSelector(selectAdminWishlistLoading);
  const actionLoading = useSelector(selectAdminWishlistActionLoading);

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  const sortedWishlists = useMemo(() => {
    if (!Array.isArray(wishlists)) return [];
    return [...wishlists].sort((a, b) => {
      const diff = getWishlistTimestamp(b) - getWishlistTimestamp(a);
      if (diff !== 0) return diff;
      return String(b._id || "").localeCompare(String(a._id || ""));
    });
  }, [wishlists]);

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  // --- EFFECT: Debounce Search into URL params ---
  useEffect(() => {
    if (searchTerm === searchQuery) return;
    const handler = setTimeout(() => {
      updateUrlParams({ search: searchTerm, page: 1 });
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery]);

  // --- EFFECT: Fetch Data ---
  useEffect(() => {
    dispatch(setWishlistFilter({ search: searchQuery }));
    dispatch(
      getAllWishlists({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      })
    );
  }, [dispatch, currentPage, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    };
    const handleScroll = () => setActivePopover(null);

    if (activePopover) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activePopover]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateUrlParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const handleTogglePopover = (e, list) => {
    e.stopPropagation();

    if (activePopover?.id === list._id) {
      setActivePopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeightEstimate = Math.min(list.items.length * 45 + 50, 400);
    const openUpwards = spaceBelow < popoverHeightEstimate;

    const sortedItems = [...(list.items || [])].sort(
      (a, b) => getWishlistTimestamp(b) - getWishlistTimestamp(a)
    );

    setActivePopover({
      id: list._id,
      items: sortedItems,
      top: openUpwards ? "auto" : rect.bottom + 8,
      bottom: openUpwards ? window.innerHeight - rect.top + 8 : "auto",
      right: window.innerWidth - rect.right,
      origin: openUpwards ? "origin-bottom-right" : "origin-top-right",
    });
  };

  const handleDelete = async (e, listId) => {
    e.stopPropagation();
    setActivePopover(null);

    if (!window.confirm("Are you sure you want to delete this wishlist?"))
      return;

    try {
      await dispatch(deleteWishlist(listId)).unwrap();
      toast.success("Wishlist deleted successfully", toastControls);
    } catch (error) {
      toast.error(error || "Failed to delete wishlist", toastControls);
    }
  };

  const getItemImage = (item) => {
    if (item.product?.images?.length > 0) return item.product.images[0].url;
    if (item.product?.image) return item.product.image;
    return "https://placehold.co/100x100?text=No+Img";
  };

  const getItemName = (item) => item.product?.name || "Product Name";
  const getItemCategory = (item) => item.product?.category || "General";

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans relative">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            Wishlists
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            View and manage customer saved items (latest first).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-xs">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
              Total Wishlists
            </span>
            <span className="text-2xl font-bold text-zinc-900 leading-none mt-1">
              {pagination.totalWishlists}
            </span>
          </div>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-2 mb-6 shadow-xs">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-lg group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon
                icon="mynaui:search"
                className="text-zinc-400 text-lg group-focus-within:text-indigo-600 transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm placeholder-zinc-400 text-zinc-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          {searchTerm && (
            <div className="relative">
              <button className="px-3 py-2.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium pointer-events-none">
                <Icon icon="solar:restart-bold" className="text-lg" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <span
                onClick={handleClearFilters}
                className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                title="Clear Search"
              />
            </div>
          )}
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex justify-center items-start pt-32 backdrop-blur-[2px]">
            <Loader />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-600 font-semibold">
                <th className="p-5 pl-6">Customer</th>
                <th className="p-5">Saved Items</th>
                <th className="p-5">Last Updated</th>
                <th className="p-5 text-right pr-6 w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {sortedWishlists.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Icon
                          icon="solar:heart-broken-linear"
                          className="text-3xl text-zinc-400"
                        />
                      </div>
                      <p className="text-zinc-700 font-semibold">
                        No wishlists found
                      </p>
                      <p className="text-xs text-zinc-500">
                        Try adjusting your search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedWishlists.map((list) => (
                  <tr
                    key={list._id}
                    className="group hover:bg-zinc-50/80 transition-colors border-b border-zinc-200 last:border-0 relative"
                  >
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                          {list.user?.name
                            ? list.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {list.user?.name || "Unknown User"}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {list.user?.email || "No Email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:heart-angle-bold"
                          className="text-rose-500"
                        />
                        <span className="text-zinc-800 font-semibold">
                          {list.items?.length || 0} Saved
                        </span>
                      </div>
                    </td>

                    <td className="p-5 text-zinc-600">
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                          <Icon
                            icon="solar:calendar-linear"
                            className="text-zinc-400"
                          />
                          <span>
                            {formatDateDDMMYYYY(
                              list.updatedAt || list.createdAt
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 pl-5">
                          {new Date(
                            list.updatedAt || list.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="p-5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 relative z-20">
                        <div className="relative group/btn">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border pointer-events-none ${
                              activePopover?.id === list._id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-zinc-600 border-zinc-200 group-hover/btn:text-zinc-900 group-hover/btn:bg-zinc-100 group-hover/btn:border-zinc-300"
                            }`}
                          >
                            <Icon
                              icon={
                                activePopover?.id === list._id
                                  ? "solar:eye-bold"
                                  : "solar:eye-linear"
                              }
                              className="text-lg"
                            />
                          </div>

                          <span
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleTogglePopover(e, list)}
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                            title="View Items"
                          />
                        </div>

                        <div className="relative group/btn">
                          <button
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-zinc-500 border border-zinc-200 group-hover/btn:text-red-600 group-hover/btn:bg-red-50 group-hover/btn:border-red-200 transition-all disabled:opacity-50 pointer-events-none"
                          >
                            <Icon
                              icon="solar:trash-bin-trash-bold"
                              className="text-lg"
                            />
                          </button>
                          <span
                            onClick={(e) => handleDelete(e, list._id)}
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                            title="Delete Wishlist"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-zinc-200 p-4 flex items-center justify-between bg-zinc-50">
            <span className="text-xs font-medium text-zinc-600">
              Page{" "}
              <span className="text-zinc-900 font-bold">{currentPage}</span> of{" "}
              {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs disabled:opacity-50 transition flex items-center gap-1 pointer-events-none shadow-2xs"
                >
                  <Icon icon="solar:alt-arrow-left-linear" />
                  Previous
                </button>
                {currentPage > 1 && (
                  <span
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                  />
                )}
              </div>

              <div className="relative">
                <button
                  disabled={currentPage >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs disabled:opacity-50 transition flex items-center gap-1 pointer-events-none shadow-2xs"
                >
                  Next
                  <Icon icon="solar:alt-arrow-right-linear" />
                </button>
                {currentPage < pagination.totalPages && (
                  <span
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POPOVER (LIGHT THEME) */}
      {activePopover && (
        <div
          ref={popoverRef}
          className={`fixed z-100 w-72 bg-white border border-zinc-200 shadow-2xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[50vh] ${activePopover.origin}`}
          style={{
            top: activePopover.top,
            bottom: activePopover.bottom,
            right: activePopover.right,
          }}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-200 shrink-0">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Icon icon="solar:heart-bold" className="text-rose-500" />
              Contents (Latest First)
            </h3>
            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
              {activePopover.items.length} Products
            </span>
          </div>

          <div className="overflow-y-auto pr-1 space-y-1">
            {activePopover.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 transition-colors group relative"
              >
                <div className="w-9 h-9 bg-zinc-100 rounded-md overflow-hidden shrink-0 border border-zinc-200 relative">
                  <img
                    src={optimizeImage(getItemImage(item), {
                      width: 100,
                      quality: 75,
                    })}
                    loading="lazy"
                    decoding="async"
                    alt={getItemName(item)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/100x100?text=No+Img";
                    }}
                  />
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
                  <h4
                    className="text-xs font-semibold text-zinc-900 truncate leading-none"
                    title={getItemName(item)}
                  >
                    {getItemName(item)}
                  </h4>
                  <div className="text-[10px] text-zinc-500 leading-none capitalize mt-0.5">
                    {getItemCategory(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWishlists;