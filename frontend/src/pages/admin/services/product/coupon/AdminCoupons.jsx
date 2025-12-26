import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  getAllCoupons,
  selectAllCoupons,
  selectLoading,
  selectPagination,
  selectFilters,
  setFilters,
  resetFilters,
} from "../../../../../store/features/admin/adminCouponSlice";
import AdminCouponItem from "../../../../../components/admin/coupon/AdminCouponItem";
import Loader from "../../../../../utils/loader/Loader";

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const coupons = useSelector(selectAllCoupons);
  const loading = useSelector(selectLoading);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(getAllCoupons({ 
      page: pagination.page, // ✅ Use pagination page from state
      limit: pagination.limit,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      sortBy: filters.sortBy,
      order: filters.order,
    }));
  }, [dispatch, filters, pagination.page]); // ✅ Add pagination.page dependency

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    dispatch(setFilters({ 
      status: status === "all" ? null : status,
    }));
    // ✅ Reset to page 1 when filter changes
    handlePageChange(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ 
      search: searchQuery,
    }));
    // ✅ Reset to page 1 when searching
    handlePageChange(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    dispatch(resetFilters());
    // ✅ Reset to page 1 when clearing filters
    handlePageChange(1);
  };

  // ✅ NEW: Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    dispatch(getAllCoupons({ 
      page: newPage, 
      limit: pagination.limit,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      sortBy: filters.sortBy,
      order: filters.order,
    }));

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to get coupon status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startsAt);
    const endDate = new Date(coupon.expiresAt);

    if (!coupon.isActive) {
      return 'inactive';
    }

    if (endDate <= now) {
      return 'expired';
    }

    if (startDate > now) {
      return 'upcoming';
    }

    if (coupon.usageLimitType === 'max-total' && coupon.maxTotalUsage) {
      if (coupon.totalUsedCount >= coupon.maxTotalUsage) {
        return 'exhausted';
      }
    }

    return 'active';
  };

  // Group coupons by status
  const groupedCoupons = {
    active: [],
    upcoming: [],
    exhausted: [],
    expired: [],
    inactive: [],
  };

  coupons.forEach((coupon) => {
    const status = getCouponStatus(coupon);
    groupedCoupons[status].push(coupon);
  });

  // Calculate statistics
  const stats = {
    total: coupons.length,
    active: groupedCoupons.active.length,
    upcoming: groupedCoupons.upcoming.length,
    exhausted: groupedCoupons.exhausted.length,
    expired: groupedCoupons.expired.length,
    inactive: groupedCoupons.inactive.length,
  };

  // Filter groups based on status filter
  const displayGroups = statusFilter === "all" 
    ? Object.entries(groupedCoupons).filter(([_, items]) => items.length > 0)
    : [[statusFilter, groupedCoupons[statusFilter]]].filter(([_, items]) => items.length > 0);

  return (
    <div className='px-3 py-10 pb-24' id="admin-coupons-page"> {/* ✅ Added pb-24 for floating button */}
      {/* Header */}
      <div className="admin-coupons-header mb-5">
        <h1 className="text-2xl font-semibold mb-2">Coupons Management</h1>
        <p className="text-sm text-zinc-400">
          {pagination.total} total coupon{pagination.total !== 1 ? 's' : ''} • {/* ✅ Use pagination.total */}
          <span className="text-green-400 ml-1">{stats.active} active</span> • 
          <span className="text-blue-400 ml-1">{stats.upcoming} upcoming</span>
          {stats.exhausted > 0 && (
            <span className="text-purple-400 ml-1"> • {stats.exhausted} exhausted</span>
          )}
        </p>
      </div>

      {/* ✅ UPDATED: Statistics Cards - Always show 4 cards in 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-linear-to-br from-green-950/30 to-green-900/10 border border-green-800/30 rounded p-3"> {/* ✅ Fixed typo: bg-linear-to-br → bg-linear-to-br */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-400/70 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <Icon icon="mdi:check-circle" className="text-3xl text-green-400/30" />
          </div>
        </div>
        
        <div className="bg-linear-to-br from-blue-950/30 to-blue-900/10 border border-blue-800/30 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400/70 mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-blue-400">{stats.upcoming}</p>
            </div>
            <Icon icon="mdi:clock-outline" className="text-3xl text-blue-400/30" />
          </div>
        </div>

        {/* Always show exhausted card (not conditional) */}
        <div className="bg-linear-to-br from-purple-950/30 to-purple-900/10 border border-purple-800/30 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400/70 mb-1">Exhausted</p>
              <p className="text-2xl font-bold text-purple-400">{stats.exhausted}</p>
            </div>
            <Icon icon="mdi:counter" className="text-3xl text-purple-400/30" />
          </div>
        </div>
        
        <div className="bg-linear-to-br from-orange-950/30 to-orange-900/10 border border-orange-800/30 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-400/70 mb-1">Expired</p>
              <p className="text-2xl font-bold text-orange-400">{stats.expired}</p>
            </div>
            <Icon icon="mdi:alert-circle" className="text-3xl text-orange-400/30" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="admin-coupons-options mb-5">
        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded mb-3 hover:bg-zinc-800 transition"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Icon icon="mdi:filter-outline" className="text-lg" />
            Filters & Search
            {(filters.search || filters.status) && (
              <span className="px-2 py-0.5 bg-indigo-600 text-xs rounded-full">
                Active
              </span>
            )}
          </span>
          <Icon 
            icon="iconamoon:arrow-down-2-duotone" 
            className={`text-xl transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Filters Content */}
        {showFilters && (
          <div className="filters-content bg-zinc-900 border border-zinc-800 rounded p-3 mb-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-3">
              <label className="block text-xs text-zinc-400 mb-1">Search by code or description</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., SAVE50"
                  className="flex-1 h-9 px-3 bg-zinc-950 border border-zinc-800 rounded text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 h-9 bg-indigo-600 text-sm rounded hover:bg-indigo-500 transition"
                >
                  <Icon icon="mdi:magnify" className="text-lg" />
                </button>
              </div>
            </form>

            {/* Status Filter */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Filter by status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange("all")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "all"
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  All ({pagination.total}) {/* ✅ Use pagination.total */}
                </button>
                <button
                  onClick={() => handleStatusChange("active")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "active"
                      ? "bg-green-600 border-green-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Active ({stats.active})
                </button>
                <button
                  onClick={() => handleStatusChange("upcoming")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "upcoming"
                      ? "bg-blue-600 border-blue-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Upcoming ({stats.upcoming})
                </button>
                <button
                  onClick={() => handleStatusChange("exhausted")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "exhausted"
                      ? "bg-purple-600 border-purple-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Exhausted ({stats.exhausted})
                </button>
                <button
                  onClick={() => handleStatusChange("expired")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "expired"
                      ? "bg-orange-600 border-orange-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Expired ({stats.expired})
                </button>
                <button
                  onClick={() => handleStatusChange("inactive")}
                  className={`px-3 py-2 text-sm rounded border transition ${
                    statusFilter === "inactive"
                      ? "bg-zinc-600 border-zinc-600"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Inactive ({stats.inactive})
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.status || filters.search) && (
              <button
                onClick={handleClearFilters}
                className="w-full mt-3 px-3 py-2 bg-zinc-800 text-sm rounded hover:bg-zinc-700 transition flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:filter-off" />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      ) : (
        <>
          {/* Coupons List */}
          {displayGroups.length > 0 ? (
            <>
              {displayGroups.map(([status, items]) => (
                <div
                  key={`admin-coupons-${status}-group`}
                  className="admin-list-coupon-group mt-5 pb-5"
                >
                  <div className="flex items-center justify-between sticky top-0 backdrop-blur-sm bg-black/50 py-3 mb-3 z-10"> {/* ✅ Added bg-black/50 for better visibility */}
                    <h2 className="font-semibold text-sm uppercase flex items-center gap-2">
                      {status === "active" && (
                        <>
                          <Icon icon="mdi:check-circle" className="text-green-400" />
                          <span className="text-green-400">Active Coupons</span>
                        </>
                      )}
                      {status === "upcoming" && (
                        <>
                          <Icon icon="mdi:clock-outline" className="text-blue-400" />
                          <span className="text-blue-400">Upcoming Coupons</span>
                        </>
                      )}
                      {status === "exhausted" && (
                        <>
                          <Icon icon="mdi:counter" className="text-purple-400" />
                          <span className="text-purple-400">Exhausted Coupons</span>
                        </>
                      )}
                      {status === "expired" && (
                        <>
                          <Icon icon="mdi:alert-circle" className="text-orange-400" />
                          <span className="text-orange-400">Expired Coupons</span>
                        </>
                      )}
                      {status === "inactive" && (
                        <>
                          <Icon icon="mdi:cancel" className="text-zinc-500" />
                          <span className="text-zinc-500">Inactive Coupons</span>
                        </>
                      )}
                    </h2>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                      {items.length} {items.length === 1 ? 'coupon' : 'coupons'}
                    </span>
                  </div>
                  <ul className="admin-coupons-list-container flex flex-col gap-3">
                    {items.map((coupon) => (
                      <li key={`admin-coupon-item-${coupon._id}`}>
                        <AdminCouponItem coupon={coupon} status={status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* ✅ NEW: Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 mb-5">
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded">
                    <div className="text-sm text-zinc-400">
                      Page {pagination.page} of {pagination.totalPages}
                      <span className="text-zinc-600 ml-2">
                        ({pagination.total} total)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Icon icon="mdi:chevron-left" className="text-lg" />
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        Next
                        <Icon icon="mdi:chevron-right" className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Icon icon="mdi:ticket-percent-outline" className="text-6xl text-zinc-700 mx-auto mb-3" />
              <p className="text-xl text-zinc-400 mb-2">
                {filters.search || filters.status
                  ? "No coupons match your filters"
                  : "No coupons found"}
              </p>
              <p className="text-sm text-zinc-500 mb-4">
                {filters.search || filters.status
                  ? "Try adjusting your search or filters"
                  : "Create your first coupon to get started"}
              </p>
              {(filters.search || filters.status) ? (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-zinc-800 text-sm rounded hover:bg-zinc-700 transition inline-flex items-center gap-2"
                >
                  <Icon icon="mdi:filter-off" />
                  Clear filters
                </button>
              ) : (
                <Link
                  to="/admin/coupons/add"
                  className="px-4 py-2 bg-indigo-600 text-sm rounded hover:bg-indigo-500 transition inline-flex items-center gap-2"
                >
                  <Icon icon="material-symbols:add-2-rounded" />
                  Create Coupon
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Coupon Button - Floating */}
      <div className="fixed bottom-20 right-4 z-20">
        <Link
          to="/admin/coupons/add"
          className="w-12 h-12 flex justify-center items-center bg-indigo-600 text-2xl rounded-full shadow-lg hover:bg-indigo-500 hover:scale-110 transition-all duration-200"
          title="Add New Coupon"
        >
          <Icon icon="material-symbols:add-2-rounded" />
        </Link>
      </div>
    </div>
  );
};

export default AdminCoupons;