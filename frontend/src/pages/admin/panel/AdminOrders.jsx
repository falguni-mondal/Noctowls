import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";
import Loader from "../../../utils/loader/Loader";
import {
  getAllAdminOrders,
  getAdminOrderStats,
  selectAdminOrderStats,
  shipAdminOrder,
  updateAdminOrderStatus,
  clearAdminOrderErrors,
  exportAdminOrders,
  resetOrderExportState,
} from "../../../store/features/admin/adminOrderSlice";

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

const ErrorPopup = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Action Failed
            </h3>
            <p className="text-zinc-600 text-sm leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

// Extract creation timestamp from createdAt or MongoDB ObjectId (_id)
const getOrderTimestamp = (order) => {
  if (order?.createdAt) {
    const t = new Date(order.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const idStr = String(order?._id || "");
  return /^[0-9a-fA-F]{24}$/.test(idStr)
    ? parseInt(idStr.substring(0, 8), 16) * 1000
    : 0;
};

const AdminOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read pagination and filters from URL query params
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const activeTab = searchParams.get("tab") || "all";
  const statusFilter =
    activeTab === "returns" ? "" : searchParams.get("status") || "";
  const returnStatus = activeTab === "returns" ? "active" : "";
  const searchQuery = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [inputValue, setInputValue] = useState(searchQuery);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (key === "tab" && val === "all")
      ) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  // REDUX STATE
  const {
    orders,
    loading,
    pagination,
    error,
    export: exportState,
  } = useSelector((state) => state.adminOrders);
  const stats = useSelector(selectAdminOrderStats);

  // Defensive client-side sort so newest orders always appear first
  const sortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return [...orders].sort((a, b) => {
      const diff = getOrderTimestamp(b) - getOrderTimestamp(a);
      if (diff !== 0) return diff;
      return String(b._id || "").localeCompare(String(a._id || ""));
    });
  }, [orders]);

  // LOCAL STATE FOR POPUPS
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setShowErrorPopup(true);
      dispatch(clearAdminOrderErrors());
    }
  }, [error, dispatch]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeActionMenu) setActiveActionMenu(null);
      if (showExportMenu) setShowExportMenu(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [activeActionMenu, showExportMenu]);

  const handleShipOrder = async (orderId) => {
    setActiveActionMenu(null);
    await dispatch(shipAdminOrder(orderId));
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This will restock items."
      )
    )
      return;
    setActiveActionMenu(null);
    await dispatch(updateAdminOrderStatus({ orderId, status: "cancelled" }));
  };

  // DEBOUNCE Search into URL params
  useEffect(() => {
    if (inputValue === searchQuery) return;
    const handler = setTimeout(() => {
      updateUrlParams({ search: inputValue, page: 1 });
    }, 800);
    return () => clearTimeout(handler);
  }, [inputValue, searchQuery]);

  useEffect(() => {
    dispatch(getAdminOrderStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      getAllAdminOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        returnStatus,
        search: searchQuery,
        startDate,
        endDate,
      })
    );
  }, [
    dispatch,
    currentPage,
    statusFilter,
    returnStatus,
    searchQuery,
    startDate,
    endDate,
  ]);

  const handleTabChange = (tab) => {
    updateUrlParams({
      tab,
      status: tab === "returns" ? "" : statusFilter,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      updateUrlParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleExport = async (type = "all") => {
    setShowExportMenu(false);

    try {
      const resultAction = await dispatch(
        exportAdminOrders({
          status: statusFilter,
          returnStatus,
          search: searchQuery,
          startDate,
          endDate,
          exportType: type,
        })
      ).unwrap();

      const ordersList = resultAction.orders;

      if (!ordersList || ordersList.length === 0) {
        alert(
          type === "profit"
            ? "No profitable orders found based on current filters."
            : "No orders found."
        );
        dispatch(resetOrderExportState());
        return;
      }

      let totalSubtotal = 0;
      let totalDiscount = 0;
      let totalShipping = 0;
      let totalCodFee = 0;
      let totalGst = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let grandTotalSum = 0;

      const toNum = (val) => Number(Number(val || 0).toFixed(2));

      const excelData = ordersList.map((order) => {
        const itemsSummary = order.items
          .map((item) => `${item.productName} (x${item.quantity})`)
          .join(", ");

        const subtotal = toNum(order.pricing.productsSubtotal);
        const discount = toNum(order.pricing.couponDiscount);
        const shipping = toNum(order.pricing.shippingCharges);
        const codFee = toNum(order.pricing.codFee);
        const gst = toNum(order.totalGST);
        const cgst = toNum(order.totalCGST);
        const sgst = toNum(order.totalSGST);
        const igst = toNum(order.totalIGST);
        const finalTotal = toNum(order.pricing.finalTotal);

        totalSubtotal += subtotal;
        totalDiscount += discount;
        totalShipping += shipping;
        totalCodFee += codFee;
        totalGst += gst;
        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
        grandTotalSum += finalTotal;

        return {
          "Order ID": order.orderNumber,
          Date: formatDateDDMMYYYY(order.createdAt),
          "Customer Name": order.user
            ? order.user.name
            : order.guestInfo?.name || "Guest",
          "Customer Email": order.user
            ? order.user.email
            : order.guestInfo?.email,
          Phone: order.shippingAddress?.phone || "N/A",
          State: order.shippingAddress?.state || "N/A",
          "Order Status": order.orderStatus,
          "Return Status":
            order.returnInfo?.status !== "none"
              ? order.returnInfo?.status
              : "N/A",
          "Payment Method": order.payment.method,
          "Payment Status": order.payment.status,
          "Subtotal (Excl. Tax)": subtotal,
          Discount: discount,
          Shipping: shipping,
          "COD Fee": codFee,
          "Total Tax (GST)": gst,
          CGST: cgst,
          SGST: sgst,
          IGST: igst,
          "Grand Total": finalTotal,
          "Items Purchased": itemsSummary,
        };
      });

      const totalsRow = {
        "Order ID": "TOTALS",
        "Subtotal (Excl. Tax)": toNum(totalSubtotal),
        Discount: toNum(totalDiscount),
        Shipping: toNum(totalShipping),
        "COD Fee": toNum(totalCodFee),
        "Total Tax (GST)": toNum(totalGst),
        CGST: toNum(totalCgst),
        SGST: toNum(totalSgst),
        IGST: toNum(totalIgst),
        "Grand Total": toNum(grandTotalSum),
      };

      excelData.push({}, totalsRow);

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

      const fileName = `Orders_${
        type === "profit" ? "Profit" : "All"
      }_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      dispatch(resetOrderExportState());
    } catch (err) {
      setErrorMessage(
        typeof err === "string" ? err : "Failed to export orders."
      );
      setShowErrorPopup(true);
      dispatch(resetOrderExportState());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "confirmed":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "returned":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const clearDates = () => {
    updateUrlParams({ startDate: "", endDate: "", page: 1 });
  };

  if (loading && sortedOrders.length === 0 && !searchQuery) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="py-10 px-3 md:px-6 bg-[#f4f4f4] text-zinc-900 min-h-screen font-sans">
      {showErrorPopup && (
        <ErrorPopup
          message={errorMessage}
          onClose={() => setShowErrorPopup(false)}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div className="pb-2 xl:pb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Orders
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Manage and track all customer orders (latest first)
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full xl:w-auto items-start md:items-center">
          {/* DATE FILTERS */}
          <div className="flex items-center gap-2 bg-white border border-zinc-300 rounded-lg p-1.5 px-3 shadow-2xs">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    updateUrlParams({ startDate: e.target.value, page: 1 })
                  }
                  className="bg-transparent text-sm text-zinc-800 outline-none w-32 cursor-pointer"
                />
              </div>
              <div className="hidden md:block w-px bg-zinc-200 h-5"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) =>
                    updateUrlParams({ endDate: e.target.value, page: 1 })
                  }
                  className="bg-transparent text-sm text-zinc-800 outline-none w-32 cursor-pointer"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <div
                className="relative ml-2 w-6 h-6 group cursor-pointer"
                onClick={clearDates}
              >
                <button className="w-full h-full flex items-center justify-center text-zinc-400 group-hover:text-red-600 transition pointer-events-none">
                  <Icon icon="solar:close-circle-bold" />
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative group w-full md:w-56">
            <Icon
              icon="mynaui:search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Search Order..."
              className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-zinc-400 shadow-2xs"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          {activeTab !== "returns" && (
            <div className="relative w-full md:w-40">
              <select
                className="w-full bg-white border border-zinc-300 text-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-2xs"
                onChange={(e) =>
                  updateUrlParams({ status: e.target.value, page: 1 })
                }
                value={statusFilter}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
              <Icon
                icon="fluent:chevron-down-12-filled"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
            </div>
          )}

          {/* EXPORT DROPDOWN */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu(!showExportMenu);
              }}
              disabled={sortedOrders.length === 0 || exportState?.loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              {exportState?.loading ? (
                <Icon icon="eos-icons:loading" className="text-lg" />
              ) : (
                <Icon
                  icon="file-icons:microsoft-excel"
                  className="text-lg"
                />
              )}
              <span className="hidden md:inline">
                {exportState?.loading ? "Exporting..." : "Export"}
              </span>
              <Icon
                icon="fluent:chevron-down-12-filled"
                className="text-xs"
              />
            </button>

            {showExportMenu && (
              <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right md:origin-top-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport("all");
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icon icon="solar:file-text-bold" className="text-zinc-500" />{" "}
                  Export All
                </button>
                <div className="border-t border-zinc-200"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport("profit");
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icon icon="solar:wallet-money-bold" /> Export Profit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-zinc-200">
        <button
          onClick={() => handleTabChange("all")}
          className={`pb-3 px-2 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "all"
              ? "text-indigo-600"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          All Orders
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("returns")}
          className={`pb-3 px-2 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === "returns"
              ? "text-amber-600"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Return Requests
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 rounded-full">
            {stats?.totalReturnRequests || 0}
          </span>
          {activeTab === "returns" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs relative min-h-[400px]">
        {loading && sortedOrders.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex justify-center items-start pt-20 backdrop-blur-[1px]">
            <Loader />
          </div>
        )}

        <div className="overflow-x-auto pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-600 font-semibold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-200">
              {sortedOrders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const rowReturnStatus =
                    order.returnInfo?.status !== "none"
                      ? order.returnInfo.status
                      : null;

                  const isShippable =
                    ![
                      "shipped",
                      "out-for-delivery",
                      "delivered",
                      "returned",
                      "cancelled",
                    ].includes(order.orderStatus) &&
                    !order.tracking?.trackingNumber &&
                    order.payment?.status === "completed" &&
                    (!rowReturnStatus || rowReturnStatus === "none");

                  const isCancellable =
                    ![
                      "shipped",
                      "out-for-delivery",
                      "delivered",
                      "returned",
                      "cancelled",
                    ].includes(order.orderStatus) &&
                    (!rowReturnStatus || rowReturnStatus === "none");

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      <td className="p-4 font-mono font-semibold text-zinc-900">
                        #{order.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900">
                            {order.user
                              ? order.user.name
                              : order.guestInfo?.name || "Guest"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {order.user
                              ? order.user.email
                              : order.guestInfo?.email}
                          </span>
                          {order.customerType === "guest" && (
                            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded w-fit mt-1">
                              Guest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-zinc-700 whitespace-nowrap">
                        {formatDateDDMMYYYY(order.createdAt)}
                        <span className="text-xs block text-zinc-500">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold border ${
                              order.payment.method === "COD"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                          >
                            {order.payment.method}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.payment.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                            title={`Payment: ${order.payment.status}`}
                          ></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-zinc-900">
                            ₹
                            {Math.round(
                              order.pricing?.finalTotal || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              order.orderStatus
                            )} capitalize`}
                          >
                            {order.orderStatus}
                          </span>
                          {rowReturnStatus && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                rowReturnStatus === "requested"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : rowReturnStatus === "approved"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
                              }`}
                            >
                              Return {rowReturnStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTION COLUMN */}
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${
                              activeActionMenu === order._id
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white border-zinc-200 text-zinc-600 group-hover:text-zinc-900 group-hover:bg-zinc-100"
                            }`}
                          >
                            <Icon
                              icon="solar:menu-dots-bold"
                              className="text-lg"
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenu(
                                activeActionMenu === order._id
                                  ? null
                                  : order._id
                              );
                            }}
                            className="absolute inset-0 z-10 w-full h-full cursor-pointer"
                          />

                          {activeActionMenu === order._id && (
                            <div
                              className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() =>
                                    navigate(`/admin/orders/${order._id}`)
                                  }
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Icon
                                    icon="solar:eye-bold"
                                    className="text-zinc-500"
                                  />{" "}
                                  View Details
                                </button>

                                {isShippable && (
                                  <button
                                    onClick={() => handleShipOrder(order._id)}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors border-t border-zinc-100 cursor-pointer"
                                  >
                                    <Icon icon="solar:box-bold" /> Ship Order
                                  </button>
                                )}

                                {isCancellable && (
                                  <button
                                    onClick={() =>
                                      handleCancelOrder(order._id)
                                    }
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-zinc-100 cursor-pointer"
                                  >
                                    <Icon icon="solar:close-circle-bold" />{" "}
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-zinc-200 p-4 flex items-center justify-between bg-zinc-50">
            <span className="text-xs font-medium text-zinc-600">
              Page{" "}
              <span className="font-bold text-zinc-900">{currentPage}</span> of{" "}
              {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs disabled:opacity-50 hover:bg-zinc-100 transition cursor-pointer shadow-2xs"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-medium text-xs disabled:opacity-50 hover:bg-zinc-100 transition cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;