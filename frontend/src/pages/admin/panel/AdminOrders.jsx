import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Loader from '../../../utils/loader/Loader';
import { getAllAdminOrders } from '../../../store/features/admin/adminOrderSlice';

const AdminOrders = () => {
  const dispatch = useDispatch();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { orders, loading, pagination } = useSelector(state => state.adminOrders);

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

  // API CALL
  useEffect(() => {
    dispatch(getAllAdminOrders({
      page: currentPage,
      limit: 10,
      status: statusFilter,
      search: searchQuery
    }));
  }, [dispatch, currentPage, statusFilter, searchQuery]);

  // Helper for Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-900/30 text-green-400 border-green-800';
      case 'cancelled': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'shipped': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'confirmed': return 'bg-indigo-900/30 text-indigo-400 border-indigo-800';
      default: return 'bg-amber-900/30 text-amber-400 border-amber-800';
    }
  };

  if (loading && orders.length === 0 && !searchQuery) return <div className="w-full h-screen flex justify-center items-center bg-zinc-950"><Loader /></div>;

  return (
    <div className="py-10 px-3 md:px-6 text-zinc-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className='pb-4'>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track all customer orders</p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative group w-full md:w-64">
            <Icon icon="mynaui:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search Order ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-zinc-600"
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-40">
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
              onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // Reset page on filter change
              }}
              value={statusFilter}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Icon icon="fluent:chevron-down-12-filled" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
        {/* Subtle Loading Overlay for search/pagination updates */}
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
                <th className="p-4 font-medium">Total</th>
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

                  return (
                    <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors group">
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
                      <td className="p-4 font-semibold text-zinc-200">
                        ₹{order.pricing.finalTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)} capitalize`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Icon icon="solar:eye-bold" className="text-lg" />
                        </Link>
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
          <div className="border-t border-zinc-800 p-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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