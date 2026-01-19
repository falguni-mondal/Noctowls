import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";
import Logo from "../utils/logo/Logo";

// Import from your slice
import { 
  getOrderById,
  selectCurrentOrder, 
  selectOrderLoading, 
  selectOrderError 
} from "../store/features/user/orderSlice";

import Loader from "../utils/loader/Loader";

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  // Read from Redux Store
  const order = useSelector(selectCurrentOrder);
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);

  // 1. Fetch Order on Mount
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [dispatch, orderId]);

  // 2. Format Date Helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle Invoice Download (Triggers Print)
  const handleDownloadInvoice = async () => {
    try {
        window.print();
    } catch (err) {
      console.error(err);
      toast.error("Could not print invoice", toastControls);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader />
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-center px-4">
        <Icon icon="bxs:error-circle" className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Order Not Found</h2>
        <p className="text-zinc-400 mb-6">{typeof error === 'string' ? error : "We couldn't retrieve the order details."}</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition">
          Go Home
        </Link>
      </div>
    );
  }

  // Destructure for cleaner code in Screen View
  const { shippingAddress, payment, pricing, items, freeGifts, orderNumber, createdAt } = order;

  return (
    <>
      {/* =================================================================================
          1. SCREEN VIEW (Success Message) - Hidden when printing
         ================================================================================= */}
      <div className="min-h-screen bg-zinc-950 py-10 px-3 print:hidden">
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* SUCCESS HEADER */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 rounded-full mb-6 ring-1 ring-green-500/30">
              <Icon icon="ep:success-filled" className="text-5xl text-green-500 drop-shadow-md" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">Order Placed Successfully!</h1>
            <p className="text-zinc-400 mt-3 text-lg">Thank you for your purchase. Your order has been confirmed.</p>
            <div className="mt-6 inline-block bg-zinc-900 border border-zinc-800 px-5 py-2.5 rounded-lg text-sm text-zinc-300 shadow-sm">
              Order ID: <span className="text-white font-mono font-bold tracking-wider ml-1">#{orderNumber}</span>
            </div>
          </div>

          {/* ORDER DETAILS CARD */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl mb-8">
            
            {/* Header Section */}
            <div className="p-6 md:p-8 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center gap-2">
                <Icon icon="solar:bill-list-bold" className="text-blue-500" />
                Order Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping Address */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Shipping To</h3>
                  <div className="text-zinc-300 text-sm leading-relaxed">
                    <p className="font-semibold text-white text-base mb-1">{shippingAddress?.fullName}</p>
                    <p>{shippingAddress?.address}</p>
                    {shippingAddress?.landmark && <p className="text-zinc-400">{shippingAddress.landmark}</p>}
                    <p>{shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}</p>
                    <div className="flex items-center gap-2 mt-2 text-zinc-400">
                      <Icon icon="solar:phone-bold" className="text-zinc-500" />
                      <span>{shippingAddress?.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Payment Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded text-zinc-300">
                          {payment?.method === 'COD' 
                              ? <Icon icon="solar:money-bag-bold" /> 
                              : <Icon icon="solar:card-bold" />}
                      </div>
                      <div>
                          <p className="text-xs text-zinc-500 uppercase">Method</p>
                          <p className="text-sm font-medium text-white">
                            {payment?.method === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
                          </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${payment?.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {payment?.status === 'completed' 
                              ? <Icon icon="solar:verified-check-bold" /> 
                              : <Icon icon="solar:clock-circle-bold" />}
                      </div>
                      <div>
                          <p className="text-xs text-zinc-500 uppercase">Status</p>
                          <p className={`text-sm font-medium capitalize ${payment?.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                              {payment?.status}
                          </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded text-zinc-300">
                          <Icon icon="solar:calendar-bold" />
                      </div>
                      <div>
                          <p className="text-xs text-zinc-500 uppercase">Date</p>
                          <p className="text-sm font-medium text-white">{formatDate(createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER ITEMS */}
            <div className="p-3 md:p-6">
              <h3 className="text-xs font-bold text-zinc-500 mb-6 uppercase tracking-wider">Items Ordered</h3>
              <div className="space-y-6">
                {items?.map((item, index) => (
                  <div key={item._id || index} className="flex gap-4 sm:gap-6 items-start">
                    <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700">
                      <img 
                          src={item.productImage || "/placeholder.jpg"} 
                          alt={item.productName} 
                          className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-zinc-100 font-medium text-base mb-1 truncate pr-4">{item.productName}</h4>
                      <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-2">
                          {item.size && (
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">Size: {item.size.label}</span>
                          )}
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-100 font-semibold">₹{item.itemTotal?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FREE GIFTS SECTION */}
            {freeGifts?.eligible && freeGifts?.gifts?.length > 0 && (
              <div className="px-3 md:px-6 pb-8 pt-0">
                <h3 className="text-xs font-bold text-green-500 mb-4 uppercase tracking-wider flex items-center gap-1">
                  <Icon icon="solar:gift-bold" /> Free Gifts
                </h3>
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-4">
                    {freeGifts.gifts.map((gift, index) => (
                      <div key={index} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden shrink-0">
                            <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <p className="text-zinc-200 text-sm font-medium">{gift.name}</p>
                            <p className="text-zinc-400 text-xs">Qty: {gift.quantity}</p>
                        </div>
                        <span className="text-green-500 text-sm font-bold uppercase">Free</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TOTALS */}
            <div className="bg-zinc-950/30 p-3 md:p-6 border-t border-zinc-800">
              <div className="space-y-3">
                  <div className="flex justify-between text-sm text-zinc-400">
                      <span>Subtotal</span>
                      <span>₹{pricing?.productsSubtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {pricing?.couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                          <span>Coupon Discount</span>
                          <span>- ₹{pricing.couponDiscount.toLocaleString('en-IN')}</span>
                      </div>
                  )}
                  {pricing?.codFee > 0 && (
                      <div className="flex justify-between text-sm text-zinc-400">
                          <span>COD Fee</span>
                          <span>₹{pricing.codFee}</span>
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-end mt-6 pt-6 border-t border-zinc-800">
                <span className="text-lg font-medium text-zinc-100">Total Amount</span>
                <span className="text-2xl font-bold text-white">₹{pricing?.finalTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="px-6 py-3.5 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition text-center flex items-center justify-center gap-2 border border-zinc-700">
              <Icon icon="solar:cart-large-2-bold" /> Continue Shopping
            </Link>
            
            <button 
              onClick={handleDownloadInvoice}
              className="px-6 py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center flex items-center justify-center gap-2 border border-blue-700"
            >
              <Icon icon="solar:file-download-bold" /> Download Invoice
            </button>

            <Link to="/orders" className="px-6 py-3.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
              <Icon icon="solar:box-bold" /> View My Orders
            </Link>
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
                  <div className="noctowls-logo flex flex-col items-center">
                      <Logo width="w-[7rem]" />
                      <div className="text-xl font-bold tracking-tight mb-1">NOCTOWLS</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                      help.noctowls@gmail.com<br />
                      www.noctowls.com
                  </p>
              </div>
              <div className="text-right">
                  <h2 className="text-xl font-bold mb-1">TAX INVOICE</h2>
                  <p className="text-gray-600">Order ID: <span className="font-mono font-bold text-black">#{orderNumber}</span></p>
                  <p className="text-gray-600">Date: {new Date(createdAt).toLocaleDateString('en-IN')}</p>
                  {order.invoice?.invoiceNumber && <p className="text-gray-600">Invoice #: {order.invoice.invoiceNumber}</p>}
              </div>
          </div>

          {/* ADDRESSES */}
          <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                  <h3 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">Sold By</h3>
                  <div className="text-gray-700 leading-snug">
                      <p className="font-semibold">Noctowls</p>
                      <p>2nd Floor, Arushi Complex</p>
                      <p>Muchipara ITI, Aambagan, Duragapur-713212</p>
                      <p>Paschim Bardhamaan, West Bengal</p>
                      <p>GSTIN: 19BNYPG7506F1ZJ</p>
                  </div>
              </div>
              <div>
                  <h3 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">Billing & Shipping Address</h3>
                  <div className="text-gray-700 leading-snug">
                      <p className="font-semibold">{shippingAddress?.fullName}</p>
                      <p>{shippingAddress?.address}</p>
                      {shippingAddress?.landmark && <p>{shippingAddress.landmark}</p>}
                      <p>{shippingAddress?.city}, {shippingAddress?.state}</p>
                      <p>Pin: {shippingAddress?.pincode}</p>
                      <p>Phone: {shippingAddress?.phone}</p>
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
                  {items.map((item, idx) => (
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

                  {/* Free Gifts */}
                  {freeGifts?.gifts?.map((gift, idx) => (
                      <tr key={`gift-${idx}`} className="border-b border-gray-200 bg-gray-50">
                          <td className="py-3 text-center">-</td>
                          <td className="py-3">
                              <p className="font-semibold text-black">{gift.name}</p>
                              <p className="text-xs text-green-700 font-bold tracking-wide">FREE GIFT</p>
                          </td>
                          <td className="py-3 text-center font-medium">{gift.quantity}</td>
                          <td className="py-3 text-right text-gray-500 line-through">₹{gift.originalPrice}</td>
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
                      <span>₹{pricing.productsSubtotal}</span>
                  </div>
                  {pricing.couponDiscount > 0 && (
                      <div className="flex justify-between py-1 text-gray-600">
                          <span>Coupon Discount ({order.coupon?.code})</span>
                          <span>- ₹{pricing.couponDiscount}</span>
                      </div>
                  )}
                  <div className="flex justify-between py-1 text-gray-600">
                      <span>Shipping Charges</span>
                      <span>{pricing.shippingCharges === 0 ? "Free" : `₹${pricing.shippingCharges}`}</span>
                  </div>
                  {pricing.codFee > 0 && (
                      <div className="flex justify-between py-1 text-gray-600">
                          <span>COD Handling Fee</span>
                          <span>₹{pricing.codFee}</span>
                      </div>
                  )}
                  <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2 text-lg font-bold text-black">
                      <span>Grand Total</span>
                      <span>₹{pricing.finalTotal}</span>
                  </div>
              </div>
          </div>

          {/* FOOTER / TERMS */}
          <div className="border-t border-gray-300 pt-4">
              <p className="font-bold text-xs uppercase mb-1">Payment Method: {payment.method}</p>
              {payment.method === "COD" && (
                  <p className="text-sm font-bold border border-black inline-block px-2 py-1">
                      AMOUNT TO COLLECT: ₹{payment.amountPaidOnDelivery}
                  </p>
              )}
              <p className="text-[10px] text-gray-500 mt-4">
                  Returns Policy: Items can be returned within 7 days of delivery. Keep the gifts intact.<br />
                  This is a computer-generated invoice. No signature required.
              </p>
          </div>
      </div>
    </>
  );
};

export default OrderSuccessPage;