import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import {
  getAllWishlists,
  deleteWishlist,
  setWishlistFilter,
  selectAdminWishlists,
  selectAdminWishlistPagination,
  selectAdminWishlistFilters,
  selectAdminWishlistLoading,
  selectAdminWishlistActionLoading
} from "../../../store/features/admin/adminWishlistSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const AdminWishlists = () => {
  const dispatch = useDispatch();

  // Redux State
  const wishlists = useSelector(selectAdminWishlists);
  const pagination = useSelector(selectAdminWishlistPagination);
  const filters = useSelector(selectAdminWishlistFilters);
  const loading = useSelector(selectAdminWishlistLoading);
  const actionLoading = useSelector(selectAdminWishlistActionLoading);

  // Local State
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  // --- EFFECT: Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setWishlistFilter({ search: searchTerm }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch]);

  // --- EFFECT: Fetch Data ---
  useEffect(() => {
    dispatch(getAllWishlists({
      page: pagination.currentPage,
      limit: 10,
      search: filters.search
    }));
  }, [dispatch, pagination.currentPage, filters.search]);

  // --- EFFECT: Close Popover ---
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

  // --- HANDLERS ---
  const handlePageChange = (newPage) => {
    dispatch(getAllWishlists({
      page: newPage,
      limit: 10,
      search: filters.search
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    dispatch(setWishlistFilter({ search: "" }));
  };

  const handleTogglePopover = (e, list) => {
    e.stopPropagation();

    if (activePopover?.id === list._id) {
      setActivePopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Estimate height based on items
    const popoverHeightEstimate = Math.min(list.items.length * 45 + 50, 400);
    const openUpwards = spaceBelow < popoverHeightEstimate;

    setActivePopover({
      id: list._id,
      items: list.items,
      top: openUpwards ? 'auto' : rect.bottom + 8,
      bottom: openUpwards ? (window.innerHeight - rect.top) + 8 : 'auto',
      right: window.innerWidth - rect.right,
      origin: openUpwards ? "origin-bottom-right" : "origin-top-right"
    });
  };

  const handleDelete = async (e, listId) => {
    e.stopPropagation();
    setActivePopover(null);

    if (!window.confirm("Are you sure you want to delete this wishlist?")) return;

    try {
      await dispatch(deleteWishlist(listId)).unwrap();
      toast.success("Wishlist deleted successfully", toastControls);
    } catch (error) {
      toast.error(error || "Failed to delete wishlist", toastControls);
    }
  };

  // --- HELPERS ---
  const getItemImage = (item) => {
    if (item.product?.images?.length > 0) return item.product.images[0].url;
    if (item.product?.image) return item.product.image;
    return "https://placehold.co/100x100?text=No+Img";
  };

  const getItemName = (item) => item.product?.name || "Product Name";
  const getItemCategory = (item) => item.product?.category || "General";

  return (
    <div className="p-4 md:p-8 min-h-screen bg-zinc-950 text-zinc-100 font-sans relative">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Wishlists
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            View and manage customer saved items.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3 shadow-sm">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Total Wishlists</span>
            <span className="text-2xl font-bold text-white leading-none mt-1">{pagination.totalWishlists}</span>
          </div>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 mb-6">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-lg group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="mynaui:search" className="text-zinc-500 text-lg group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm placeholder-zinc-500 text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          {searchTerm && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-transparent rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
              title="Clear Search"
            >
              <Icon icon="solar:restart-bold" className="text-lg" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-zinc-900/60 z-10 flex justify-center items-start pt-32 backdrop-blur-[2px]">
            <Loader />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-5 pl-6">Customer</th>
                <th className="p-5">Saved Items</th>
                {/* Removed Total Value Column Header */}
                <th className="p-5">Last Updated</th>
                <th className="p-5 text-right pr-6 w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {wishlists.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <Icon icon="solar:heart-broken-linear" className="text-3xl opacity-50" />
                      </div>
                      <p className="text-zinc-400 font-medium">No wishlists found</p>
                      <p className="text-xs">Try adjusting your search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                wishlists.map((list) => (
                  <tr key={list._id} className="group hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50 last:border-0">
                    {/* Customer */}
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0 shadow-inner">
                          {list.user?.name ? list.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200">{list.user?.name || "Unknown User"}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{list.user?.email || "No Email"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Count */}
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:heart-angle-bold" className="text-zinc-600" />
                        <span className="text-zinc-300 font-medium">{list.items?.length || 0} Saved</span>
                      </div>
                    </td>

                    {/* Removed Total Value Data Column */}

                    {/* Date */}
                    <td className="p-5 text-zinc-400">
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5">
                          <Icon icon="solar:calendar-linear" className="text-zinc-600" />
                          <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 pl-5">{new Date(list.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={(e) => handleTogglePopover(e, list)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border ${activePopover?.id === list._id
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700 hover:border-zinc-600"
                            }`}
                          title="View Items"
                        >
                          <Icon icon={activePopover?.id === list._id ? "solar:eye-bold" : "solar:eye-linear"} className="text-lg" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(e, list._id)}
                          disabled={actionLoading}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-red-400 hover:bg-red-900/10 hover:border-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Wishlist"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                        </button>
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
          <div className="border-t border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
            <span className="text-xs text-zinc-500">
              Page <span className="text-white font-semibold">{pagination.currentPage}</span> of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <Icon icon="solar:alt-arrow-left-linear" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next
                <Icon icon="solar:alt-arrow-right-linear" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ULTRA COMPACT POPOVER */}
      {activePopover && (
        <div
          ref={popoverRef}
          className={`fixed z-100 w-72 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[50vh] ${activePopover.origin}`}
          style={{
            top: activePopover.top,
            bottom: activePopover.bottom,
            right: activePopover.right
          }}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/50 shrink-0">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Icon icon="solar:heart-bold" className="text-indigo-500" />
              Contents
            </h3>
            <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-px rounded border border-zinc-800">
              {activePopover.items.length} Products
            </span>
          </div>

          <div className="overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {activePopover.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors group relative">
                {/* Compact Image */}
                <div className="w-9 h-9 bg-zinc-900 rounded-md overflow-hidden shrink-0 border border-zinc-800 relative">
                  <img
                    src={getItemImage(item)}
                    alt={getItemName(item)}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://placehold.co/100x100?text=No+Img" }}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
                  <h4 className="text-xs font-medium text-zinc-200 truncate leading-none" title={getItemName(item)}>
                    {getItemName(item)}
                  </h4>
                  <div className="text-[10px] text-zinc-500 leading-none">
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