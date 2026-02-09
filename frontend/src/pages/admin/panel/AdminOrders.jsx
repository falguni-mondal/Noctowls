import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx'; 
import Loader from '../../../utils/loader/Loader';
import { 
  getAllAdminOrders,
  getAdminOrderStats,
  selectAdminOrderStats,
  shipAdminOrder,
  updateAdminOrderStatus, 
  clearAdminOrderErrors 
} from '../../../store/features/admin/adminOrderSlice';

// --- SIMPLE ERROR POPUP COMPONENT ---
const ErrorPopup = ({ message, onClose }) => {
  if (!message) return null;
  
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
            <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Action Failed</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // STATE
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [returnStatus, setReturnStatus] = useState(''); 
  const [activeTab, setActiveTab] = useState('all'); 
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // REDUX STATE
  const { orders, loading, pagination, error } = useSelector(state => state.adminOrders);
  const stats = useSelector(selectAdminOrderStats);

  // LOCAL STATE FOR POPUPS
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- EFFECT: WATCH FOR REDUX ERRORS ---
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setShowErrorPopup(true);
      dispatch(clearAdminOrderErrors());
    }
  }, [error, dispatch]);

  // --- INTERACTION HANDLER ---
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeActionMenu) setActiveActionMenu(null);
      if (showExportMenu) setShowExportMenu(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeActionMenu, showExportMenu]);

  // --- SHIP ORDER HANDLER ---
  const handleShipOrder = async (orderId) => {
    setActiveActionMenu(null); 
    await dispatch(shipAdminOrder(orderId));
  };

  // --- CANCEL ORDER HANDLER ---
  const handleCancelOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to cancel this order? This will restock items.")) return;
    setActiveActionMenu(null);
    // Call the update status thunk with 'cancelled'
    await dispatch(updateAdminOrderStatus({ orderId, status: 'cancelled' }));
  };

  // DEBOUNCE Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(handler);
  }, [inputValue]);

  // FETCH DATA
  useEffect(() => {
    dispatch(getAdminOrderStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllAdminOrders({
      page: currentPage,
      limit: 10,
      status: statusFilter,
      returnStatus: returnStatus,
      search: searchQuery,
      startDate,
      endDate
    }));
  }, [dispatch, currentPage, statusFilter, returnStatus, searchQuery, startDate, endDate]);

  const handleTabChange = (tab) => {
      setActiveTab(tab);
      setCurrentPage(1);
      if (tab === 'returns') {
          setReturnStatus('active'); 
          setStatusFilter(''); 
      } else {
          setReturnStatus(''); 
      }
  };

  // --- EXPORT FUNCTION ---
  const handleExport = (type = 'all') => {
    if (!orders || orders.length === 0) return;

    let ordersToExport = orders;

    // Filter Logic for Profit Export
    if (type === 'profit') {
        ordersToExport = orders.filter(order => {
            const hasActiveReturn = order.returnInfo?.status && order.returnInfo.status !== 'none';
            const isReturnedStatus = order.orderStatus === 'returned';
            const isCancelled = order.orderStatus === 'cancelled';
            const isPaymentComplete = order.payment?.status === 'completed';

            // Only include if payment is complete AND not returned/cancelled
            return !hasActiveReturn && !isReturnedStatus && !isCancelled && isPaymentComplete;
        });
    }

    if (ordersToExport.length === 0) {
        alert(type === 'profit' ? "No profitable orders found (Paid & Not Returned/Cancelled)." : "No orders found.");
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

    const excelData = ordersToExport.map(order => {
        const itemsSummary = order.items
            .map(item => `${item.productName} (x${item.quantity})`)
            .join(', ');

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
            "Date": new Date(order.createdAt).toLocaleDateString(),
            "Customer Name": order.user ? order.user.name : order.guestInfo?.name || "Guest",
            "Customer Email": order.user ? order.user.email : order.guestInfo?.email,
            "Phone": order.shippingAddress?.phone || "N/A",
            "State": order.shippingAddress?.state || "N/A",
            "Order Status": order.orderStatus,
            "Return Status": order.returnInfo?.status !== 'none' ? order.returnInfo?.status : 'N/A',
            "Payment Method": order.payment.method,
            "Payment Status": order.payment.status,
            "Subtotal (Excl. Tax)": subtotal,
            "Discount": discount,
            "Shipping": shipping,
            "COD Fee": codFee,
            "Total Tax (GST)": gst,
            "CGST": cgst,
            "SGST": sgst,
            "IGST": igst,
            "Grand Total": finalTotal,
            "Items Purchased": itemsSummary
        };
    });

    const totalsRow = {
        "Order ID": "TOTALS",
        "Subtotal (Excl. Tax)": toNum(totalSubtotal),
        "Discount": toNum(totalDiscount),
        "Shipping": toNum(totalShipping),
        "COD Fee": toNum(totalCodFee),
        "Total Tax (GST)": toNum(totalGst),
        "CGST": toNum(totalCgst),
        "SGST": toNum(totalSgst),
        "IGST": toNum(totalIgst),
        "Grand Total": toNum(grandTotalSum),
    };

    excelData.push({}, totalsRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    
    const fileName = `Orders_${type === 'profit' ? 'Profit' : 'All'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-900/30 text-green-400 border-green-800';
      case 'cancelled': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'shipped': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'confirmed': return 'bg-indigo-900/30 text-indigo-400 border-indigo-800';
      case 'returned': return 'bg-purple-900/30 text-purple-400 border-purple-800'; 
      default: return 'bg-amber-900/30 text-amber-400 border-amber-800';
    }
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (loading && orders.length === 0 && !searchQuery) return <div className="w-full h-screen flex justify-center items-center bg-zinc-950"><Loader /></div>;

  return (
    <div className="py-10 px-3 md:px-6 text-zinc-100 min-h-screen">
      
      {/* ERROR POPUP */}
      {showErrorPopup && (
        <ErrorPopup message={errorMessage} onClose={() => setShowErrorPopup(false)} />
      )}

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div className='pb-2 xl:pb-0'>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track all customer orders</p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full xl:w-auto items-start md:items-center">
          
          {/* DATE FILTERS */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-3">
             <div className="flex flex-col md:flex-row gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">From:</span>
                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm text-zinc-300 outline-none w-32 cursor-pointer" />
                </div>
                <div className="hidden md:block w-px bg-zinc-700 h-5"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">To:</span>
                    <input type="date" value={endDate} min={startDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm text-zinc-300 outline-none w-32 cursor-pointer" />
                </div>
            </div>
            {(startDate || endDate) && (
                <div className="relative ml-2 w-6 h-6 group cursor-pointer" onClick={clearDates}>
                    <button className="w-full h-full flex items-center justify-center text-zinc-500 group-hover:text-red-400 transition pointer-events-none">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </div>
            )}
          </div>

          {/* Search */}
          <div className="relative group w-full md:w-56">
            <Icon icon="mynaui:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search Order..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-zinc-600"
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          {activeTab !== 'returns' && (
              <div className="relative w-full md:w-36">
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
                <Icon icon="fluent:chevron-down-12-filled" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
          )}

          {/* EXPORT DROPDOWN */}
          <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                disabled={orders.length === 0}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
                <Icon icon="file-icons:microsoft-excel" className="text-lg" />
                <span className="hidden md:inline">Export</span>
                <Icon icon="fluent:chevron-down-12-filled" className="text-xs" />
            </button>

            {showExportMenu && (
                <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right md:origin-top-left">
                    <button onClick={(e) => { e.stopPropagation(); handleExport('all'); }} className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
                        <Icon icon="solar:file-text-bold" /> Export All
                    </button>
                    <div className="border-t border-zinc-800"></div>
                    <button onClick={(e) => { e.stopPropagation(); handleExport('profit'); }} className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-zinc-800 hover:text-green-300 transition-colors flex items-center gap-2">
                        <Icon icon="solar:wallet-money-bold" /> Export Profit
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button 
              onClick={() => handleTabChange('all')}
              className={`pb-3 px-2 text-sm font-medium transition-all relative ${activeTab === 'all' ? 'text-white' : 'text-zinc-500'}`}
          >
              All Orders
              {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>}
          </button>

          <button 
              onClick={() => handleTabChange('returns')}
              className={`pb-3 px-2 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'returns' ? 'text-white' : 'text-zinc-500'}`}
          >
              Return Requests
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-1.5 rounded-full">{stats?.totalReturnRequests || 0}</span>
              {activeTab === 'returns' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>}
          </button>
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && orders.length > 0 && (
            <div className="absolute inset-0 bg-zinc-900/50 z-10 flex justify-center items-start pt-20">
                <Loader />
            </div>
        )}

        <div className="overflow-x-auto pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Payment</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800">
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-zinc-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const returnStatus = order.returnInfo?.status !== 'none' ? order.returnInfo.status : null;
                  
                  // LOGIC: Show Ship button if NOT shipped/delivered/returned/cancelled AND has no tracking
                  // PLUS: Payment must be completed AND no active return
                  const isShippable = 
                    !['shipped', 'out-for-delivery', 'delivered', 'returned', 'cancelled'].includes(order.orderStatus) && 
                    !order.tracking?.trackingNumber && 
                    order.payment?.status === 'completed' && // Payment Check
                    (!returnStatus || returnStatus === 'none'); // Return Status Check
                  
                  // LOGIC: Show Cancel button if NOT shipped/delivered/returned/cancelled/returned
                  // Also check if no return request is active
                  const isCancellable = !['shipped', 'out-for-delivery', 'delivered', 'returned', 'cancelled'].includes(order.orderStatus) && (!returnStatus || returnStatus === 'none');

                  return (
                    <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4 font-mono text-zinc-300">#{order.orderNumber}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">{order.user ? order.user.name : order.guestInfo?.name || "Guest"}</span>
                          <span className="text-xs text-zinc-500">{order.user ? order.user.email : order.guestInfo?.email}</span>
                          {order.customerType === 'guest' && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded w-fit mt-1">Guest</span>}
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <span className="text-xs block text-zinc-600">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${order.payment.method === 'COD' ? 'bg-amber-950/30 border-amber-900 text-amber-500' : 'bg-blue-950/30 border-blue-900 text-blue-500'}`}>{order.payment.method}</span>
                          <span className={`w-2 h-2 rounded-full ${order.payment.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} title={`Payment: ${order.payment.status}`}></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-zinc-200">₹{Math.round(order.pricing?.finalTotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)} capitalize`}>{order.orderStatus}</span>
                            {returnStatus && (
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${returnStatus === 'requested' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : returnStatus === 'approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                    Return {returnStatus}
                                </span>
                            )}
                        </div>
                      </td>
                      
                      {/* ACTION COLUMN */}
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${activeActionMenu === order._id ? 'bg-zinc-700 text-white' : 'text-zinc-400 group-hover:text-white group-hover:bg-zinc-800'}`}>
                                <Icon icon="solar:menu-dots-bold" className="text-lg" />
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenu(activeActionMenu === order._id ? null : order._id);
                                }}
                                className="absolute inset-0 z-10 w-full h-full cursor-pointer"
                            />

                            {/* DROPDOWN MENU */}
                            {activeActionMenu === order._id && (
                                <div 
                                    className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                                    onClick={(e) => e.stopPropagation()} 
                                >
                                    <div className="py-1">
                                        <button 
                                            onClick={() => navigate(`/admin/orders/${order._id}`)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                                        >
                                            <Icon icon="solar:eye-bold" className="text-zinc-500" /> View Details
                                        </button>

                                        {isShippable && (
                                            <button 
                                                onClick={() => handleShipOrder(order._id)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 flex items-center gap-2 transition-colors border-t border-zinc-800"
                                            >
                                                <Icon icon="solar:box-bold" /> Ship Order
                                            </button>
                                        )}

                                        {isCancellable && (
                                            <button 
                                                onClick={() => handleCancelOrder(order._id)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-zinc-800"
                                            >
                                                <Icon icon="solar:close-circle-bold" /> Cancel Order
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
          <div className="border-t border-zinc-800 p-4 flex items-center justify-between bg-zinc-900">
            <span className="text-xs text-zinc-500">Page {currentPage} of {pagination.totalPages}</span>
            <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs disabled:opacity-50 hover:bg-zinc-700 transition">Previous</button>
                <button disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs disabled:opacity-50 hover:bg-zinc-700 transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;