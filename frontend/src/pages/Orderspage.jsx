import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";

import {
  getOrders,
  selectOrders,
  selectOrderLoading,
  selectPagination,
} from "../store/features/user/orderSlice";

import Loader from "../utils/loader/Loader";
import { optimizeImage } from "../utils/helpers/imageOptimizer";

const Orderspage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const orders = useSelector(selectOrders);
  const loading = useSelector(selectOrderLoading);
  const pagination = useSelector(selectPagination);

  // Read both page and status tab directly from URL params
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const activeTab = searchParams.get("status") || "all";

  // Status Tabs Configuration
  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

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

  // 1. Fetch Orders when URL Tab or Page changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    };

    if (activeTab !== "all") {
      params.status = activeTab;
    }

    dispatch(getOrders(params));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dispatch, activeTab, currentPage]);

  // 2. Handle Tab Change
  const handleTabChange = (tabId) => {
    updateUrlParams({ status: tabId, page: 1 });
  };

  // 3. Handle Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateUrlParams({ page: newPage });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "confirmed":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f0f0f] pb-20">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-zinc-200 pt-6 pb-6 px-5 md:px-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link to="/" className="hover:text-red-600 transition">
              Home
            </Link>
            <Icon icon="solar:alt-arrow-right-linear" />
            <span className="text-[#0f0f0f] font-medium">My Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
        </div>
      </div>

      {/* --- TABS & CONTENT --- */}
      <div className="max-w-[1600px] mx-auto mt-6">
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide border-b border-zinc-200 px-5 md:px-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-[#0f0f0f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- ORDERS LIST --- */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : orders.length === 0 ? (
          <div className="mx-5 md:mx-10 flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-zinc-300 rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 text-zinc-400">
              <Icon icon="solar:bag-3-bold-duotone" className="text-4xl" />
            </div>
            <h2 className="text-xl font-bold mb-2">No orders found</h2>
            <p className="text-zinc-500 max-w-sm mb-6">
              Looks like you haven't placed any orders in this category yet.
            </p>
            <Link
              to="/catalog"
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4 px-5 md:px-10">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="group bg-white border border-zinc-200 rounded-xl p-4 md:p-6 hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase border tracking-wider ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className="text-zinc-500 font-medium text-sm flex items-center gap-1">
                        <Icon icon="solar:calendar-linear" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="text-zinc-300 text-sm hidden md:block">
                        •
                      </span>
                      <span className="text-zinc-500 text-sm font-mono font-bold">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {order.items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="relative w-14 h-14 md:w-16 md:h-16 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200"
                        >
                          <img
                            src={
                              optimizeImage(item.productImage, {
                                width: 160,
                                quality: 75,
                              }) || "/placeholder.jpg"
                            }
                            loading="lazy"
                            decoding="async"
                            alt="Product"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {item.quantity > 1 && (
                            <span className="absolute bottom-0 right-0 bg-white/90 border-t border-l border-zinc-200 text-[#0f0f0f] font-bold text-[10px] px-1.5 py-0.5 rounded-tl">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-500 text-xs font-bold border border-zinc-200">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0">
                    <div>
                      <p className="text-xs text-zinc-500 font-medium mb-1">
                        Total Amount
                      </p>
                      <p className="text-lg font-black text-[#0f0f0f]">
                        ₹
                        {Math.round(order.pricing.finalTotal).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <button className="hidden md:flex items-center gap-1 text-sm text-blue-600 font-bold group-hover:text-blue-700 transition">
                      View Details <Icon icon="solar:arrow-right-linear" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- PAGINATION --- */}
        {!loading && orders.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-[#0f0f0f] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Icon icon="solar:alt-arrow-left-linear" />
            </button>

            <span className="text-sm text-zinc-500 font-medium">
              Page{" "}
              <span className="text-[#0f0f0f] font-bold">{currentPage}</span>{" "}
              of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="p-2 rounded-lg bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-[#0f0f0f] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Icon icon="solar:alt-arrow-right-linear" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orderspage;