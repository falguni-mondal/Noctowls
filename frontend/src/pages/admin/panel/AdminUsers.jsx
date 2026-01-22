import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import {
  getAllUsers,
  deleteUser,
  setUsersFilter,
  selectAdminUsers,
  selectAdminUsersPagination,
  selectAdminUserFilters,
  selectAdminUsersLoading,
  selectAdminUserActionLoading
} from "../../../store/features/admin/adminUserSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const users = useSelector(selectAdminUsers);
  const pagination = useSelector(selectAdminUsersPagination);
  const filters = useSelector(selectAdminUserFilters);
  const loading = useSelector(selectAdminUsersLoading);
  const actionLoading = useSelector(selectAdminUserActionLoading);

  // Local State
  const [searchTerm, setSearchTerm] = useState(filters.search);

  // ✅ NEW: Menu State stores ID and Screen Position
  const [activeMenu, setActiveMenu] = useState({ id: null, top: 0, right: 0 });
  const actionMenuRef = useRef(null);

  // --- EFFECT: Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setUsersFilter({ search: searchTerm }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch]);

  // --- EFFECT: Fetch Data ---
  useEffect(() => {
    dispatch(getAllUsers({
      page: pagination.currentPage,
      limit: 10,
      search: filters.search,
      role: filters.role,
      status: filters.status,
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
      sortBy: filters.sortBy
    }));
  }, [dispatch, pagination.currentPage, filters]);

  // --- EFFECT: Click Outside & Scroll to Close Menu ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    // Close menu on scroll to prevent floating position issues
    const handleScroll = () => closeMenu();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true for capturing scroll in nested divs

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // --- HANDLERS ---
  const closeMenu = () => setActiveMenu({ id: null, top: 0, right: 0 });

  const handleMenuClick = (e, userId) => {
    e.stopPropagation();

    // If clicking the same button, toggle off
    if (activeMenu.id === userId) {
      closeMenu();
      return;
    }

    // Calculate Position relative to viewport
    const rect = e.currentTarget.getBoundingClientRect();

    setActiveMenu({
      id: userId,
      // Position slightly below button
      top: rect.bottom + 6,
      // Align right edge of menu with right edge of button
      right: window.innerWidth - rect.right
    });
  };

  const handleFilterChange = (key, value) => {
    if (key === "start" || key === "end") {
      dispatch(setUsersFilter({
        dateRange: { ...filters.dateRange, [key]: value }
      }));
    } else {
      dispatch(setUsersFilter({ [key]: value }));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    dispatch(setUsersFilter({
      search: "",
      role: "all",
      status: "all",
      dateRange: { start: "", end: "" },
      sortBy: "newest"
    }));
  };

  const handleDelete = async (userId) => {
    closeMenu();
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    try {
      await dispatch(deleteUser(userId)).unwrap();
      toast.success("User deleted successfully", toastControls);
    } catch (error) {
      toast.error(error || "Failed to delete user", toastControls);
    }
  };

  const handlePageChange = (newPage) => {
    dispatch(getAllUsers({
      ...filters,
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
      page: newPage
    }));
  };

  // --- UI HELPERS ---
  const RoleBadge = ({ role }) => {
    const isAdm = role === "admin";
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${isAdm
        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
        }`}>
        <Icon icon={isAdm ? "solar:shield-bold" : "solar:user-bold"} />
        {role}
      </span>
    );
  };

  const StatusBadge = ({ isVerified }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${isVerified
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-emerald-400" : "bg-amber-400"}`}></div>
      {isVerified ? "Verified" : "Unverified"}
    </span>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-zinc-950 text-zinc-100 font-sans relative">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Users
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage user accounts, roles, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 border border-zinc-800 rounded-lg px-5 py-3">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Total Users</span>
            <span className="text-lg font-bold text-white leading-none mt-1">{pagination.totalUsers}</span>
          </div>
        </div>
      </div>

      {/* --- FILTERS TOOLBAR --- */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 mb-6 flex flex-col xl:flex-row gap-2">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 p-2">
          {/* Search */}
          <div className="relative group w-full sm:w-64">
            <Icon icon="mynaui:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Role Filter */}
          <div className="relative w-full sm:w-40">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-zinc-300 cursor-pointer appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-40">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-zinc-300 cursor-pointer appearance-none"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
            <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center p-2 border-t xl:border-t-0 xl:border-l border-zinc-800/50">
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-auto">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleFilterChange("start", e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none w-28 cursor-pointer placeholder-zinc-600"
            />
            <span className="text-zinc-600 text-xs">to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              min={filters.dateRange.start}
              onChange={(e) => handleFilterChange("end", e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none w-28 cursor-pointer"
            />
          </div>

          {/* Sort */}
          <div className="relative w-full sm:w-40">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-zinc-300 cursor-pointer appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <Icon icon="solar:sort-vertical-linear" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Clear Button */}
          {(searchTerm || filters.role !== "all" || filters.status !== "all" || filters.dateRange.start) && (
            <button
              onClick={handleClearFilters}
              className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-all flex gap-1 items-center text-sm"
              title="Clear Filters"
            >
              <Icon icon="solar:restart-bold" />
              Clear Filters
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
                <th className="p-5 pl-6">User</th>
                <th className="p-5">Contact Info</th>
                <th className="p-5">Role & Status</th>
                <th className="p-5">Joined Date</th>
                <th className="p-5 text-right pr-6 w-24">
                  <Icon icon="solar:menu-dots-bold" className="ml-auto text-lg" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <Icon icon="solar:users-group-rounded-linear" className="text-3xl opacity-50" />
                      </div>
                      <p className="text-zinc-400 font-medium">No users found</p>
                      <p className="text-xs">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="group hover:bg-zinc-800/30 transition-colors">
                    {/* User Info */}
                    <td className="p-5 pl-6 max-w-[250px] sm:max-w-[300px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0 shadow-inner">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-zinc-200 truncate" title={user.name}>{user.name || "Unknown User"}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate" title={user._id}>ID: {user._id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-5 max-w-[200px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-zinc-300 text-sm min-w-0">
                          <Icon icon="solar:letter-linear" className="text-zinc-500 text-base shrink-0" />
                          <span className="truncate" title={user.email}>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-zinc-400 text-xs min-w-0">
                            <Icon icon="solar:phone-linear" className="text-zinc-500 text-base shrink-0" />
                            <span className="truncate">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role & Status */}
                    <td className="p-5">
                      <div className="flex flex-col items-start gap-2">
                        <RoleBadge role={user.role} />
                        <StatusBadge isVerified={user.isVerified} />
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-5 text-zinc-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:calendar-date-linear" className="text-zinc-600" />
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </div>
                      <div className="text-[10px] text-zinc-600 pl-6 mt-0.5">
                        {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Actions (Button Only) */}
                    <td className="p-5 pr-6 text-right">
                      <button
                        onClick={(e) => handleMenuClick(e, user._id)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeMenu.id === user._id
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          }`}
                      >
                        <Icon icon="solar:menu-dots-bold" className="text-lg" />
                      </button>
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

      {/* ✅ FIXED MENU: Rendered Outside Table to prevent Overflow Clipping */}
      {activeMenu.id && (
        <div
          ref={actionMenuRef}
          className="fixed w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
          style={{
            top: activeMenu.top,
            right: activeMenu.right
          }}
        >
          <button
            onClick={() => {
              navigate(`/admin/users/${activeMenu.id}`);
              closeMenu();
            }}
            className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Icon icon="solar:eye-linear" className="text-lg" />
            View Details
          </button>

          {/* Retrieve role safely. Since activeMenu only stores ID, we find user from list. */}
          {users.find(u => u._id === activeMenu.id)?.role !== "admin" && (
            <button
              onClick={() => handleDelete(activeMenu.id)}
              disabled={actionLoading}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/10 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-zinc-800"
            >
              <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
              Delete User
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;