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

// ==================== SUB-COMPONENTS (Moved Outside) ====================

// Reusable Filter Button with Interaction Fix
const FilterButton = ({ label, count, active, onClick, colorClass, borderClass }) => (
  <div className="relative group h-full">
      <button
          type="button"
          className={`w-full h-full px-3 py-2 text-sm rounded border transition pointer-events-none flex justify-between items-center gap-2 ${
              active ? `${colorClass} ${borderClass}` : "bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:border-zinc-700"
          }`}
      >
          <span className="truncate">{label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${active ? 'bg-black/20' : 'bg-zinc-800 text-zinc-500'}`}>
            {count}
          </span>
      </button>
      {/* Interaction Overlay */}
      <span onClick={onClick} className="absolute inset-0 z-10 cursor-pointer rounded" />
  </div>
);

// ==================== MAIN COMPONENT ====================

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
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      sortBy: filters.sortBy,
      order: filters.order,
    }));
  }, [dispatch, filters, pagination.page]);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    dispatch(setFilters({ 
      status: status === "all" ? null : status,
    }));
    handlePageChange(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ 
      search: searchQuery,
    }));
    handlePageChange(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    dispatch(resetFilters());
    handlePageChange(1);
  };

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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to get coupon status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startsAt);
    const endDate = new Date(coupon.expiresAt);

    if (!coupon.isActive) return 'inactive';
    if (endDate <= now) return 'expired';
    if (startDate > now) return 'upcoming';
    if (coupon.usageLimitType === 'max-total' && coupon.maxTotalUsage) {
      if (coupon.totalUsedCount >= coupon.maxTotalUsage) return 'exhausted';
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

  const stats = {
    total: coupons.length,
    active: groupedCoupons.active.length,
    upcoming: groupedCoupons.upcoming.length,
    exhausted: groupedCoupons.exhausted.length,
    expired: groupedCoupons.expired.length,
    inactive: groupedCoupons.inactive.length,
  };

  const displayGroups = statusFilter === "all" 
    ? Object.entries(groupedCoupons).filter(([_, items]) => items.length > 0)
    : [[statusFilter, groupedCoupons[statusFilter]]].filter(([_, items]) => items.length > 0);

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 pb-24 lg:pb-12 font-sans overflow-x-hidden' id="admin-coupons-page">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 max-w-[1600px] mx-auto border-b border-zinc-900 pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Coupons</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage discounts and promotional codes</p>
        </div>

        {/* Desktop Create Button */}
        <div className="hidden lg:block relative group">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium group-hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all pointer-events-none">
                <Icon icon="material-symbols:add-2-rounded" className="text-xl" />
                <span>Create Coupon</span>
            </div>
            <Link to="/admin/coupons/add" className="absolute inset-0 z-10 cursor-pointer" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {/* --- STATISTICS CARDS (Responsive Grid) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-linear-to-br from-green-950/30 to-green-900/10 border border-green-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-green-400/70 mb-1 font-bold uppercase tracking-wider">Active</p>
                        <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                    </div>
                    <Icon icon="mdi:check-circle" className="text-3xl text-green-400/30" />
                </div>
            </div>
            
            <div className="bg-linear-to-br from-blue-950/30 to-blue-900/10 border border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-400/70 mb-1 font-bold uppercase tracking-wider">Upcoming</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.upcoming}</p>
                    </div>
                    <Icon icon="mdi:clock-outline" className="text-3xl text-blue-400/30" />
                </div>
            </div>

            <div className="bg-linear-to-br from-purple-950/30 to-purple-900/10 border border-purple-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-purple-400/70 mb-1 font-bold uppercase tracking-wider">Exhausted</p>
                        <p className="text-2xl font-bold text-purple-400">{stats.exhausted}</p>
                    </div>
                    <Icon icon="mdi:counter" className="text-3xl text-purple-400/30" />
                </div>
            </div>
            
            <div className="bg-linear-to-br from-orange-950/30 to-orange-900/10 border border-orange-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-orange-400/70 mb-1 font-bold uppercase tracking-wider">Expired</p>
                        <p className="text-2xl font-bold text-orange-400">{stats.expired}</p>
                    </div>
                    <Icon icon="mdi:alert-circle" className="text-3xl text-orange-400/30" />
                </div>
            </div>
        </div>

        {/* --- FILTERS & SEARCH --- */}
        <div className="admin-coupons-options mb-8">
            {/* Toggle Filters Button */}
            <div className="relative group">
                <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl mb-3 group-hover:bg-zinc-800 transition pointer-events-none">
                    <span className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                        <Icon icon="mdi:filter-variant" className="text-lg" />
                        Filters & Search
                        {(filters.search || filters.status) && (
                            <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs rounded-full">
                                Active
                            </span>
                        )}
                    </span>
                    <Icon 
                        icon="iconamoon:arrow-down-2-duotone" 
                        className={`text-xl transition-transform text-zinc-500 ${showFilters ? 'rotate-180' : ''}`}
                    />
                </div>
                <span onClick={() => setShowFilters(!showFilters)} className="absolute inset-0 z-10 cursor-pointer rounded-xl" />
            </div>

            {/* Filters Content */}
            {showFilters && (
                <div className="filters-content bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="lg:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Search Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="e.g., SAVE50"
                                    className="flex-1 h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                                />
                                <div className="relative group">
                                    <button type="submit" className="px-4 h-10 bg-indigo-600 text-white rounded-lg group-hover:bg-indigo-500 transition pointer-events-none">
                                        <Icon icon="mdi:magnify" className="text-xl" />
                                    </button>
                                    <span onClick={handleSearch} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />
                                </div>
                            </div>
                        </form>

                        {/* Status Filter Grid */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Filter by status</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                <FilterButton 
                                    label="All" count={pagination.total} 
                                    active={statusFilter === "all"} onClick={() => handleStatusChange("all")} 
                                    colorClass="bg-indigo-600/20 text-indigo-400" borderClass="border-indigo-500/30"
                                />
                                <FilterButton 
                                    label="Active" count={stats.active} 
                                    active={statusFilter === "active"} onClick={() => handleStatusChange("active")} 
                                    colorClass="bg-green-600/20 text-green-400" borderClass="border-green-500/30"
                                />
                                <FilterButton 
                                    label="Upcoming" count={stats.upcoming} 
                                    active={statusFilter === "upcoming"} onClick={() => handleStatusChange("upcoming")} 
                                    colorClass="bg-blue-600/20 text-blue-400" borderClass="border-blue-500/30"
                                />
                                <FilterButton 
                                    label="Exhausted" count={stats.exhausted} 
                                    active={statusFilter === "exhausted"} onClick={() => handleStatusChange("exhausted")} 
                                    colorClass="bg-purple-600/20 text-purple-400" borderClass="border-purple-500/30"
                                />
                                <FilterButton 
                                    label="Expired" count={stats.expired} 
                                    active={statusFilter === "expired"} onClick={() => handleStatusChange("expired")} 
                                    colorClass="bg-orange-600/20 text-orange-400" borderClass="border-orange-500/30"
                                />
                                <FilterButton 
                                    label="Inactive" count={stats.inactive} 
                                    active={statusFilter === "inactive"} onClick={() => handleStatusChange("inactive")} 
                                    colorClass="bg-zinc-700/20 text-zinc-400" borderClass="border-zinc-600/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(filters.status || filters.search) && (
                        <div className="mt-4 border-t border-zinc-800 pt-4 flex justify-end">
                            <div className="relative group">
                                <button className="px-4 py-2 bg-zinc-800 text-sm text-zinc-300 rounded-lg group-hover:bg-zinc-700 transition inline-flex items-center gap-2 pointer-events-none">
                                    <Icon icon="mdi:filter-off" />
                                    Clear all filters
                                </button>
                                <span onClick={handleClearFilters} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* --- CONTENT AREA --- */}
        {loading ? (
            <div className="flex justify-center items-center py-32 bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed">
                <Loader />
            </div>
        ) : (
            <>
                {displayGroups.length > 0 ? (
                    <div className="space-y-8">
                        {displayGroups.map(([status, items]) => (
                            <div key={`admin-coupons-${status}-group`} className="relative">
                                
                                {/* Status Header (Sticky) */}
                                <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-xl py-3 border-b border-zinc-800 mb-4 flex items-center justify-between">
                                    <h2 className="font-bold text-sm uppercase flex items-center gap-2 tracking-wider">
                                        {status === "active" && <Icon icon="mdi:check-circle" className="text-lg text-green-400" />}
                                        {status === "upcoming" && <Icon icon="mdi:clock-outline" className="text-lg text-blue-400" />}
                                        {status === "exhausted" && <Icon icon="mdi:counter" className="text-lg text-purple-400" />}
                                        {status === "expired" && <Icon icon="mdi:alert-circle" className="text-lg text-orange-400" />}
                                        {status === "inactive" && <Icon icon="mdi:cancel" className="text-lg text-zinc-500" />}
                                        
                                        <span className={
                                            status === "active" ? "text-green-400" :
                                            status === "upcoming" ? "text-blue-400" :
                                            status === "exhausted" ? "text-purple-400" :
                                            status === "expired" ? "text-orange-400" : "text-zinc-500"
                                        }>
                                            {status} Coupons
                                        </span>
                                    </h2>
                                    <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                                        {items.length}
                                    </span>
                                </div>

                                {/* Responsive Grid for Coupons */}
                                <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {items.map((coupon) => (
                                        <li key={`admin-coupon-item-${coupon._id}`} className="h-full">
                                            {/* Wrapper ensures AdminCouponItem fills the grid cell */}
                                            <div className="h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                                                <AdminCouponItem coupon={coupon} status={status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-8 gap-4">
                                <div className="text-sm text-zinc-400">
                                    Page <span className="text-white font-bold">{pagination.page}</span> of {pagination.totalPages}
                                    <span className="text-zinc-600 ml-2 border-l border-zinc-800 pl-2">
                                        {pagination.total} results
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <button
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm group-hover:bg-zinc-700 transition disabled:opacity-50 flex items-center gap-1 pointer-events-none"
                                        >
                                            <Icon icon="mdi:chevron-left" className="text-lg" />
                                            Previous
                                        </button>
                                        {pagination.page !== 1 && <span onClick={() => handlePageChange(pagination.page - 1)} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />}
                                    </div>

                                    <div className="relative group">
                                        <button
                                            disabled={pagination.page === pagination.totalPages}
                                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm group-hover:bg-zinc-700 transition disabled:opacity-50 flex items-center gap-1 pointer-events-none"
                                        >
                                            Next
                                            <Icon icon="mdi:chevron-right" className="text-lg" />
                                        </button>
                                        {pagination.page !== pagination.totalPages && <span onClick={() => handlePageChange(pagination.page + 1)} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <Icon icon="mdi:ticket-percent-outline" className="text-5xl text-zinc-600" />
                        </div>
                        <p className="text-xl font-semibold text-zinc-300 mb-2">
                            {filters.search || filters.status ? "No coupons match your filters" : "No coupons found"}
                        </p>
                        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
                            {filters.search || filters.status
                                ? "Try adjusting your search terms or status filters to find what you're looking for."
                                : "Create your first coupon code to start running promotions."}
                        </p>
                        
                        {(filters.search || filters.status) ? (
                            <div className="relative group">
                                <button className="px-5 py-2.5 bg-zinc-800 text-sm rounded-lg group-hover:bg-zinc-700 transition inline-flex items-center gap-2 pointer-events-none">
                                    <Icon icon="mdi:filter-off" />
                                    Clear filters
                                </button>
                                <span onClick={handleClearFilters} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-lg group-hover:bg-indigo-500 transition inline-flex items-center gap-2 pointer-events-none">
                                    <Icon icon="material-symbols:add-2-rounded" className="text-lg" />
                                    Create Coupon
                                </div>
                                <Link to="/admin/coupons/add" className="absolute inset-0 z-10 cursor-pointer rounded-lg" />
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <div className="relative group ">
            <div className="w-14 h-14 flex justify-center items-center bg-indigo-600 text-2xl text-white rounded-2xl pointer-events-none transition-transform active:scale-95 shadow-xl shadow-indigo-900/30">
                <Icon icon="material-symbols:add-2-rounded" />
            </div>
            <Link to="/admin/coupons/add" className="absolute inset-0 z-10 cursor-pointer rounded-2xl" aria-label="Add New Coupon" />
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;