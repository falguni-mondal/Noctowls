import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Loader from '../../../../utils/loader/Loader';
import Logo from '../../../../utils/logo/Logo'; 
import { 
    getAdminOrderById, 
    updateAdminOrderStatus, 
    clearCurrentAdminOrder,
    selectAdminCurrentOrder,
    selectAdminOrderDetailsLoading,
    selectAdminOrderActionLoading
} from '../../../../store/features/admin/adminOrderSlice';
import { toast } from 'react-toastify';

const AdminOrderDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const order = useSelector(selectAdminCurrentOrder);
    const loading = useSelector(selectAdminOrderDetailsLoading);
    const actionLoading = useSelector(selectAdminOrderActionLoading);

    const [statusToUpdate, setStatusToUpdate] = useState('');
    const [trackingId, setTrackingId] = useState('');

    useEffect(() => {
        dispatch(getAdminOrderById(id));
        return () => {
            dispatch(clearCurrentAdminOrder());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (order) {
            setStatusToUpdate(order.orderStatus);
        }
    }, [order]);

    // --- UTILITIES ---
    const handleStatusUpdate = async () => {
        if (!statusToUpdate || statusToUpdate === order.orderStatus) return;
        if (statusToUpdate === 'shipped' && !trackingId.trim()) {
            toast.warn("Please enter a Tracking ID for shipped orders.");
        }

        const result = await dispatch(updateAdminOrderStatus({ 
            orderId: id, 
            status: statusToUpdate,
            trackingId: statusToUpdate === 'shipped' ? trackingId : undefined
        }));

        if (updateAdminOrderStatus.fulfilled.match(result)) {
            toast.success(`Order status updated to ${statusToUpdate}`);
        } else {
            toast.error(result.payload || "Failed to update status");
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`, { autoClose: 1000, hideProgressBar: true });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading || !order) return <div className="w-full h-screen flex justify-center items-center bg-zinc-950"><Loader /></div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    return (
        <>
            {/* =================================================================================
               1. SCREEN VIEW (Dark Mode Admin Panel) - Hidden when printing
               ================================================================================= */}
            <div className="py-10 p-3 md:p-6 bg-zinc-950 min-h-screen text-zinc-100 print:hidden">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                             <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white">
                                <Icon icon="ph:arrow-left-bold" />
                            </button>
                            <h1 className='text-2xl font-semibold'>Order Details</h1>
                        </div>
                        <div>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    Order #{order.orderNumber}
                                    <button 
                                        onClick={() => copyToClipboard(order.orderNumber, "Order ID")}
                                        className="text-zinc-500 hover:text-blue-500 text-lg transition-colors"
                                        title="Copy Order ID"
                                    >
                                        <Icon icon="solar:copy-bold-duotone" />
                                    </button>
                                </h2>
                                <span className={`w-fit px-2 py-0.5 text-xs font-medium border rounded-full uppercase ${getStatusColor(order.orderStatus)}`}>
                                    {order.orderStatus}
                                </span>
                            </div>
                            <p className="text-zinc-400 text-sm mt-1">
                                Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })} via {order.payment.method}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:bg-zinc-800 transition active:scale-95"
                        >
                            <Icon icon="solar:printer-bold" />
                            Print Invoice
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-800 font-medium text-zinc-300">
                                Order Items ({order.items.length})
                            </div>
                            <div className="divide-y divide-zinc-800">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex gap-4">
                                        <div className="w-16 h-20 bg-zinc-800 rounded-md overflow-hidden shrink-0">
                                            <img src={item.productImage || item.image} alt={item.productName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-zinc-200 line-clamp-1">{item.productName}</h3>
                                            <p className="text-sm text-zinc-400 mt-1">Size: {item.size.label} | SKU: <span className="font-mono">{item.size.skuCode || "N/A"}</span></p>
                                            <div className="flex justify-between items-end mt-2">
                                                <p className="text-xs text-zinc-400">Qty: {item.quantity} x ₹{item.price}</p>
                                                <p className="font-medium text-zinc-200">₹{item.itemTotal}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* ✅ SCREEN VIEW: Free Gifts with Quantity */}
                                {order.freeGifts?.gifts?.map((gift, idx) => (
                                    <div key={`gift-${idx}`} className="p-4 flex gap-4 bg-zinc-900/50">
                                        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 relative">
                                            <img src={gift.image} alt={gift.name} className="w-full h-full object-contain opacity-70" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h3 className="font-medium text-zinc-300 text-sm line-clamp-1">{gift.name}</h3>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-green-500">Free Gift Applied</p>
                                                {/* Uses real quantity from JSON */}
                                                <p className="text-xs text-zinc-400">Qty: {gift.quantity}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-medium text-zinc-300 mb-4">Payment Breakdown</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Subtotal</span>
                                    <span>₹{order.pricing.productsSubtotal}</span>
                                </div>
                                {order.pricing.couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Coupon Discount ({order.coupon?.code})</span>
                                        <span>- ₹{order.pricing.couponDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-zinc-400">
                                    <span>Shipping</span>
                                    <span>{order.pricing.shippingCharges === 0 ? "Free" : `₹${order.pricing.shippingCharges}`}</span>
                                </div>
                                {order.pricing.codFee > 0 && (
                                    <div className="flex justify-between text-zinc-400">
                                        <span>COD Fee</span>
                                        <span>₹{order.pricing.codFee}</span>
                                    </div>
                                )}
                                <div className="border-t border-zinc-800 pt-3 flex justify-between text-base font-semibold text-zinc-100">
                                    <span>Total Amount</span>
                                    <span>₹{order.pricing.finalTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-medium text-zinc-300 mb-4">Update Status</h3>
                            <div className="space-y-4">
                                <select 
                                    value={statusToUpdate}
                                    onChange={(e) => setStatusToUpdate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-zinc-200"
                                    disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'delivered'}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {statusToUpdate === 'shipped' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <input 
                                            type="text" 
                                            placeholder="Enter Tracking ID / Link"
                                            value={trackingId}
                                            onChange={(e) => setTrackingId(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-zinc-200"
                                        />
                                    </div>
                                )}
                                <button 
                                    onClick={handleStatusUpdate}
                                    disabled={actionLoading || statusToUpdate === order.orderStatus || order.orderStatus === 'cancelled'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-2.5 rounded-lg transition text-sm flex justify-center items-center gap-2"
                                >
                                    {actionLoading && <Icon icon="eos-icons:loading" />}
                                    Update Status
                                </button>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-medium text-lg text-zinc-300 flex items-center gap-2 mb-4">
                                <Icon icon="solar:user-circle-bold" className="text-blue-500" />
                                Customer
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-zinc-200"><span className="text-zinc-500 text-xs block">Name</span>{order.guestInfo?.name || order.user?.name || "Guest User"}</p>
                                <p className="text-zinc-200"><span className="text-zinc-500 text-xs block">Email</span>{order.guestInfo?.email || order.user?.email}</p>
                                {order.shippingAddress?.phone && <p className="text-zinc-200"><span className="text-zinc-500 text-xs block">Phone</span>{order.shippingAddress.phone}</p>}
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-medium text-lg text-zinc-300 flex items-center gap-2 mb-4">
                                <Icon icon="solar:map-point-bold" className="text-amber-500" />
                                Delivery Address
                            </h3>
                            <div className="text-sm text-zinc-300 leading-relaxed">
                                <p className="font-medium text-white mb-1">{order.shippingAddress?.fullName}</p>
                                <p>{order.shippingAddress?.address}</p>
                                {order.shippingAddress?.landmark && <p>{order.shippingAddress.landmark}</p>}
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-mono text-zinc-400">{order.shippingAddress?.pincode}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================================================
               2. PRINT VIEW (Standard Invoice Layout) - Visible ONLY when printing
               ================================================================================= */}
            <div className="hidden print:block print:p-8 bg-white text-black font-sans text-sm">
                
                {/* INVOICE HEADER */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                    <div>
                        <div className="text-3xl font-bold tracking-tight mb-1">NOCTOWLS</div>
                        <p className="text-xs text-gray-500 mt-2">
                            help.noctowls@gmail.com<br />
                            www.noctowls.com
                        </p>
                    </div>
                    <Logo width="w-[4rem]" />
                    <div className="text-right">
                        <h2 className="text-xl font-bold mb-1">TAX INVOICE</h2>
                        <p className="text-gray-600">Order ID: <span className="font-mono font-bold text-black">#{order.orderNumber}</span></p>
                        <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        {order.invoice?.invoiceNumber && <p className="text-gray-600">Invoice #: {order.invoice.invoiceNumber}</p>}
                    </div>
                </div>

                {/* ADDRESSES */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">Sold By</h3>
                        <div className="text-gray-700 leading-snug">
                            <p className="font-semibold">Noctowls Pvt Ltd.</p>
                            <p>2nd Floor, Arushi Complex</p>
                            <p>Muchipara ITI, Aambagan, Duragapur-713212</p>
                            <p>Paschim Bardhamaan, West Bengal</p>
                            <p>GSTIN: 19BNYPG7506F1ZJ</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">Billing & Shipping Address</h3>
                        <div className="text-gray-700 leading-snug">
                            <p className="font-semibold">{order.shippingAddress?.fullName}</p>
                            <p>{order.shippingAddress?.address}</p>
                            {order.shippingAddress?.landmark && <p>{order.shippingAddress.landmark}</p>}
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            <p>Pin: {order.shippingAddress?.pincode}</p>
                            <p>Phone: {order.shippingAddress?.phone}</p>
                        </div>
                    </div>
                </div>

                {/* ITEMS TABLE */}
                <table className="w-full mb-6 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-800 text-left">
                            <th className="py-2 font-bold uppercase text-xs w-[5%]">#</th>
                            <th className="py-2 font-bold uppercase text-xs w-[50%]">Product Description</th>
                            <th className="py-2 font-bold uppercase text-xs w-[15%] text-center">Qty</th>
                            <th className="py-2 font-bold uppercase text-xs w-[15%] text-right">Price</th>
                            <th className="py-2 font-bold uppercase text-xs w-[15%] text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {order.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3 text-center">{idx + 1}</td>
                                <td className="py-3">
                                    <p className="font-semibold text-black">{item.productName}</p>
                                    <p className="text-xs text-gray-500">Size: {item.size.label} {item.size.skuCode && `| SKU: ${item.size.skuCode}`}</p>
                                </td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-right">₹{item.price}</td>
                                <td className="py-3 text-right font-medium text-black">₹{item.itemTotal}</td>
                            </tr>
                        ))}
                        
                        {/* ✅ INVOICE VIEW: Free Gifts with correct quantity */}
                        {order.freeGifts?.gifts?.map((gift, idx) => (
                            <tr key={`gift-${idx}`} className="border-b border-gray-200 bg-gray-50">
                                <td className="py-3 text-center">-</td>
                                <td className="py-3">
                                    <p className="font-semibold text-black">{gift.name}</p>
                                    <p className="text-xs text-green-700 font-bold tracking-wide">FREE GIFT</p>
                                </td>
                                {/* Uses real quantity from JSON */}
                                <td className="py-3 text-center font-medium">{gift.quantity}</td>
                                <td className="py-3 text-right text-gray-500">₹0</td>
                                <td className="py-3 text-right font-medium text-black">₹0</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS SECTION */}
                <div className="flex justify-end mb-10">
                    <div className="w-[40%]">
                        <div className="flex justify-between py-1 text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{order.pricing.productsSubtotal}</span>
                        </div>
                        {order.pricing.couponDiscount > 0 && (
                            <div className="flex justify-between py-1 text-gray-600">
                                {/* ✅ Coupon Code Displayed */}
                                <span>Coupon Discount ({order.coupon?.code})</span>
                                <span>- ₹{order.pricing.couponDiscount}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1 text-gray-600">
                            <span>Shipping Charges</span>
                            <span>{order.pricing.shippingCharges === 0 ? "Free" : `₹${order.pricing.shippingCharges}`}</span>
                        </div>
                        {order.pricing.codFee > 0 && (
                            <div className="flex justify-between py-1 text-gray-600">
                                <span>COD Handling Fee</span>
                                <span>₹{order.pricing.codFee}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2 text-lg font-bold text-black">
                            <span>Grand Total</span>
                            <span>₹{order.pricing.finalTotal}</span>
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1">
                            (Inclusive of all taxes)
                        </div>
                    </div>
                </div>

                {/* FOOTER / TERMS */}
                <div className="border-t border-gray-300 pt-4">
                    <p className="font-bold text-xs uppercase mb-1">Payment Method: {order.payment.method}</p>
                    {order.payment.method === "COD" && (
                        <p className="text-sm font-bold border border-black inline-block px-2 py-1 mt-1">
                            AMOUNT TO COLLECT: ₹{order.payment.amountPaidOnDelivery}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminOrderDetails;