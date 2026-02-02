import { useEffect, useState } from "react";
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

const Orderspage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const orders = useSelector(selectOrders);
  const loading = useSelector(selectOrderLoading);
  const pagination = useSelector(selectPagination);

  // Local State
  const [activeTab, setActiveTab] = useState("all");

  // Status Tabs Configuration
  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  // 1. Fetch Orders when Tab or Page changes
  useEffect(() => {
    const page = searchParams.get("page") || 1;
    
    // API Payload
    const params = {
      page: Number(page),
      limit: 10,
    };

    // Only add status if it's not 'all'
    if (activeTab !== "all") {
      params.status = activeTab;
    }

    dispatch(getOrders(params));
    
    // Scroll to top on change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, activeTab, searchParams]);

  // 2. Handle Tab Change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ page: 1 }); // Reset to page 1
  };

  // 3. Handle Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSearchParams({ page: newPage });
    }
  };

  // Helper: Get Status Color
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "shipped": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "confirmed": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  // Helper: Format Date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      
      {/* --- HEADER --- */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 pt-20 pb-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Icon icon="solar:alt-arrow-right-linear" />
            <span className="text-zinc-200">My Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
        </div>
      </div>

      {/* --- TABS & CONTENT --- */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide border-b border-zinc-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
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
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-zinc-500">
               <Icon icon="solar:bag-3-bold-duotone" className="text-4xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders found</h2>
            <p className="text-zinc-400 max-w-sm mb-6">
              Looks like you haven't placed any orders in this category yet.
            </p>
            <Link 
              to="/catalog"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          // ORDER CARDS
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-600 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                  
                  {/* Left: Info & Images */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border tracking-wider ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                        </span>
                        <span className="text-zinc-500 text-sm flex items-center gap-1">
                            <Icon icon="solar:calendar-linear" />
                            {formatDate(order.createdAt)}
                        </span>
                        <span className="text-zinc-500 text-sm hidden md:block">•</span>
                        <span className="text-zinc-500 text-sm font-mono">#{order.orderNumber}</span>
                    </div>

                    {/* Product Preview Thumbnails */}
                    <div className="flex items-center gap-3">
                        {order.items.slice(0, 4).map((item, i) => (
                            <div key={i} className="relative w-14 h-14 md:w-16 md:h-16 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                                <img 
                                    src={item.productImage || "/placeholder.jpg"} 
                                    alt="Product" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                                {item.quantity > 1 && (
                                    <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-tl">
                                        x{item.quantity}
                                    </span>
                                )}
                            </div>
                        ))}
                        {order.items.length > 4 && (
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 text-xs font-medium border border-zinc-700">
                                +{order.items.length - 4}
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Right: Price & Action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                    <div>
                        <p className="text-xs text-zinc-400 mb-1">Total Amount</p>
                        <p className="text-lg font-bold text-white">₹{Math.round(order.pricing.finalTotal).toLocaleString('en-IN')}</p>
                    </div>
                    
                    <button className="hidden md:flex items-center gap-1 text-sm text-blue-500 font-medium group-hover:text-blue-400 transition">
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
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Icon icon="solar:alt-arrow-left-linear" />
            </button>
            
            <span className="text-sm text-zinc-400">
              Page <span className="text-white font-bold">{pagination.currentPage}</span> of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
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