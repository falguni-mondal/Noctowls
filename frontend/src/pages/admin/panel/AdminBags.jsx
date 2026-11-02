import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import {
  getAllBags,
  deleteBag,
  setBagFilter,
  selectAdminBags,
  selectAdminBagPagination,
  selectAdminBagLoading,
  selectAdminBagActionLoading,
} from "../../../store/features/admin/adminBagSlice";
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

// Extract creation/update timestamp from date fields or MongoDB ObjectId (_id)
const getBagTimestamp = (bag) => {
  const dateStr = bag?.updatedAt || bag?.createdAt;
  if (dateStr) {
    const t = new Date(dateStr).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const idStr = String(bag?._id || "");
  return /^[0-9a-fA-F]{24}$/.test(idStr)
    ? parseInt(idStr.substring(0, 8), 16) * 1000
    : 0;
};

// Sort cart items latest-first, keeping free gifts at the bottom
const sortBagItemsLatestFirst = (items = []) => {
  if (!Array.isArray(items) || items.length <= 1) return items || [];
  const indexed = items.map((item, idx) => ({ item, idx }));
  const regular = indexed.filter(
    ({ item }) => !(item.isFreeGift || item.price === 0)
  );
  const gifts = indexed.filter(
    ({ item }) => item.isFreeGift || item.price === 0
  );

  regular.sort((a, b) => {
    const tA = getBagTimestamp(a.item);
    const tB = getBagTimestamp(b.item);
    if (tA !== tB) return tB - tA;
    const idA = String(a.item?._id || "");
    const idB = String(b.item?._id || "");
    if (idA && idB && idA !== idB) return idB.localeCompare(idA);
    return b.idx - a.idx;
  });

  return [...regular.map((x) => x.item), ...gifts.map((x) => x.item)];
};

const AdminBags = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read page and search from URL query params
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchQuery = searchParams.get("search") || "";

  // Redux State
  const bags = useSelector(selectAdminBags);
  const pagination = useSelector(selectAdminBagPagination);
  const loading = useSelector(selectAdminBagLoading);
  const actionLoading = useSelector(selectAdminBagActionLoading);

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  // Defensive client-side sort so newest bags always appear first
  const sortedBags = useMemo(() => {
    if (!Array.isArray(bags)) return [];
    return [...bags].sort((a, b) => {
      const diff = getBagTimestamp(b) - getBagTimestamp(a);
      if (diff !== 0) return diff;
      return String(b._id || "").localeCompare(String(a._id || ""));
    });
  }, [bags]);

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
    dispatch(setBagFilter({ search: searchQuery }));
    dispatch(
      getAllBags({
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

  const handleTogglePopover = (e, bag) => {
    e.stopPropagation();

    if (activePopover?.id === bag._id) {
      setActivePopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeightEstimate = Math.min(bag.items.length * 45 + 50, 400);

    const openUpwards = spaceBelow < popoverHeightEstimate;

    setActivePopover({
      id: bag._id,
      items: sortBagItemsLatestFirst(bag.items),
      top: openUpwards ? "auto" : rect.bottom + 8,
      bottom: openUpwards ? window.innerHeight - rect.top + 8 : "auto",
      right: window.innerWidth - rect.right,
      origin: openUpwards ? "origin-bottom-right" : "origin-top-right",
    });
  };

  const handleDelete = async (e, bagId) => {
    e.stopPropagation();
    setActivePopover(null);

    if (
      !window.confirm(
        "Are you sure you want to delete this bag? This cannot be undone."
      )
    )
      return;

    try {
      await dispatch(deleteBag(bagId)).unwrap();
      toast.success("Bag deleted successfully", toastControls);
    } catch (error) {
      toast.error(error || "Failed to delete bag", toastControls);
    }
  };

  const getItemImage = (item) => {
    if (item.image && typeof item.image === "string") return item.image;
    if (item.product?.images?.length > 0) return item.product.images[0].url;
    if (item.product?.image) return item.product.image;
    return "https://placehold.co/100x100?text=No+Img";
  };

  const getBagTotal = (bag) => bag.summary?.total || bag.calculatedTotal || 0;

  const getItemPrice = (item) => {
    if (item.price === 0) return 0;
    return item.price || item.product?.price || 0;
  };

  const getRealItemCount = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const isGift = item.price === 0 || item.isFreeGift;
      if (isGift) return total;
      return total + (item.quantity || 1);
    }, 0);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans relative">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            Active Bags
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Monitor active shopping carts and potential orders (latest first).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-xs">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
              Total Active
            </span>
            <span className="text-2xl font-bold text-zinc-900 leading-none mt-1">
              {pagination.totalBags}
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
            <div className="relative group/clear">
              <button className="px-3 py-2.5 bg-zinc-100 text-zinc-700 group-hover/clear:text-zinc-900 group-hover/clear:bg-zinc-200 border border-zinc-200 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium pointer-events-none">
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
                <th className="p-5">Items Count</th>
                <th className="p-5">Bag Value</th>
                <th className="p-5">Last Updated</th>
                <th className="p-5 text-right pr-6 w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {sortedBags.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Icon
                          icon="solar:bag-smile-linear"
                          className="text-3xl text-zinc-400"
                        />
                      </div>
                      <p className="text-zinc-700 font-semibold">
                        No active bags found
                      </p>
                      <p className="text-xs text-zinc-500">
                        Try adjusting your search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedBags.map((bag) => (
                  <tr
                    key={bag._id}
                    className="group hover:bg-zinc-50/80 transition-colors border-b border-zinc-200 last:border-0 relative"
                  >
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                          {bag.user?.name
                            ? bag.user.name.charAt(0).toUpperCase()
                            : "G"}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {bag.user?.name || "Guest User"}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {bag.user?.email ||
                              `Device: ${bag.deviceId?.slice(0, 8)}...`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:box-minimalistic-bold"
                          className="text-zinc-400"
                        />
                        <span className="text-zinc-800 font-semibold">
                          {getRealItemCount(bag.items)} Products
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200">
                        ₹{getBagTotal(bag).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="p-5 text-zinc-600">
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                          <Icon
                            icon="solar:calendar-linear"
                            className="text-zinc-400"
                          />
                          <span>
                            {formatDateDDMMYYYY(bag.updatedAt || bag.createdAt)}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 pl-5">
                          {new Date(
                            bag.updatedAt || bag.createdAt
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
                              activePopover?.id === bag._id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-zinc-600 border-zinc-200 group-hover/btn:text-zinc-900 group-hover/btn:bg-zinc-100 group-hover/btn:border-zinc-300"
                            }`}
                          >
                            <Icon
                              icon={
                                activePopover?.id === bag._id
                                  ? "solar:eye-bold"
                                  : "solar:eye-linear"
                              }
                              className="text-lg"
                            />
                          </div>

                          <span
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleTogglePopover(e, bag)}
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
                            onClick={(e) => handleDelete(e, bag._id)}
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                            title="Delete Bag"
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

      {/* FIXED FLOATING POPOVER (LIGHT THEME) */}
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
              <Icon icon="solar:bag-check-bold" className="text-indigo-600" />
              Contents (Latest First)
            </h3>
            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
              {getRealItemCount(activePopover.items)} Products
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
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/100x100?text=No+Img";
                    }}
                  />
                  {(item.price === 0 || item.isFreeGift) && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[6px] font-extrabold px-1 py-px rounded-bl-sm z-10 leading-none">
                      GIFT
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
                  <h4
                    className="text-xs font-semibold text-zinc-900 truncate leading-none"
                    title={item.name}
                  >
                    {item.name || item.product?.name || "Product Name"}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 leading-none mt-0.5">
                    <span className="bg-zinc-100 text-zinc-700 font-medium px-1 py-px rounded border border-zinc-200">
                      {item.size?.value}
                    </span>
                    <span>x{item.quantity}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      getItemPrice(item) === 0
                        ? "text-indigo-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {getItemPrice(item) === 0
                      ? "FREE"
                      : `₹${getItemPrice(item).toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBags;
