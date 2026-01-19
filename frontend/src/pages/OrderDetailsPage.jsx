import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";

// ✅ Import Logo for Invoice
import Logo from "../utils/logo/Logo";

import {
    getOrderById,
    cancelOrder,
    selectCurrentOrder,
    selectOrderLoading,
    selectOrderError,
    selectCancelOrderLoading
} from "../store/features/user/orderSlice";

import Loader from "../utils/loader/Loader";

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const dispatch = useDispatch();

    // Redux State
    const order = useSelector(selectCurrentOrder);
    const loading = useSelector(selectOrderLoading);
    const error = useSelector(selectOrderError);
    const cancelLoading = useSelector(selectCancelOrderLoading);

    // Local State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // Fetch Order
    useEffect(() => {
        if (orderId) {
            dispatch(getOrderById(orderId));
        }
    }, [dispatch, orderId]);

    // --- ACTIONS ---
    const handleDownloadInvoice = async () => {
        try {
            // Small delay to ensure styles are applied before print dialog opens
            setTimeout(() => window.print(), 500);
        } catch (err) {
            toast.error("Failed to download invoice", toastControls);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.warn("Please provide a reason for cancellation", toastControls);
            return;
        }

        const result = await dispatch(cancelOrder({ orderId, reason: cancelReason }));
        if (cancelOrder.fulfilled.match(result)) {
            toast.success("Order cancelled successfully", toastControls);
            setShowCancelModal(false);
        } else {
            toast.error(result.payload || "Failed to cancel order", toastControls);
        }
    };

    // --- HELPER: STEPPER LOGIC ---
    const getStepperStatus = () => {
        if (!order) return 0;
        const statusMap = {
            pending: 1,
            confirmed: 2,
            shipped: 3,
            delivered: 4,
            cancelled: -1
        };
        return statusMap[order.orderStatus] || 1;
    };

    const steps = [
        { label: "Order Placed", date: order?.statusTimestamps?.pending },
        { label: "Processing", date: order?.statusTimestamps?.confirmed },
        { label: "Shipped", date: order?.statusTimestamps?.shipped },
        { label: "Delivered", date: order?.statusTimestamps?.delivered },
    ];

    const currentStep = getStepperStatus();
    const isCancelled = order?.orderStatus === 'cancelled';

    // --- RENDER HELPERS ---
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
    const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950"><Loader /></div>;

    if (error || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">Order Not Found</h2>
            <Link to="/orders" className="text-blue-500 mt-4 hover:underline">Back to Orders</Link>
        </div>
    );

    return (
        // Added print:p-0 to remove body padding during print
        <div className="min-h-[70vh] bg-zinc-950 text-zinc-100 pb-20 print:p-0 print:bg-white print:text-black">

            {/* ======================== SCREEN VIEW HEADER (Hidden on Print) ======================== */}
            <div className="bg-zinc-900 border-b border-zinc-800 pt-14 pb-6 px-4 md:px-8 print:hidden">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                            <Link to="/orders" className="hover:text-white transition flex items-center gap-1">
                                <Icon icon="solar:arrow-left-linear" /> Back to Orders
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            Order #{order.orderNumber}
                            <span className={`text-sm font-medium px-3 py-1 rounded-full border ${isCancelled ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                order.orderStatus === 'delivered' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                    "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                }`}>
                                {order.orderStatus}
                            </span>
                        </h1>
                    </div>
                    <button
                        onClick={handleDownloadInvoice}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition"
                    >
                        <Icon icon="solar:file-download-bold" /> Download Invoice
                    </button>
                </div>
            </div>

            {/* ======================== SCREEN VIEW CONTENT (Hidden on Print) ======================== */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6 print:hidden">

                {/* --- 1. TRACKER (VERTICAL STEPPER) --- */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    {isCancelled ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                            <Icon icon="solar:close-circle-bold" className="text-2xl text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-red-500">This order has been cancelled</h3>
                                <p className="text-zinc-400 text-sm mt-1">Reason: {order.cancellation?.reason || "Cancelled by user"}</p>
                                {order.cancellation?.refundStatus !== 'not-applicable' && (
                                    <p className="text-sm mt-2 font-medium">
                                        Refund Status: <span className="text-white capitalize">{order.cancellation.refundStatus}</span>
                                        {order.cancellation.refundAmount > 0 && ` (₹${order.cancellation.refundAmount})`}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative pl-2">
                            {/* Vertical Steps */}
                            <div className="space-y-8 relative">
                                {/* Connecting Line */}
                                <div className="absolute top-2 left-[19px] bottom-6 w-0.5 bg-zinc-800 z-0" />

                                {steps.map((step, index) => {
                                    const isCompleted = index + 1 <= currentStep;
                                    const isCurrent = index + 1 === currentStep;

                                    return (
                                        <div key={index} className="flex gap-4 relative z-10">
                                            {/* Icon Circle */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 text-lg shrink-0 transition-all duration-300 ${isCompleted ? "bg-green-500 border-zinc-900 text-white" : "bg-zinc-800 border-zinc-900 text-zinc-500"
                                                }`}>
                                                {isCompleted ? <Icon icon="solar:check-read-bold" /> : <span className="text-xs">{index + 1}</span>}
                                            </div>

                                            {/* Text Info */}
                                            <div className="pt-1">
                                                <p className={`text-base font-medium ${isCompleted || isCurrent ? "text-white" : "text-zinc-500"}`}>
                                                    {step.label}
                                                </p>
                                                {step.date ? (
                                                    <p className="text-sm text-zinc-400 mt-1">{formatDate(step.date)}</p>
                                                ) : (
                                                    isCurrent && <p className="text-xs text-blue-500 mt-1 animate-pulse">In Progress...</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 2. ORDER ITEMS --- */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 font-medium text-zinc-300">
                        Items in this order
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="p-4 md:p-6 flex flex-row gap-4 items-center">
                                <Link to={`/products/${item.product}`} className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700">
                                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                </Link>
                                <div className="flex-1">
                                    <Link to={`/products/${item.product}`} className="text-base font-semibold text-zinc-200 hover:text-blue-500 transition">
                                        {item.productName}
                                    </Link>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-400">
                                        <span className="px-2 py-0.5 rounded border border-zinc-800">Size: {item.size.label}</span>
                                        <span>Qty: {item.quantity}</span>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-white sm:text-right">
                                    ₹{formatCurrency(item.itemTotal)}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Free Gifts */}
                    {order.freeGifts?.gifts?.length > 0 && (
                        <div className="p-4 bg-green-500/5 border-t border-zinc-800">
                            <h4 className="text-xs font-bold text-green-500 uppercase mb-3 flex items-center gap-1">
                                <Icon icon="solar:gift-bold" /> Free Gifts Included
                            </h4>
                            <div className="space-y-3">
                                {order.freeGifts.gifts.map((gift, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <img src={gift.image} className="w-10 h-10 rounded bg-zinc-800 object-cover" />
                                        <div>
                                            <p className="text-sm text-zinc-200 font-medium">{gift.name}</p>
                                            <p className="text-xs text-zinc-500">Qty: {gift.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 3. DETAILS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Shipping Address */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-bold text-zinc-400 text-xs uppercase mb-4">Shipping Details</h3>
                        <div className="text-sm text-zinc-300 space-y-1">
                            <p className="font-semibold text-white text-base mb-2">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.address}</p>
                            {order.shippingAddress.landmark && <p>{order.shippingAddress.landmark}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                            <p className="mt-3 flex items-center gap-2 text-zinc-400">
                                <Icon icon="solar:phone-bold" /> {order.shippingAddress.phone}
                            </p>
                        </div>
                    </div>

                    {/* Payment & Price */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
                        <h3 className="font-bold text-zinc-400 text-xs uppercase mb-4">Payment Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-zinc-300">
                                <span>Payment Method</span>
                                <span className="font-medium">{order.payment.method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                            </div>
                            <div className="border-t border-zinc-800 my-2"></div>

                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Subtotal</span>
                                <span>₹{formatCurrency(order.pricing.productsSubtotal)}</span>
                            </div>
                            {order.pricing.couponDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-500">
                                    <span>Discount</span>
                                    <span>- ₹{formatCurrency(order.pricing.couponDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Shipping</span>
                                <span>{order.pricing.shippingCharges === 0 ? "Free" : `₹${formatCurrency(order.pricing.shippingCharges)}`}</span>
                            </div>
                            {order.pricing.codFee > 0 && (
                                <div className="flex justify-between text-sm text-zinc-400">
                                    <span>COD Fee</span>
                                    <span>₹{formatCurrency(order.pricing.codFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-white mt-4 pt-4 border-t border-zinc-800">
                                <span>Total Amount</span>
                                <span>₹{formatCurrency(order.pricing.finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 4. CANCEL BUTTON (Only if pending/confirmed) --- */}
                {!isCancelled && order.orderStatus !== 'delivered' && order.orderStatus !== 'shipped' && (
                    <div className="flex justify-end pt-4 pb-10">
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="px-6 py-2.5 text-red-500 border border-red-500/30 hover:bg-red-500/10 rounded-lg text-sm font-medium transition"
                        >
                            Cancel Order
                        </button>
                    </div>
                )}

            </div>

            {/* --- CANCEL MODAL --- */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-2">Cancel Order?</h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>

                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Reason for Cancellation</label>
                        <select
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:border-red-500 outline-none mb-6"
                        >
                            <option value="">Select a reason...</option>
                            <option value="Changed my mind">Changed my mind</option>
                            <option value="Found a better price">Found a better price</option>
                            <option value="Ordered by mistake">Ordered by mistake</option>
                            <option value="Delay in shipping">Delay in shipping</option>
                            <option value="Other">Other</option>
                        </select>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white transition"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={!cancelReason || cancelLoading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {cancelLoading && <Icon icon="eos-icons:loading" />}
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== FULL PAGE PRINT VIEW (Visible ONLY on print) ======================== */}
            <div className="hidden print:block print:fixed print:inset-0 print:z-9999 print:bg-white print:py-4 print:px-6 print:h-screen print:overflow-hidden font-sans text-black">

                <div className="h-full flex flex-col max-w-3xl mx-auto">

                    {/* 1. INVOICE HEADER (Clean: Logo + Title) */}
                    <div className="flex justify-between border-b-2 border-gray-800 pb-6 mb-6">
                        {/* Left: Logo & Brand */}
                            <div className="flex flex-col items-center justify-start">
                                <div className="w-28 h-28">
                                    <Logo width="w-full h-full" color="text-black" />
                                </div>
                                <p className="text-xl font-extrabold tracking-tight leading-0 text-black">NOCTOWLS</p>
                            </div>

                        {/* Right: Invoice Details */}
                        <div className="text-right">
                            <h2 className="text-3xl font-bold mb-2 text-gray-900">TAX INVOICE</h2>
                            <p className="text-sm text-gray-600 mb-1">Order ID: <span className="font-mono font-bold text-black">#{order.orderNumber}</span></p>
                            <p className="text-sm text-gray-600 mb-1">Date: <span className="font-medium text-black">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                            {order.invoice?.invoiceNumber && <p className="text-sm text-gray-600">Invoice #: <span className="font-medium text-black">{order.invoice.invoiceNumber}</span></p>}
                        </div>
                    </div>

                    {/* 2. ADDRESSES (Sold By + Billed To) */}
                    <div className="grid grid-cols-2 gap-12 mb-8 shrink-0">
                        {/* Sold By */}
                        <div>
                            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Sold By</h3>
                            <div className="text-sm text-gray-700 leading-snug">
                                <p className="font-bold text-black text-base mb-1">Noctowls</p>
                                <p>2nd Floor, Arushi Complex, Muchipara</p>
                                <p>Durgapur-713212, West Bengal, India</p>
                                <p className="mt-2"><span className="font-semibold">GSTIN:</span> 19BNYPG7506F1ZJ</p>
                            </div>
                        </div>

                        {/* Billed To */}
                        <div>
                            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Billed To / Shipped To</h3>
                            <div className="text-sm text-gray-700 leading-snug">
                                <p className="font-bold text-black text-base mb-1">{order.shippingAddress?.fullName}</p>
                                <p>{order.shippingAddress?.address}</p>
                                {order.shippingAddress?.landmark && <p>{order.shippingAddress?.landmark}</p>}
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-semibold">{order.shippingAddress?.pincode}</span></p>
                                <p className="mt-2"><span className="font-semibold">Phone:</span> {order.shippingAddress?.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. ITEMS TABLE (FLEXIBLE HEIGHT) */}
                    <div className="flex-1">
                        <table className="w-full border-collapse mb-4">
                            <thead>
                                <tr className="border-b-2 border-gray-800 text-left">
                                    <th className="py-2 font-bold uppercase text-xs w-[5%] text-center">#</th>
                                    <th className="py-2 font-bold uppercase text-xs w-[55%]">Item Description</th>
                                    <th className="py-2 font-bold uppercase text-xs w-[10%] text-center">Qty</th>
                                    <th className="py-2 font-bold uppercase text-xs w-[15%] text-right">Price</th>
                                    <th className="py-2 font-bold uppercase text-xs w-[15%] text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm leading-tight">
                                {order.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-200 print:text-xs">
                                        <td className="py-2 text-center">{idx + 1}</td>
                                        <td className="py-2">
                                            <p className="font-bold text-black text-sm">{item.productName}</p>
                                            <p className="text-[11px] text-gray-500">Size: {item.size.label} {item.size.skuCode && `| SKU: ${item.size.skuCode}`}</p>
                                        </td>
                                        <td className="py-2 text-center font-medium">{item.quantity}</td>
                                        <td className="py-2 text-right text-gray-600">₹{formatCurrency(item.price)}</td>
                                        <td className="py-2 text-right font-bold text-black">₹{formatCurrency(item.itemTotal)}</td>
                                    </tr>
                                ))}

                                {/* Free Gifts */}
                                {order.freeGifts?.gifts?.map((gift, idx) => (
                                    <tr key={`gift-${idx}`} className="border-b border-gray-200 bg-gray-50 print:text-xs">
                                        <td className="py-2 text-center">-</td>
                                        <td className="py-2">
                                            <p className="font-semibold text-black">{gift.name}</p>
                                            <p className="text-[10px] text-green-700 font-bold uppercase tracking-wide">FREE GIFT</p>
                                        </td>
                                        <td className="py-2 text-center font-medium">{gift.quantity}</td>
                                        <td className="py-2 text-right text-gray-400 line-through text-[11px]">₹{formatCurrency(gift.originalPrice)}</td>
                                        <td className="py-2 text-right font-medium text-black">₹0</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. TOTALS & FOOTER SECTION (FIXED BOTTOM) */}
                    <div className="shrink-0 break-inside-avoid">
                        <div className="flex justify-end border-t-2 border-gray-800 pt-4">
                            <div className="w-[45%] space-y-1 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>₹{formatCurrency(order.pricing.productsSubtotal)}</span>
                                </div>
                                {order.pricing.couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span>Discount ({order.coupon?.code}):</span>
                                        <span>- ₹{formatCurrency(order.pricing.couponDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping Charges:</span>
                                    <span>{order.pricing.shippingCharges === 0 ? "Free" : `₹${formatCurrency(order.pricing.shippingCharges)}`}</span>
                                </div>
                                {order.pricing.codFee > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>COD Handling Fee:</span>
                                        <span>₹{formatCurrency(order.pricing.codFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 border-t border-gray-300 mt-2 text-xl font-extrabold text-black">
                                    <span>Grand Total:</span>
                                    <span>₹{formatCurrency(order.pricing.finalTotal)}</span>
                                </div>
                                <div className="text-right text-xs text-gray-500 mb-4">(Inclusive of all taxes)</div>
                            </div>
                        </div>

                        {/* Payment Info & Terms */}
                        <div className="border-t border-gray-300 pt-4 grid grid-cols-2 gap-8 text-xs">
                            <div>
                                <p className="font-bold uppercase mb-1">Payment Information:</p>
                                <p><span className="font-semibold">Method:</span> {order.payment.method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                                <p><span className="font-semibold">Status:</span> <span className="capitalize">{order.payment.status}</span></p>
                                {order.payment.method === 'COD' && order.payment.status !== 'completed' && (
                                    <p className="mt-2 text-sm font-bold border-2 border-black p-2 inline-block bg-gray-100">
                                        AMOUNT TO COLLECT: ₹{formatCurrency(order.payment.amountPaidOnDelivery)}
                                    </p>
                                )}
                            </div>
                            <div className="text-gray-500 text-right flex flex-col justify-end">
                                <p>Returns Policy: Items can be returned within 7 days of delivery subject to policy terms. Keep gifts intact.</p>
                                <p className="mt-1 font-semibold">This is a computer-generated invoice. No signature required.</p>
                            </div>
                        </div>

                        <div className="text-center text-[10px] text-gray-400 mt-6">
                            © {new Date().getFullYear()} Noctowls. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default OrderDetailsPage;