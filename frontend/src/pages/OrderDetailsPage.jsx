import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";

// Import Logo for Invoice
import Logo from "../utils/logo/Logo";

import {
  getOrderById,
  cancelOrder,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
  selectCancelOrderLoading,
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
  const [customReason, setCustomReason] = useState("");

  // Fetch Order
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [dispatch, orderId]);

  // --- ACTIONS ---
  const handleDownloadInvoice = async () => {
    try {
      setTimeout(() => window.print(), 500);
    } catch (err) {
      toast.error("Failed to download invoice", toastControls);
    }
  };

  const handleCancelOrder = async () => {
    const finalReason = cancelReason === "Other" ? customReason : cancelReason;

    if (!finalReason.trim()) {
      toast.warn("Please provide a reason for cancellation", toastControls);
      return;
    }

    if (cancelReason === "Other" && finalReason.trim().length < 5) {
        toast.warn("Please provide a bit more detail (min 5 chars)", toastControls);
        return;
    }

    const result = await dispatch(
      cancelOrder({ orderId, reason: finalReason }) 
    );

    if (cancelOrder.fulfilled.match(result)) {
      toast.success("Order cancelled successfully", toastControls);
      setShowCancelModal(false);
      setCancelReason(""); 
      setCustomReason(""); 
      
      dispatch(getOrderById(orderId)); 
      
    } else {
      toast.error(
        result.payload || "Failed to cancel order",
        toastControls
      );
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
      cancelled: -1,
      returned: 5,
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
  const isCancelled = order?.orderStatus === "cancelled";
  const isReturned = order?.orderStatus === "returned";
  const isReturnActive = order?.returnInfo?.status && order?.returnInfo?.status !== 'none';

  // --- RENDER HELPERS ---
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );

  if (error || !order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f4] text-center">
        <h2 className="text-2xl font-bold text-[#0f0f0f]">Order Not Found</h2>
        <div className="relative mt-4">
          <Link to="/orders" className="text-blue-600 font-bold hover:underline">
            Back to Orders
          </Link>
          <Link to="/orders" className="absolute inset-0 z-10 cursor-pointer opacity-0">Back to Orders</Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-[70vh] bg-[#f4f4f4] text-[#0f0f0f] pb-10 print:p-0 print:bg-white print:text-black">
      {/* ======================== SCREEN VIEW HEADER (Hidden on Print) ======================== */}
      <div className="bg-white border-b border-zinc-200 pt-14 pb-6 px-4 md:px-8 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-2 relative w-fit hover:text-red-600 transition-colors">
              <Icon icon="solar:arrow-left-linear" /> Back to Orders
              <Link to="/orders" className="absolute inset-0 z-10 cursor-pointer" />
            </div>
            <h1 className="text-2xl font-bold flex flex-col items-start lg:flex-row lg:items-center gap-3">
              Order #{order.orderNumber}
              <div className="order-status-container flex items-center gap-3">
                <span
                  className={`block h-fit w-fit text-sm font-bold px-3 py-1 rounded-full border ${
                    isCancelled
                      ? "bg-red-50 border-red-200 text-red-600"
                      : isReturned
                      ? "bg-purple-50 border-purple-200 text-purple-600"
                      : order.orderStatus === "delivered"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  {order.orderStatus}
                </span>
                {/* Return Status Badge */}
                {isReturnActive && !isReturned && (
                  <span className="block h-fit w-fit text-sm font-bold px-3 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-700">
                    Return {order.returnInfo.status}
                  </span>
                )}
              </div>
            </h1>
          </div>
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-[#0f0f0f] shadow-sm rounded-lg text-sm font-bold transition pointer-events-none"
            >
              <Icon icon="solar:file-download-bold" className="text-lg text-zinc-500" /> Download Invoice
            </button>
            <span onClick={handleDownloadInvoice} className="absolute inset-0 z-10 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* ======================== SCREEN VIEW CONTENT (Hidden on Print) ======================== */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6 print:hidden">
        {/* --- 1. TRACKER (VERTICAL STEPPER) --- */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
          {isCancelled ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <Icon
                icon="solar:close-circle-bold"
                className="text-2xl text-red-500 shrink-0 mt-0.5"
              />
              <div>
                <h3 className="font-bold text-red-700">
                  This order has been cancelled
                </h3>
                <p className="text-red-600/80 text-sm mt-1 font-medium">
                  Reason: {order.cancellation?.reason || "Cancelled by user"}
                </p>
                {order.cancellation?.refundStatus !== "not-applicable" && (
                  <p className="text-sm mt-2 font-bold text-red-800">
                    Refund Status:{" "}
                    <span className="capitalize">
                      {order.cancellation?.refundStatus}
                    </span>
                    {order.cancellation?.refundAmount > 0 &&
                      ` (₹${order.cancellation?.refundAmount})`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative pl-2">
              <div className="space-y-8 relative">
                <div className="absolute top-2 left-[19px] bottom-6 w-0.5 bg-zinc-200 z-0" />
                {steps.map((step, index) => {
                  const isCompleted = index + 1 <= currentStep;
                  const isCurrent = index + 1 === currentStep;

                  return (
                    <div key={index} className="flex gap-4 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-4 text-lg font-bold shrink-0 transition-all duration-300 ${
                          isCompleted
                            ? "bg-green-500 border-white text-white shadow-md"
                            : "bg-zinc-100 border-white text-zinc-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Icon icon="solar:check-read-bold" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`text-base font-bold ${
                            isCompleted || isCurrent
                              ? "text-[#0f0f0f]"
                              : "text-zinc-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.date ? (
                          <p className="text-sm text-zinc-500 mt-1 font-medium">
                            {formatDate(step.date)}
                          </p>
                        ) : (
                          isCurrent && (
                            <p className="text-xs font-bold text-blue-600 mt-1 animate-pulse">
                              In Progress...
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- RETURN TIMELINE (If Active) --- */}
        {isReturnActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
              <Icon icon="solar:history-bold" className="text-amber-600" /> Return Status
            </h3>
            <div className="relative pl-2 space-y-6">
              <div className="absolute top-2 left-[7px] bottom-2 w-0.5 bg-amber-200 z-0" />
              {order.returnInfo.timeline?.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shrink-0 border-2 border-white shadow-sm mt-1" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 capitalize">{event.status}</p>
                    <p className="text-xs text-amber-700 mt-0.5 font-medium">{formatDate(event.date)}</p>
                    {event.note && <p className="text-xs text-amber-600/80 mt-1 italic">"{event.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 2. ORDER ITEMS --- */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-600 uppercase tracking-wider text-xs">
            Items in this order
          </div>
          <div className="divide-y divide-zinc-100">
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                className="p-4 md:p-6 flex flex-row gap-4 items-center"
              >
                <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                  <Link to={`/products/${item.product}`} className="absolute inset-0 z-10 cursor-pointer" />
                </div>
                <div className="flex-1 relative">
                  <span className="text-base font-bold text-[#0f0f0f] hover:text-blue-600 transition pointer-events-none">
                    {item.productName}
                  </span>
                  <Link to={`/products/${item.product}`} className="absolute inset-0 z-10 cursor-pointer" />

                  <div className="flex flex-wrap gap-4 mt-2 text-sm font-medium text-zinc-500 relative z-20 pointer-events-none">
                    <span className="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50">
                      Size: <span className="font-bold text-[#0f0f0f] uppercase">{item.size?.label}</span>
                    </span>
                    <span className="py-0.5">Qty: <span className="font-bold text-[#0f0f0f]">{item.quantity}</span></span>
                  </div>
                </div>
                <div className="text-lg font-black text-[#0f0f0f] sm:text-right">
                  ₹{formatCurrency(item.priceWithGST || item.itemTotal)}
                </div>
              </div>
            ))}
          </div>
          {order.freeGifts?.gifts?.length > 0 && (
            <div className="p-4 bg-green-50 border-t border-zinc-200">
              <h4 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-1">
                <Icon icon="solar:gift-bold" /> Free Gifts Included
              </h4>
              <div className="space-y-3">
                {order.freeGifts.gifts.map((gift, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={gift.image}
                      className="w-10 h-10 rounded bg-white border border-green-200 object-cover shadow-sm"
                    />
                    <div>
                      <p className="text-sm text-green-900 font-bold">
                        {gift.name}
                      </p>
                      <p className="text-xs text-green-700 font-medium">
                        Qty: {gift.quantity}
                      </p>
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
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
            <h3 className="font-bold text-zinc-500 text-xs uppercase mb-4 tracking-wider">
              Shipping Details
            </h3>
            <div className="text-sm font-medium text-zinc-600 space-y-1">
              <p className="font-black text-[#0f0f0f] text-base mb-2">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.address}</p>
              {order.shippingAddress?.landmark && (
                <p>{order.shippingAddress?.landmark}</p>
              )}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                <span className="font-bold text-[#0f0f0f]">{order.shippingAddress?.pincode}</span>
              </p>
              <p className="mt-3 flex items-center gap-2 text-zinc-600 font-bold">
                <Icon icon="solar:phone-bold" className="text-zinc-400" /> {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Payment & Price Summary */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 md:col-span-2">
            <h3 className="font-bold text-zinc-500 text-xs uppercase mb-4 tracking-wider">
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-zinc-600">
                <span>Payment Method</span>
                <span className="font-bold text-[#0f0f0f]">
                  {order.payment?.method === "COD"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </span>
              </div>
              <div className="border-t border-zinc-100 my-2"></div>

              <div className="flex justify-between text-sm font-medium text-zinc-600">
                <span>Subtotal (Excl. Tax)</span>
                <span className="font-bold text-[#0f0f0f]">
                  ₹
                  {formatCurrency(
                    Math.round(order.subTotal) ||
                      Math.round(order.pricing?.productsSubtotal)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-zinc-600">
                <span>Tax (GST)</span>
                <span className="font-bold text-[#0f0f0f]">
                  ₹
                  {formatCurrency(
                    Math.round(order.totalGST) || Math.round(order.pricing?.tax)
                  )}
                </span>
              </div>

              {/* PHASE 00 DISCOUNT IN SCREEN VIEW */}
              {order.pricing?.phase00DiscountAmount > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>⚡ Phase-00 Discount</span>
                  <span>
                    - ₹{formatCurrency(order.pricing?.phase00DiscountAmount)}
                  </span>
                </div>
              )}

              {order.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Coupon Discount</span>
                  <span>
                    - ₹{formatCurrency(order.pricing?.couponDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-zinc-600">
                <span>Shipping</span>
                <span className="font-bold text-[#0f0f0f]">
                  {order.pricing?.shippingCharges === 0
                    ? "Free"
                    : `₹${formatCurrency(order.pricing?.shippingCharges)}`}
                </span>
              </div>
              {order.pricing?.codFee > 0 && (
                <div className="flex justify-between text-sm font-medium text-zinc-600">
                  <span>COD Fee</span>
                  <span className="font-bold text-[#0f0f0f]">₹{formatCurrency(order.pricing?.codFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-[#0f0f0f] mt-4 pt-4 border-t border-zinc-200">
                <span>Total Amount</span>
                <span>
                  ₹{formatCurrency(Math.round(order.pricing?.finalTotal))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- 4. ACTION BUTTONS (Cancel & Return) --- */}
        <div className="flex justify-end gap-3 pt-4 pb-10">
          {/* CANCEL BUTTON */}
          {!isCancelled &&
            order.orderStatus !== "delivered" &&
            order.orderStatus !== "shipped" &&
            !isReturnActive && (
              <div className="relative">
                <button
                  className="px-6 py-2.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-bold transition shadow-sm pointer-events-none"
                >
                  Cancel Order
                </button>
                <span onClick={() => setShowCancelModal(true)} className="absolute inset-0 z-10 cursor-pointer" />
              </div>
            )}

          {/* RETURN BUTTON */}
          {order.canBeReturned && !isReturnActive && (
            <div className="relative">
              <button
                className="px-6 py-2.5 bg-[#0f0f0f] text-white font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-zinc-800 transition shadow-md pointer-events-none"
              >
                Return Order
              </button>
              <Link to={`/orders/${orderId}/return`} className="absolute inset-0 z-10 cursor-pointer" />
            </div>
          )}
        </div>
      </div>

      {/* ======================== MODALS ======================== */}

      {/* --- CANCEL MODAL --- */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm print:hidden">
          <div onClick={() => setShowCancelModal(false)} className="absolute inset-0 cursor-pointer" />

          {/* Light Theme Modal Box */}
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative z-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">Cancel Order?</h3>
            <p className="text-zinc-500 font-medium text-sm mb-4">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Reason for Cancellation
            </label>
            <select
              value={cancelReason}
              onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (e.target.value !== "Other") setCustomReason(""); 
              }}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 text-sm font-medium text-[#0f0f0f] focus:border-red-500 outline-none mb-4 cursor-pointer shadow-sm"
            >
              <option value="">Select a reason...</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Found a better price">Found a better price</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Delay in shipping">Delay in shipping</option>
              <option value="Other">Other</option>
            </select>

            {cancelReason === "Other" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 mb-6">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Please specify reason
                    </label>
                    <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Tell us more about why you are cancelling..."
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 text-sm font-medium text-[#0f0f0f] focus:border-red-500 outline-none resize-none h-24 shadow-sm"
                    />
                </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <div className="relative">
                <button className="px-4 py-2 font-bold text-zinc-500 hover:text-[#0f0f0f] transition pointer-events-none">Back</button>
                <span onClick={() => setShowCancelModal(false)} className="absolute inset-0 z-10 cursor-pointer" />
              </div>
              <div className="relative">
                <button
                  disabled={!cancelReason || (cancelReason === "Other" && !customReason.trim()) || cancelLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white shadow-md rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pointer-events-none"
                >
                  {cancelLoading && <Icon icon="eos-icons:loading" />}
                  Confirm Cancel
                </button>
                <span onClick={handleCancelOrder} className="absolute inset-0 z-10 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      )}



      {/* INVOICE */}
      {/* ======================== FULL PAGE PRINT VIEW ======================== */}
      <div className="hidden print:block print:fixed print:inset-0 print:z-9999 print:bg-white print:py-4 print:px-8 font-sans text-black">
        <div className="h-full flex flex-col max-w-3xl mx-auto relative">

          {/* Cancelled Watermark Logic */}
          {isCancelled && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-999999 opacity-20 pointer-events-none transform -rotate-45">
              <span className="text-[150px] font-black text-red-600 border-12 border-red-600 px-12 py-4 rounded-3xl tracking-widest uppercase">
                CANCELLED
              </span>
            </div>
          )}

          {/* 1. INVOICE HEADER (Logo & Metadata) */}
          <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0">
                <Logo width="w-full h-full" color="text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight leading-none">
                  NOCTOWLS
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Premium Desk Accessories
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                TAX INVOICE
              </h2>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>
                  Order ID:{" "}
                  <span className="font-mono font-bold text-black">
                    #{order.orderNumber}
                  </span>
                </p>
                <p>
                  Date:{" "}
                  <span className="font-medium text-black">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
                {order.invoice?.invoiceNumber && (
                  <p>
                    Invoice #:{" "}
                    <span className="font-medium text-black">
                      {order.invoice.invoiceNumber}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. ADDRESS SECTION (Sold By + Shipped To) */}
          <div className="grid grid-cols-2 gap-10 mb-8 shrink-0 border-b border-gray-100 pb-6 relative z-10">
            <div>
              <h3 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider mb-2">
                Sold By
              </h3>
              <div className="text-xs text-gray-700 leading-relaxed">
                <p className="font-bold text-black text-sm">
                  Noctowls Properties
                </p>
                <p>1st Floor, Office Building</p>
                <p>Shri Bhumi Park, Bidhannagar</p>
                <p>Durgapur-713212, West Bengal, India</p>
                <p className="mt-1 font-semibold">GSTIN: 19BNYPG7506F1ZJ</p>
                <p>Email: help.noctowls@gmail.com</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider mb-2">
                Billed To / Shipped To
              </h3>
              <div className="text-xs text-gray-700 leading-relaxed">
                <p className="font-bold text-black text-sm">
                  {order.shippingAddress?.fullName}
                </p>
                <p>{order.shippingAddress?.address}</p>
                {order.shippingAddress?.landmark && (
                  <p>Landmark: {order.shippingAddress?.landmark}</p>
                )}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  -{" "}
                  <span className="font-semibold">
                    {order.shippingAddress?.pincode}
                  </span>
                </p>
                <p className="mt-1 font-semibold">
                  Phone: {order.shippingAddress?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* 3. TAXABLE ITEMS TABLE */}
          <div className="flex-1 relative z-10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800 text-left bg-gray-50">
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[5%] text-center">
                    #
                  </th>
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[40%]">
                    Description & HSN
                  </th>
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[10%] text-center">
                    Qty
                  </th>
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[15%] text-right">
                    Unit Price
                  </th>
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[12%] text-center">
                    GST %
                  </th>
                  <th className="py-2 px-1 font-bold uppercase text-[10px] w-[18%] text-right">
                    Total (Incl. Tax)
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="print:text-[11px]">
                    <td className="py-3 px-1 text-center text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-1">
                      <p className="font-bold text-black text-[12px]">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Size: {item.size?.label} | HSN: {item.hsnCode}
                      </p>
                    </td>
                    <td className="py-3 px-1 text-center font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-1 text-right text-gray-600">
                      ₹{formatCurrency(Math.round(item.price))}
                    </td>
                    <td className="py-3 px-1 text-center text-gray-600">
                      {item.gstRate}%
                    </td>
                    <td className="py-3 px-1 text-right font-bold text-black">
                      ₹
                      {formatCurrency(
                        Math.round(item.priceWithGST) ||
                          Math.round(item.itemTotal)
                      )}
                    </td>
                  </tr>
                ))}
                {order.freeGifts?.gifts?.map((gift, idx) => (
                  <tr key={`gift-${idx}`} className="bg-gray-50/50 italic">
                    <td className="py-2 px-1 text-center">-</td>
                    <td className="py-2 px-1">
                      <p className="font-semibold text-gray-700">
                        {gift.name} (Free Gift)
                      </p>
                    </td>
                    <td className="py-2 px-1 text-center">{gift.quantity}</td>
                    <td className="py-2 px-1 text-right line-through text-gray-700">
                      ₹{gift.originalPrice}
                    </td>
                    <td className="py-2 px-1 text-center">0%</td>
                    <td className="py-2 px-1 text-right line-through text-gray-700">
                      ₹{gift.originalPrice * gift.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. TOTALS & BREAKDOWN (Fixed Bottom) */}
          <div className="shrink-0 break-inside-avoid mt-6 border-t-2 border-gray-800 pt-6 relative z-10">
            <div className="flex justify-between items-start">
              {/* Left Side: Tax Breakdown */}
              <div className="w-[50%] bg-gray-50 p-4 rounded border border-gray-100">
                <h4 className="font-bold text-[10px] uppercase text-gray-500 mb-3 border-b border-gray-200 pb-1">
                  GST Breakdown
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  {order.items && order.items[0]?.taxType === "cgst_sgst" ? (
                    <>
                      <div className="flex justify-between">
                        <span>Central Tax (CGST):</span>
                        <span className="font-medium">
                          ₹{formatCurrency(Math.round(order.totalCGST))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>State Tax (SGST):</span>
                        <span className="font-medium">
                          ₹{formatCurrency(Math.round(order.totalSGST))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>Integrated Tax (IGST):</span>
                      <span className="font-medium">
                        ₹{formatCurrency(Math.round(order.totalIGST))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-black">
                    <span>Total GST Amount:</span>
                    <span>₹{formatCurrency(Math.round(order.totalGST))}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Grand Total */}
              <div className="w-[40%] space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Taxable Subtotal:</span>
                  <span>
                    ₹
                    {formatCurrency(
                      Math.round(order.subTotal) ||
                        Math.round(order.pricing?.productsSubtotal)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Shipping & Fees:</span>
                  <span>
                    ₹
                    {formatCurrency(
                      (order.pricing?.shippingCharges || 0) +
                        (order.pricing?.codFee || 0)
                    )}
                  </span>
                </div>

                {/* 🔥 NEW: PHASE 00 DISCOUNT IN PRINT INVOICE */}
                {order.pricing?.phase00DiscountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-700">
                    <span>Phase-00 Discount:</span>
                    <span>
                      - ₹{formatCurrency(order.pricing?.phase00DiscountAmount)}
                    </span>
                  </div>
                )}

                {order.pricing?.couponDiscount > 0 && (
                  <div className="flex justify-between text-xs text-green-700">
                    <span>Discount ({order.coupon?.code}):</span>
                    <span>
                      - ₹{formatCurrency(order.pricing?.couponDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2 text-xl font-black text-black">
                  <span>GRAND TOTAL:</span>
                  <span>
                    ₹{formatCurrency(Math.round(order.pricing?.finalTotal))}
                  </span>
                </div>
                <p className="text-[10px] text-right text-gray-400 font-medium">
                  Inclusive of all taxes
                </p>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-8 border-t border-gray-200 pt-4 grid grid-cols-2 gap-8 text-[10px]">
            <div>
              <p className="font-bold uppercase mb-1">
                Payment Method:{" "}
                <span className="text-gray-900">{order.payment?.method}</span>
              </p>
              {order.payment?.method === "COD" && (
                <p className="mt-2 text-xs font-black border-2 border-black p-2 inline-block bg-gray-50">
                  COLLECT AT DELIVERY: ₹
                  {formatCurrency(
                    Math.round(order.payment?.amountPaidOnDelivery)
                  )}
                </p>
              )}
            </div>
            <div className="text-gray-500 text-right">
              <p>
                Returns Policy: Items returnable within 7 days. Keep gifts
                intact.
              </p>
              <p className="mt-1 font-bold text-gray-800 underline uppercase tracking-tight">
                Computer Generated Invoice. No Signature Required.
              </p>
            </div>
          </div>

          <div className="text-center text-[9px] text-gray-400 mt-6 pb-2">
            © {new Date().getFullYear()} Noctowls | www.noctowls.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;