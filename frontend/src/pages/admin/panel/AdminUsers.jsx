import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import {
  getAllUsers,
  deleteUser,
  setUsersFilter,
  selectAdminUsers,
  selectAdminUsersPagination,
  selectAdminUsersLoading,
  selectAdminUserActionLoading,
} from "../../../store/features/admin/adminUserSlice";
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

const RoleBadge = ({ role }) => {
  const isAdm = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
        isAdm
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`}
    >
      <Icon icon={isAdm ? "solar:shield-bold" : "solar:user-bold"} />
      {role}
    </span>
  );
};

const StatusBadge = ({ isVerified }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
      isVerified
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    }`}
  >
    <div
      className={`w-1.5 h-1.5 rounded-full ${
        isVerified ? "bg-emerald-600" : "bg-amber-600"
      }`}
    ></div>
    {isVerified ? "Verified" : "Unverified"}
  </span>
);

const AdminUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchQuery = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const users = useSelector(selectAdminUsers);
  const pagination = useSelector(selectAdminUsersPagination);
  const loading = useSelector(selectAdminUsersLoading);
  const actionLoading = useSelector(selectAdminUserActionLoading);

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeMenu, setActiveMenu] = useState({ id: null, top: 0, right: 0 });
  const actionMenuRef = useRef(null);

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        ((key === "role" || key === "status") && val === "all") ||
        (key === "sortBy" && val === "newest")
      ) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  useEffect(() => {
    if (searchTerm === searchQuery) return;
    const handler = setTimeout(() => {
      updateUrlParams({ search: searchTerm, page: 1 });
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery]);

  useEffect(() => {
    dispatch(
      setUsersFilter({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        dateRange: { start: startDate, end: endDate },
        sortBy,
      })
    );
    dispatch(
      getAllUsers({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        startDate,
        endDate,
        sortBy,
      })
    );
  }, [
    dispatch,
    currentPage,
    searchQuery,
    roleFilter,
    statusFilter,
    startDate,
    endDate,
    sortBy,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };
    const handleScroll = () => closeMenu();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const closeMenu = () => setActiveMenu({ id: null, top: 0, right: 0 });

  const handleMenuClick = (e, userId) => {
    e.stopPropagation();
    if (activeMenu.id === userId) {
      closeMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveMenu({
      id: userId,
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  };

  const handleFilterChange = (key, value) => {
    if (key === "start") {
      updateUrlParams({ startDate: value, page: 1 });
    } else if (key === "end") {
      updateUrlParams({ endDate: value, page: 1 });
    } else {
      updateUrlParams({ [key]: value, page: 1 });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchParams({});
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
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateUrlParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans relative">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
            Users
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Manage user accounts, roles, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-xs">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
              Total Users
            </span>
            <span className="text-2xl font-bold text-zinc-900 leading-none mt-1">
              {pagination.totalUsers}
            </span>
          </div>
        </div>
      </div>

      {/* --- FILTERS TOOLBAR --- */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-2 mb-6 shadow-xs">
        <div className="flex flex-col xl:flex-row gap-2">
          {/* SEARCH */}
          <div className="relative flex-1 min-w-[200px] group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon
                icon="mynaui:search"
                className="text-zinc-400 text-lg group-focus-within:text-indigo-600 transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm placeholder-zinc-400 text-zinc-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {/* ROLE FILTER */}
            <div className="relative w-full sm:w-40 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:user-circle-linear"
                  className="text-zinc-500 group-focus-within:text-indigo-600 transition-colors"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-zinc-100 transition-all"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="text-zinc-500 text-xs"
                />
              </div>
            </div>

            {/* STATUS FILTER */}
            <div className="relative w-full sm:w-40 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:verified-check-linear"
                  className="text-zinc-500 group-focus-within:text-indigo-600 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-zinc-100 transition-all"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="text-zinc-500 text-xs"
                />
              </div>
            </div>

            <div className="w-px h-auto bg-zinc-200 hidden xl:block mx-1"></div>

            {/* DATE RANGE FILTER */}
            <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange("start", e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-700 font-medium focus:ring-0 p-2 w-full sm:w-28 cursor-pointer hover:text-zinc-900 transition-colors"
              />
              <span className="text-zinc-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => handleFilterChange("end", e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-700 font-medium focus:ring-0 p-2 w-full sm:w-28 cursor-pointer hover:text-zinc-900 transition-colors"
              />
            </div>

            {/* SORT FILTER */}
            <div className="relative w-full sm:w-40 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:sort-vertical-linear"
                  className="text-zinc-500 group-focus-within:text-indigo-600 transition-colors"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-zinc-100 transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="text-zinc-500 text-xs"
                />
              </div>
            </div>

            {/* CLEAR FILTERS BUTTON */}
            {(searchTerm ||
              roleFilter !== "all" ||
              statusFilter !== "all" ||
              startDate) && (
              <div className="relative w-full sm:w-auto">
                <button className="w-full h-full px-3 py-2.5 bg-zinc-100 text-zinc-700 hover:text-red-600 hover:bg-red-50 border border-zinc-200 rounded-xl transition-all flex items-center justify-center pointer-events-none">
                  <Icon icon="solar:restart-bold" className="text-lg" />
                </button>
                <span
                  onClick={handleClearFilters}
                  className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                  title="Clear Filters"
                />
              </div>
            )}
          </div>
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
                <th className="p-5 pl-6">User</th>
                <th className="p-5">Contact Info</th>
                <th className="p-5">Role & Status</th>
                <th className="p-5">Joined Date</th>
                <th className="p-5 text-right pr-6 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Icon
                          icon="solar:users-group-rounded-linear"
                          className="text-3xl text-zinc-400"
                        />
                      </div>
                      <p className="text-zinc-700 font-semibold">
                        No users found
                      </p>
                      <p className="text-xs text-zinc-500">
                        Try adjusting your filters or search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="group hover:bg-zinc-50/80 transition-colors relative"
                  >
                    <td className="p-5 pl-6 max-w-[250px] sm:max-w-[300px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-semibold text-zinc-900 truncate"
                            title={user.name}
                          >
                            {user.name || "Unknown User"}
                          </div>
                          <div
                            className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate"
                            title={user._id}
                          >
                            ID: {user._id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 max-w-[200px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-zinc-800 text-sm min-w-0">
                          <Icon
                            icon="solar:letter-linear"
                            className="text-zinc-400 text-base shrink-0"
                          />
                          <span className="truncate" title={user.email}>
                            {user.email}
                          </span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-zinc-600 text-xs min-w-0">
                            <Icon
                              icon="solar:phone-linear"
                              className="text-zinc-400 text-base shrink-0"
                            />
                            <span className="truncate">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex flex-col items-start gap-2">
                        <RoleBadge role={user.role} />
                        <StatusBadge isVerified={user.isVerified} />
                      </div>
                    </td>

                    <td className="p-5 text-zinc-700 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon
                          icon="solar:calendar-date-linear"
                          className="text-zinc-400"
                        />
                        {formatDateDDMMYYYY(user.createdAt)}
                      </div>
                      <div className="text-[10px] text-zinc-500 pl-6 mt-0.5">
                        {new Date(user.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="p-5 pr-6 text-right">
                      <div className="relative inline-block">
                        <button
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all pointer-events-none ${
                            activeMenu.id === user._id
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white border-zinc-200 text-zinc-600 group-hover:bg-zinc-100 group-hover:text-zinc-900"
                          }`}
                        >
                          <Icon
                            icon="solar:menu-dots-bold"
                            className="text-lg"
                          />
                        </button>
                        <span
                          onClick={(e) => handleMenuClick(e, user._id)}
                          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
                        />
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
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs hover:bg-zinc-100 disabled:opacity-50 transition flex items-center gap-1 pointer-events-none shadow-2xs"
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
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs hover:bg-zinc-100 disabled:opacity-50 transition flex items-center gap-1 pointer-events-none shadow-2xs"
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

      {/* FIXED MENU (Popup - Light Theme) */}
      {activeMenu.id && (
        <div
          ref={actionMenuRef}
          className="fixed w-44 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
          style={{
            top: activeMenu.top,
            right: activeMenu.right,
          }}
        >
          <div className="relative group/item">
            <div className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 group-hover/item:bg-zinc-50 group-hover/item:text-zinc-900 flex items-center gap-2 transition-colors pointer-events-none">
              <Icon icon="solar:eye-linear" className="text-lg text-zinc-500" />
              View Details
            </div>
            <span
              onClick={() => {
                navigate(`/admin/users/${activeMenu.id}`);
                closeMenu();
              }}
              className="absolute inset-0 z-10 cursor-pointer"
            />
          </div>

          {users.find((u) => u._id === activeMenu.id)?.role !== "admin" && (
            <div className="relative group/item border-t border-zinc-200">
              <button
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 group-hover/item:bg-red-50 flex items-center gap-2 transition-colors pointer-events-none"
              >
                <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                Delete User
              </button>
              <span
                onClick={() => handleDelete(activeMenu.id)}
                className="absolute inset-0 z-10 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;