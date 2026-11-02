import { Link, useSearchParams } from "react-router-dom";
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

const FilterButton = ({
  label,
  count,
  active,
  onClick,
  colorClass,
  borderClass,
}) => (
  <div className="relative group h-full">
    <button
      type="button"
      className={`w-full h-full px-3 py-2 text-sm rounded-lg border transition pointer-events-none flex justify-between items-center gap-2 ${
        active
          ? `${colorClass} ${borderClass} font-semibold`
          : "bg-white border-zinc-200 text-zinc-600 group-hover:border-zinc-300 group-hover:bg-zinc-50"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
          active ? "bg-white/70 font-bold" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {count}
      </span>
    </button>
    <span
      onClick={onClick}
      className="absolute inset-0 z-10 cursor-pointer rounded-lg"
    />
  </div>
);

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read page, status, and search from URL query params
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const statusFilter = searchParams.get("status") || "all";
  const activeSearch = searchParams.get("search") || "";

  const coupons = useSelector(selectAllCoupons);
  const loading = useSelector(selectLoading);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);

  const [searchQuery, setSearchQuery] = useState(activeSearch);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchQuery(activeSearch);
  }, [activeSearch]);

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
    dispatch(
      setFilters({
        status: statusFilter === "all" ? null : statusFilter,
        search: activeSearch,
      })
    );
    dispatch(
      getAllCoupons({
        page: currentPage,
        limit: pagination.limit || 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(activeSearch && { search: activeSearch }),
        sortBy: filters.sortBy,
        order: filters.order,
      })
    );
  }, [
    dispatch,
    currentPage,
    statusFilter,
    activeSearch,
    pagination.limit,
    filters.sortBy,
    filters.order,
  ]);

  const handleStatusChange = (status) => {
    updateUrlParams({ status, page: 1 });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateUrlParams({ search: searchQuery, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    dispatch(resetFilters());
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    updateUrlParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startsAt);
    const endDate = new Date(coupon.expiresAt);

    if (!coupon.isActive) return "inactive";
    if (endDate <= now) return "expired";
    if (startDate > now) return "upcoming";
    if (coupon.usageLimitType === "max-total" && coupon.maxTotalUsage) {
      if (coupon.totalUsedCount >= coupon.maxTotalUsage) return "exhausted";
    }
    return "active";
  };

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

  const displayGroups =
    statusFilter === "all"
      ? Object.entries(groupedCoupons).filter(([_, items]) => items.length > 0)
      : [[statusFilter, groupedCoupons[statusFilter] || []]].filter(
          ([_, items]) => items.length > 0
        );

  return (
    <div
      className="min-h-screen bg-[#f4f4f4] text-zinc-900 p-4 md:p-8 pb-24 lg:pb-12 font-sans overflow-x-hidden"
      id="admin-coupons-page"
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 max-w-[1600px] mx-auto border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Coupons
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage discounts and promotional codes
          </p>
        </div>

        <div className="hidden lg:block relative group">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium group-hover:bg-indigo-700 shadow-sm transition-all pointer-events-none">
            <Icon icon="material-symbols:add-2-rounded" className="text-xl" />
            <span>Create Coupon</span>
          </div>
          <Link
            to="/admin/coupons/add"
            className="absolute inset-0 z-10 cursor-pointer"
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {/* --- STATISTICS CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 mb-1 font-bold uppercase tracking-wider">
                  Active
                </p>
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.active}
                </p>
              </div>
              <Icon
                icon="mdi:check-circle"
                className="text-3xl text-emerald-500/40"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 mb-1 font-bold uppercase tracking-wider">
                  Upcoming
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.upcoming}
                </p>
              </div>
              <Icon
                icon="mdi:clock-outline"
                className="text-3xl text-blue-500/40"
              />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 mb-1 font-bold uppercase tracking-wider">
                  Exhausted
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.exhausted}
                </p>
              </div>
              <Icon
                icon="mdi:counter"
                className="text-3xl text-purple-500/40"
              />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700 mb-1 font-bold uppercase tracking-wider">
                  Expired
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {stats.expired}
                </p>
              </div>
              <Icon
                icon="mdi:alert-circle"
                className="text-3xl text-orange-500/40"
              />
            </div>
          </div>
        </div>

        {/* --- FILTERS & SEARCH --- */}
        <div className="admin-coupons-options mb-8">
          <div className="relative group">
            <div className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl mb-3 shadow-sm group-hover:bg-zinc-50 transition pointer-events-none">
              <span className="text-sm font-medium flex items-center gap-2 text-zinc-800">
                <Icon icon="mdi:filter-variant" className="text-lg text-zinc-600" />
                Filters & Search
                {(activeSearch || statusFilter !== "all") && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs rounded-full font-semibold">
                    Active
                  </span>
                )}
              </span>
              <Icon
                icon="iconamoon:arrow-down-2-duotone"
                className={`text-xl transition-transform text-zinc-500 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </div>
            <span
              onClick={() => setShowFilters(!showFilters)}
              className="absolute inset-0 z-10 cursor-pointer rounded-xl"
            />
          </div>

          {showFilters && (
            <div className="filters-content bg-white border border-zinc-200 rounded-xl p-4 md:p-6 shadow-sm animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleSearch} className="lg:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                    Search Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., SAVE50"
                      className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                    />
                    <div className="relative group">
                      <button
                        type="submit"
                        className="px-4 h-10 bg-indigo-600 text-white rounded-lg group-hover:bg-indigo-500 transition pointer-events-none"
                      >
                        <Icon icon="mdi:magnify" className="text-xl" />
                      </button>
                      <span
                        onClick={handleSearch}
                        className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                      />
                    </div>
                  </div>
                </form>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                    Filter by status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    <FilterButton
                      label="All"
                      count={pagination.total}
                      active={statusFilter === "all"}
                      onClick={() => handleStatusChange("all")}
                      colorClass="bg-indigo-50 text-indigo-700"
                      borderClass="border-indigo-300"
                    />
                    <FilterButton
                      label="Active"
                      count={stats.active}
                      active={statusFilter === "active"}
                      onClick={() => handleStatusChange("active")}
                      colorClass="bg-emerald-50 text-emerald-700"
                      borderClass="border-emerald-300"
                    />
                    <FilterButton
                      label="Upcoming"
                      count={stats.upcoming}
                      active={statusFilter === "upcoming"}
                      onClick={() => handleStatusChange("upcoming")}
                      colorClass="bg-blue-50 text-blue-700"
                      borderClass="border-blue-300"
                    />
                    <FilterButton
                      label="Exhausted"
                      count={stats.exhausted}
                      active={statusFilter === "exhausted"}
                      onClick={() => handleStatusChange("exhausted")}
                      colorClass="bg-purple-50 text-purple-700"
                      borderClass="border-purple-300"
                    />
                    <FilterButton
                      label="Expired"
                      count={stats.expired}
                      active={statusFilter === "expired"}
                      onClick={() => handleStatusChange("expired")}
                      colorClass="bg-orange-50 text-orange-700"
                      borderClass="border-orange-300"
                    />
                    <FilterButton
                      label="Inactive"
                      count={stats.inactive}
                      active={statusFilter === "inactive"}
                      onClick={() => handleStatusChange("inactive")}
                      colorClass="bg-zinc-100 text-zinc-700"
                      borderClass="border-zinc-300"
                    />
                  </div>
                </div>
              </div>

              {(statusFilter !== "all" || activeSearch) && (
                <div className="mt-4 border-t border-zinc-200 pt-4 flex justify-end">
                  <div className="relative group">
                    <button className="px-4 py-2 bg-zinc-100 border border-zinc-200 text-sm text-zinc-700 rounded-lg group-hover:bg-zinc-200 transition inline-flex items-center gap-2 pointer-events-none">
                      <Icon icon="mdi:filter-off" />
                      Clear all filters
                    </button>
                    <span
                      onClick={handleClearFilters}
                      className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- CONTENT AREA --- */}
        {loading ? (
          <div className="flex justify-center items-center py-32 bg-white rounded-3xl border border-zinc-200 border-dashed shadow-sm">
            <Loader />
          </div>
        ) : (
          <>
            {displayGroups.length > 0 ? (
              <div className="space-y-8">
                {displayGroups.map(([status, items]) => (
                  <div
                    key={`admin-coupons-${status}-group`}
                    className="relative"
                  >
                    <div className="sticky top-0 z-20 bg-[#f4f4f4]/95 backdrop-blur-xl py-3 border-b border-zinc-200 mb-4 flex items-center justify-between">
                      <h2 className="font-bold text-sm uppercase flex items-center gap-2 tracking-wider">
                        {status === "active" && (
                          <Icon
                            icon="mdi:check-circle"
                            className="text-lg text-emerald-600"
                          />
                        )}
                        {status === "upcoming" && (
                          <Icon
                            icon="mdi:clock-outline"
                            className="text-lg text-blue-600"
                          />
                        )}
                        {status === "exhausted" && (
                          <Icon
                            icon="mdi:counter"
                            className="text-lg text-purple-600"
                          />
                        )}
                        {status === "expired" && (
                          <Icon
                            icon="mdi:alert-circle"
                            className="text-lg text-orange-600"
                          />
                        )}
                        {status === "inactive" && (
                          <Icon
                            icon="mdi:cancel"
                            className="text-lg text-zinc-500"
                          />
                        )}

                        <span
                          className={
                            status === "active"
                              ? "text-emerald-700"
                              : status === "upcoming"
                              ? "text-blue-700"
                              : status === "exhausted"
                              ? "text-purple-700"
                              : status === "expired"
                              ? "text-orange-700"
                              : "text-zinc-600"
                          }
                        >
                          {status} Coupons
                        </span>
                      </h2>
                      <span className="text-xs text-zinc-600 bg-white px-2.5 py-1 rounded-md border border-zinc-200 font-semibold shadow-2xs">
                        {items.length}
                      </span>
                    </div>

                    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((coupon) => (
                        <li
                          key={`admin-coupon-item-${coupon._id}`}
                          className="h-full"
                        >
                          <div className="h-full bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 shadow-sm transition-colors">
                            <AdminCouponItem
                              coupon={coupon}
                              status={status}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border border-zinc-200 rounded-xl mt-8 gap-4 shadow-sm">
                    <div className="text-sm text-zinc-600">
                      Page{" "}
                      <span className="text-zinc-900 font-bold">
                        {currentPage}
                      </span>{" "}
                      of {pagination.totalPages}
                      <span className="text-zinc-500 ml-2 border-l border-zinc-200 pl-2">
                        {pagination.total} results
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <button
                          disabled={currentPage <= 1}
                          className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm group-hover:bg-zinc-50 transition disabled:opacity-50 flex items-center gap-1 pointer-events-none"
                        >
                          <Icon icon="mdi:chevron-left" className="text-lg" />
                          Previous
                        </button>
                        {currentPage > 1 && (
                          <span
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                          />
                        )}
                      </div>

                      <div className="relative group">
                        <button
                          disabled={currentPage >= pagination.totalPages}
                          className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm group-hover:bg-zinc-50 transition disabled:opacity-50 flex items-center gap-1 pointer-events-none"
                        >
                          Next
                          <Icon icon="mdi:chevron-right" className="text-lg" />
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
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-zinc-200 border-dashed shadow-sm">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <Icon
                    icon="mdi:ticket-percent-outline"
                    className="text-5xl text-zinc-400"
                  />
                </div>
                <p className="text-xl font-semibold text-zinc-800 mb-2">
                  {activeSearch || statusFilter !== "all"
                    ? "No coupons match your filters"
                    : "No coupons found"}
                </p>
                <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
                  {activeSearch || statusFilter !== "all"
                    ? "Try adjusting your search terms or status filters to find what you're looking for."
                    : "Create your first coupon code to start running promotions."}
                </p>

                {activeSearch || statusFilter !== "all" ? (
                  <div className="relative group">
                    <button className="px-5 py-2.5 bg-zinc-100 border border-zinc-200 text-zinc-700 text-sm rounded-lg group-hover:bg-zinc-200 transition inline-flex items-center gap-2 pointer-events-none">
                      <Icon icon="mdi:filter-off" />
                      Clear filters
                    </button>
                    <span
                      onClick={handleClearFilters}
                      className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-lg group-hover:bg-indigo-500 transition inline-flex items-center gap-2 pointer-events-none">
                      <Icon
                        icon="material-symbols:add-2-rounded"
                        className="text-lg"
                      />
                      Create Coupon
                    </div>
                    <Link
                      to="/admin/coupons/add"
                      className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <div className="relative group">
          <div className="w-14 h-14 flex justify-center items-center bg-indigo-600 text-2xl text-white rounded-2xl pointer-events-none transition-transform active:scale-95 shadow-xl shadow-indigo-900/20">
            <Icon icon="material-symbols:add-2-rounded" />
          </div>
          <Link
            to="/admin/coupons/add"
            className="absolute inset-0 z-10 cursor-pointer rounded-2xl"
            aria-label="Add New Coupon"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
