import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../../utils/loader/Loader";
import { optimizeImage } from "../../../../utils/helpers/imageOptimizer";
import {
  getUserDetails,
  deleteUser,
  clearCurrentUser,
  selectAdminCurrentUser,
  selectAdminUserDetailsLoading,
  selectAdminUserActionLoading,
} from "../../../../store/features/admin/adminUserSlice";
import { toast } from "react-toastify";
import toastControls from "../../../../utils/global/toastControls";

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

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl flex items-center gap-4 shadow-xs">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${colorClass} shrink-0`}
    >
      <Icon icon={icon} />
    </div>
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
        {label}
      </p>
      <p className="font-bold text-zinc-900 mt-0.5 text-lg">{value}</p>
    </div>
  </div>
);

const TabButton = ({ id, label, icon, count, activeTab, setActiveTab }) => (
  <div className="relative shrink-0">
    <button
      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all relative pointer-events-none ${
        activeTab === id ? "text-indigo-600" : "text-zinc-500"
      }`}
    >
      <Icon icon={icon} className="text-lg" />
      {label}
      {count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeTab === id
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}
        >
          {count}
        </span>
      )}
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
      )}
    </button>
    <span
      onClick={() => setActiveTab(id)}
      className="absolute inset-0 z-10 cursor-pointer"
    />
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
      <Icon icon={icon} className="text-3xl text-zinc-400" />
    </div>
    <p className="text-sm font-medium text-zinc-600">{message}</p>
  </div>
);

const AdminUserDetails = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userData = useSelector(selectAdminCurrentUser);
  const loading = useSelector(selectAdminUserDetailsLoading);
  const actionLoading = useSelector(selectAdminUserActionLoading);

  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    dispatch(getUserDetails(userId));
    return () => {
      dispatch(clearCurrentUser());
    };
  }, [dispatch, userId]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { ...toastControls, autoClose: 1000 });
  };

  const handleDeleteUser = async () => {
    if (
      !window.confirm("Are you sure? This will delete the user permanently.")
    )
      return;
    try {
      await dispatch(deleteUser(userId)).unwrap();
      toast.success("User deleted successfully", toastControls);
      navigate("/admin/users");
    } catch (error) {
      toast.error(error || "Delete failed", toastControls);
    }
  };

  if (loading || !userData)
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );

  const { profile, stats, orders, cart, wishlist, addresses } = userData;

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "cancelled":
        return "text-red-700 bg-red-50 border-red-200";
      case "shipped":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans pb-20">
      {/* --- HEADER NAVIGATION --- */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="relative w-9 h-9">
            <button className="w-full h-full flex items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 pointer-events-none">
              <Icon icon="solar:arrow-left-linear" className="text-xl" />
            </button>
            <span
              onClick={() => navigate("/admin/users")}
              className="absolute inset-0 z-10 cursor-pointer rounded-full"
            />
          </div>
          <h1 className="text-lg font-bold text-zinc-900">User Profile</h1>
        </div>
        {profile.role !== "admin" && (
          <div className="relative">
            <button
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm transition-colors font-semibold pointer-events-none"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
              <span className="hidden sm:inline">Delete User</span>
            </button>
            <span
              onClick={handleDeleteUser}
              className="absolute inset-0 z-10 cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN: PROFILE CARD --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-indigo-50 to-transparent"></div>

            <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-indigo-600 relative z-10 mb-4">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              {profile.role === "admin" && (
                <div
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full border-2 border-white shadow-xs"
                  title="Admin"
                >
                  <Icon icon="solar:shield-bold" className="text-xs" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-zinc-900 mb-1">
              {profile.name || "Unknown User"}
            </h2>
            <div className="flex items-center gap-2 mb-6">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                  profile.isVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {profile.isVerified ? "Verified Account" : "Unverified"}
              </span>
            </div>

            <div className="w-full space-y-3">
              {/* Email Row */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                    <Icon icon="solar:letter-bold" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      Email
                    </span>
                    <span
                      className="text-sm font-medium text-zinc-800 truncate w-full"
                      title={profile.email}
                    >
                      {profile.email}
                    </span>
                  </div>
                </div>
                <div className="relative w-8 h-8">
                  <button className="w-full h-full flex items-center justify-center text-zinc-500 hover:text-indigo-600 pointer-events-none">
                    <Icon icon="solar:copy-bold-duotone" />
                  </button>
                  <span
                    onClick={() => copyToClipboard(profile.email, "Email")}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />
                </div>
              </div>

              {/* Phone Row */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                    <Icon icon="solar:phone-bold" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      Phone
                    </span>
                    <span className="text-sm font-medium text-zinc-800 truncate">
                      {profile.phone || "Not provided"}
                    </span>
                  </div>
                </div>
                {profile.phone && (
                  <div className="relative w-8 h-8">
                    <button className="w-full h-full flex items-center justify-center text-zinc-500 hover:text-indigo-600 pointer-events-none">
                      <Icon icon="solar:copy-bold-duotone" />
                    </button>
                    <span
                      onClick={() => copyToClipboard(profile.phone, "Phone")}
                      className="absolute inset-0 z-10 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Joined Row */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                    <Icon icon="solar:calendar-date-bold" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      Joined
                    </span>
                    <span className="text-sm font-medium text-zinc-800">
                      {formatDateDDMMYYYY(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="solar:wallet-money-bold"
              label="Total Spend"
              value={`₹${stats.totalSpent.toLocaleString("en-IN")}`}
              colorClass="bg-emerald-50 text-emerald-600 border border-emerald-200"
            />
            <StatCard
              icon="solar:bag-check-bold"
              label="Orders"
              value={stats.ordersCount}
              colorClass="bg-blue-50 text-blue-600 border border-blue-200"
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: TABS & CONTENT --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs */}
          <div className="bg-white border border-zinc-200 rounded-xl p-1 flex overflow-x-auto scrollbar-hide shadow-xs">
            <TabButton
              id="orders"
              label="Orders"
              icon="solar:box-minimalistic-bold"
              count={stats.ordersCount}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="cart"
              label="Cart"
              icon="solar:cart-large-bold"
              count={cart?.length || 0}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="wishlist"
              label="Wishlist"
              icon="solar:heart-bold"
              count={wishlist?.length || 0}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <TabButton
              id="addresses"
              label="Addresses"
              icon="solar:map-point-bold"
              count={addresses?.length || 0}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden min-h-[400px] shadow-xs">
            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="p-0">
                {orders.length === 0 ? (
                  <EmptyState
                    icon="solar:box-minimalistic-broken"
                    message="No orders placed yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 text-xs uppercase font-semibold">
                        <tr>
                          <th className="p-4 pl-6">Order ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {orders.map((order) => (
                          <tr
                            key={order._id}
                            className="hover:bg-zinc-50 transition-colors group"
                          >
                            <td className="p-4 pl-6 font-mono font-semibold text-zinc-900">
                              {order.orderNumber}
                            </td>
                            <td className="p-4 text-zinc-600">
                              {formatDateDDMMYYYY(order.createdAt)}
                            </td>
                            <td className="p-4 font-bold text-zinc-900">
                              ₹{order.pricing.finalTotal.toLocaleString("en-IN")}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(
                                  order.orderStatus
                                )}`}
                              >
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="relative inline-flex">
                                <span className="text-indigo-600 font-semibold group-hover:text-indigo-800 transition-colors flex items-center justify-end gap-1 pointer-events-none">
                                  View{" "}
                                  <Icon icon="solar:arrow-right-linear" />
                                </span>
                                <Link
                                  to={`/admin/orders/${order._id}`}
                                  className="absolute inset-0 z-10 cursor-pointer"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* CART TAB */}
            {activeTab === "cart" && (
              <div className="p-6">
                {cart.length === 0 ? (
                  <EmptyState
                    icon="solar:cart-large-broken"
                    message="Cart is empty."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg bg-white overflow-hidden shrink-0 border border-zinc-200">
                          <img
                            src={optimizeImage(
                              item.product?.images?.[0]?.url ||
                                item.product?.image ||
                                item.image,
                              { width: 160, quality: 75 }
                            )}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="font-semibold text-zinc-900 truncate">
                            {item.product?.name || item.name}
                          </h4>
                          <div className="text-xs text-zinc-500 mt-1 flex gap-3">
                            <span>
                              Size:{" "}
                              <span className="text-zinc-800 font-semibold uppercase">
                                {item.size?.value}
                              </span>
                            </span>
                            <span>
                              Qty:{" "}
                              <span className="text-zinc-800 font-semibold">
                                {item.quantity}
                              </span>
                            </span>
                          </div>
                          <div className="mt-2 font-bold text-indigo-600">
                            ₹{item.price?.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="p-6">
                {wishlist.length === 0 ? (
                  <EmptyState
                    icon="solar:heart-broken"
                    message="Wishlist is empty."
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlist.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition-colors group"
                      >
                        <div className="aspect-4/5 bg-zinc-100 overflow-hidden relative">
                          <img
                            src={optimizeImage(
                              item.images?.[0]?.url || item.image,
                              { width: 300, quality: 75 }
                            )}
                            loading="lazy"
                            decoding="async"
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-zinc-900 shadow-2xs">
                            ₹{item.price?.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="text-xs font-semibold text-zinc-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="p-6">
                {addresses.length === 0 ? (
                  <EmptyState
                    icon="solar:map-point-broken"
                    message="No saved addresses."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl relative group hover:border-zinc-300 transition-colors"
                      >
                        {addr.isDefault && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            Default
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2 text-zinc-900 font-bold">
                          <Icon
                            icon="solar:home-smile-bold"
                            className="text-indigo-600"
                          />
                          {addr.fullName}
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                          {addr.address}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2 text-xs font-medium text-zinc-600">
                          <Icon icon="solar:phone-bold" /> {addr.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;