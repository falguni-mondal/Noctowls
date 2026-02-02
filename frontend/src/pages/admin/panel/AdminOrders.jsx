import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx'; 
import Loader from '../../../utils/loader/Loader';
import { 
  getAllAdminOrders,
  getAdminOrderStats,
  selectAdminOrderStats 
} from '../../../store/features/admin/adminOrderSlice';

const AdminOrders = () => {
  const dispatch = useDispatch();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('');
  
  const [returnStatus, setReturnStatus] = useState(''); 
  const [activeTab, setActiveTab] = useState('all'); 

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  
  const { orders, loading, pagination } = useSelector(state => state.adminOrders);
  
  // Get Stats for the badge
  const stats = useSelector(selectAdminOrderStats);

  // DEBOUNCE Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(1);
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // FETCH STATS ON MOUNT
  useEffect(() => {
    dispatch(getAdminOrderStats());
  }, [dispatch]);

  // API CALL
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

  // Handle Tab Change
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

  // EXPORT FUNCTION
  const handleExport = (type = 'all') => {
    if (!orders || orders.length === 0) return;

    // 1. Filter Logic
    let ordersToExport = orders;

    if (type === 'profit') {
        // [!code ++] MODIFIED PROFIT LOGIC
        ordersToExport = orders.filter(order => {
            // 1. Exclude if currently being returned or return requested
            const hasActiveReturn = order.returnInfo?.status && order.returnInfo.status !== 'none';
            
            // 2. Exclude if already marked as returned
            const isReturnedStatus = order.orderStatus === 'returned';
            
            // 3. Exclude if cancelled (Safe check)
            const isCancelled = order.orderStatus === 'cancelled';

            // 4. [!code ++] NEW: Exclude if payment is NOT completed (Pending/Failed)
            const isPaymentComplete = order.payment?.status === 'completed';

            // Include ONLY if ALL checks pass
            return !hasActiveReturn && !isReturnedStatus && !isCancelled && isPaymentComplete;
        });
    }

    if (ordersToExport.length === 0) {
        alert("No orders match the 'Profit' criteria (Completed Payment & No Returns).");
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

    excelData.push({});
    excelData.push(totalsRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const dateStr = new Date().toISOString().slice(0, 10);
    const rangeStr = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
    const typeStr = type === 'profit' ? '_ProfitOnly' : '_All';
    const fileName = `Orders_Export${typeStr}${rangeStr}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
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
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div className='pb-2 xl:pb-0'>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track all customer orders</p>
        </div>

        {/* ACTIONS & FILTERS */}
        <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full xl:w-auto items-start md:items-center">
          
          {/* DATE FILTERS */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-3">
            <div className="flex flex-col md:flex-row gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">From:</span>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-zinc-300 outline-none w-32 cursor-pointer"
                    />
                </div>
                <div className="hidden md:block w-px bg-zinc-700 h-5"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">To:</span>
                    <input 
                        type="date" 
                        value={endDate}
                        min={startDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-zinc-300 outline-none w-32 cursor-pointer"
                    />
                </div>
            </div>
            {(startDate || endDate) && (
                <div className="relative ml-2 w-6 h-6">
                    <button className="w-full h-full flex items-center justify-center text-zinc-500 hover:text-red-400 transition pointer-events-none">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                    {/* Interaction Fix */}
                    <span onClick={clearDates} className="absolute inset-0 z-10 cursor-pointer rounded-full" title="Clear Dates" />
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
                  onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                  }}
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
            <div className="relative">
                <button 
                    disabled={orders.length === 0}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors pointer-events-none"
                >
                    <Icon icon="file-icons:microsoft-excel" className="text-lg" />
                    <span className="hidden md:inline">Export</span>
                    <Icon icon="fluent:chevron-down-12-filled" className="text-xs" />
                </button>
                {/* Interaction Fix */}
                <span onClick={() => setShowExportMenu(!showExportMenu)} className="absolute inset-0 z-10 cursor-pointer rounded-lg" />
            </div>

            {/* Dropdown Menu */}
            {showExportMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                    <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="relative w-full group/item">
                            <button 
                                className="w-full text-left px-4 py-3 text-sm text-zinc-200 group-hover/item:bg-zinc-800 group-hover/item:text-white transition-colors flex items-center gap-2 pointer-events-none"
                            >
                                <Icon icon="solar:file-text-bold" /> Export All
                            </button>
                            {/* Interaction Fix */}
                            <span onClick={() => handleExport('all')} className="absolute inset-0 z-10 cursor-pointer" />
                        </div>
                        
                        <div className="border-t border-zinc-800"></div>
                        
                        <div className="relative w-full group/item">
                            <button 
                                className="w-full text-left px-4 py-3 text-sm text-green-400 group-hover/item:bg-zinc-800 group-hover/item:text-green-300 transition-colors flex items-center gap-2 pointer-events-none"
                            >
                                <Icon icon="solar:wallet-money-bold" /> Export Profit
                            </button>
                            {/* Interaction Fix */}
                            <span onClick={() => handleExport('profit')} className="absolute inset-0 z-10 cursor-pointer" />
                        </div>
                    </div>
                </>
            )}
          </div>

        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <div className="relative">
              <button 
                  className={`pb-3 px-2 text-sm font-medium transition-all relative pointer-events-none ${
                      activeTab === 'all' 
                      ? 'text-white' 
                      : 'text-zinc-500'
                  }`}
              >
                  All Orders
                  {activeTab === 'all' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>
                  )}
              </button>
              {/* Interaction Fix */}
              <span onClick={() => handleTabChange('all')} className="absolute inset-0 z-10 cursor-pointer" />
          </div>

          <div className="relative">
              <button 
                  className={`pb-3 px-2 text-sm font-medium transition-all relative flex items-center gap-2 pointer-events-none ${
                      activeTab === 'returns' 
                      ? 'text-white' 
                      : 'text-zinc-500'
                  }`}
              >
                  Return Requests
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-1.5 rounded-full">
                      {stats?.totalReturnRequests || 0}
                  </span>
                  {activeTab === 'returns' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>
                  )}
              </button>
              {/* Interaction Fix */}
              <span onClick={() => handleTabChange('returns')} className="absolute inset-0 z-10 cursor-pointer" />
          </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
        {loading && orders.length > 0 && (
            <div className="absolute inset-0 bg-zinc-900/50 z-10 flex justify-center items-start pt-20">
                <Loader />
            </div>
        )}

        <div className="overflow-x-auto">
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
                  <td colSpan="7" className="p-10 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon icon="solar:box-minimalistic-broken" className="text-4xl opacity-50" />
                      <p>No orders found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customerName = order.user ? order.user.name : order.guestInfo?.name || "Guest";
                  const customerEmail = order.user ? order.user.email : order.guestInfo?.email;
                  const isReturnRequested = order.returnInfo?.status === 'requested';
                  const returnStatus = order.returnInfo?.status !== 'none' ? order.returnInfo.status : null;

                  return (
                    <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors group relative">
                      <td className="p-4 font-mono text-zinc-300">
                        #{order.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">{customerName}</span>
                          <span className="text-xs text-zinc-500">{customerEmail}</span>
                          {order.customerType === 'guest' && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded w-fit mt-1">Guest</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <span className="text-xs block text-zinc-600">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${order.payment.method === 'COD' ? 'bg-amber-950/30 border-amber-900 text-amber-500' : 'bg-blue-950/30 border-blue-900 text-blue-500'}`}>
                            {order.payment.method}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${order.payment.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} title={`Payment: ${order.payment.status}`}></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-zinc-200">
                                ₹{Math.round(order.pricing?.finalTotal || 0).toLocaleString('en-IN')}
                            </span>
                            {(order.totalGST > 0 || order.pricing?.tax > 0) && (
                                <span className="text-[10px] text-zinc-500">
                                    GST: ₹{Math.round(order.totalGST || order.pricing?.tax || 0).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)} capitalize`}>
                                {order.orderStatus}
                            </span>
                            
                            {returnStatus && (
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                    returnStatus === 'requested' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    returnStatus === 'approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                    Return {returnStatus}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-flex w-8 h-8">
                            <div className={`w-full h-full flex items-center justify-center rounded transition-colors pointer-events-none ${
                                isReturnRequested 
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-zinc-400 group-hover:text-white group-hover:bg-zinc-800'
                            }`}>
                                <Icon icon="solar:eye-bold" className="text-lg" />
                            </div>
                            {/* Interaction Fix */}
                            <Link to={`/admin/orders/${order._id}`} className="absolute inset-0 z-10 cursor-pointer rounded" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-zinc-800 p-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <div className="relative">
                  <button
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs disabled:opacity-50 transition pointer-events-none"
                  >
                    Previous
                  </button>
                  {currentPage !== 1 && (
                      <span onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="absolute inset-0 z-10 cursor-pointer rounded" />
                  )}
              </div>

              <div className="relative">
                  <button
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs disabled:opacity-50 transition pointer-events-none"
                  >
                    Next
                  </button>
                  {currentPage !== pagination.totalPages && (
                      <span onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} className="absolute inset-0 z-10 cursor-pointer rounded" />
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;