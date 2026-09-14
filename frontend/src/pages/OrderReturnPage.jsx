import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import toastControls from "../utils/global/toastControls";
import Loader from "../utils/loader/Loader";

import {
  getOrderById,
  requestReturn,
  selectCurrentOrder,
  selectOrderLoading,
  selectReturnRequestLoading,
} from "../store/features/user/orderSlice";

const OrderReturnPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux State
  const order = useSelector(selectCurrentOrder);
  const loading = useSelector(selectOrderLoading);
  const submitLoading = useSelector(selectReturnRequestLoading);

  // Local State
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const returnReasonsList = [
    "Received wrong item",
    "Product damaged or defective",
    "Size does not fit",
    "Quality not as expected",
    "Item missing from package",
    "Other",
  ];

  // 1. Fetch Order Data
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [dispatch, orderId]);

  // 2. Validate Eligibility (Redirect if not eligible)
  useEffect(() => {
    if (!loading && order) {
      if (order.orderStatus !== "delivered") {
        toast.error("Only delivered orders can be returned.", toastControls);
        navigate(`/orders/${orderId}`);
      } else if (order.returnInfo?.status && order.returnInfo.status !== "none") {
        toast.info("A return request is already active for this order.", toastControls);
        navigate(`/orders/${orderId}`);
      }
    }
  }, [order, loading, navigate, orderId]);

  // --- HANDLERS ---

  const handleSubmit = async () => {
    // 1. Validate Reason
    const finalReason = reason === "Other" ? customReason : reason;
    
    if (!reason) {
      return toast.warn("Please select a reason for return", toastControls);
    }
    if (reason === "Other" && (!customReason || customReason.length < 10)) {
        return toast.warn("Please describe the issue in detail (min 10 chars)", toastControls);
    }

    // 2. Validate Bank Details (Only if COD)
    let payloadBankDetails = null;
    if (order.payment.method === "COD") {
      if (
        !bankDetails.accountHolderName ||
        !bankDetails.accountNumber ||
        !bankDetails.ifscCode ||
        !bankDetails.bankName
      ) {
        return toast.warn("Please complete all bank details for your refund", toastControls);
      }
      payloadBankDetails = bankDetails;
    }

    // 3. Dispatch Action
    const result = await dispatch(
      requestReturn({
        orderId,
        returnData: {
          type: "refund", 
          reason: finalReason,
          bankDetails: payloadBankDetails,
        },
      })
    );

    if (requestReturn.fulfilled.match(result)) {
      toast.success("Return request submitted successfully", toastControls);
      navigate(`/orders/${orderId}`);
    } else {
      toast.error(result.payload || "Failed to submit request", toastControls);
    }
  };

  // --- RENDER ---

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    // Light theme main wrapper
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f0f0f] pb-20 pt-8 font-sans">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={`/orders/${orderId}`}
            className="flex items-center gap-2 text-sm text-zinc-500 font-bold mb-4 hover:text-red-600 transition-colors w-fit"
          >
            <Icon icon="solar:arrow-left-linear" /> Cancel & Go Back
          </Link>
          <h1 className="text-3xl font-black tracking-tight mb-2">Request Return</h1>
          <p className="text-zinc-500 font-medium text-sm">
            Order <span className="text-[#0f0f0f] font-bold">#{order.orderNumber}</span> • Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          
          {/* 1. Reason Selection */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0f0f0f] text-sm font-bold text-white shadow-sm">1</span>
                Why are you returning this?
            </h2>
            <div className="space-y-3">
              {returnReasonsList.map((r) => (
                <label
                  key={r}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    reason === r
                      // Light theme active selection
                      ? "bg-red-50 border-red-500 text-red-900 shadow-sm"
                      // Light theme inactive selection
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    // Tailwind forms plugin takes care of accent colors usually, but explicit class helps
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-zinc-300 bg-white"
                  />
                  <span className={`ml-3 text-sm ${reason === r ? 'font-bold' : 'font-medium'}`}>{r}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Textarea */}
            {reason === "Other" && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                  Please describe the issue
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us more about the problem..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-4 text-sm font-medium text-[#0f0f0f] focus:bg-white focus:border-red-500 outline-none h-32 resize-none placeholder-zinc-400 shadow-sm transition-colors"
                />
              </div>
            )}
          </div>

          {/* 2. Refund Method */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0f0f0f] text-sm font-bold text-white shadow-sm">2</span>
                Refund Details
            </h2>

            {order.payment.method === "ONLINE" ? (
              <div className="flex items-start gap-4 p-5 bg-green-50 border border-green-200 rounded-xl">
                <Icon icon="solar:card-check-bold" className="text-2xl text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Original Payment Method</h4>
                  <p className="text-sm font-medium text-green-700/80 mt-1.5 leading-relaxed">
                    Your refund of <span className="text-green-900 font-bold">₹{order.pricing.finalTotal}</span> will be credited back to the original source (Card/UPI) within 5-7 business days after approval.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <Icon icon="solar:wallet-money-bold" className="text-2xl text-amber-500 shrink-0 mt-0.5" />
                    <div>
                    <h4 className="font-bold text-amber-800 text-sm">Bank Details Required</h4>
                    <p className="text-sm font-medium text-amber-700/80 mt-1.5 leading-relaxed">
                        Since this order was paid via Cash on Delivery, we need your bank details to transfer the refund amount.
                    </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Account Holder Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={bankDetails.accountHolderName}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-sm font-bold text-[#0f0f0f] focus:bg-white focus:border-red-500 outline-none shadow-sm transition-colors placeholder-zinc-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Account Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234567890"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-sm font-bold text-[#0f0f0f] focus:bg-white focus:border-red-500 outline-none shadow-sm transition-colors placeholder-zinc-400"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">IFSC Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SBIN0001234"
                                value={bankDetails.ifscCode}
                                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-sm font-bold text-[#0f0f0f] focus:bg-white focus:border-red-500 outline-none shadow-sm transition-colors placeholder-zinc-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Bank Name</label>
                            <input
                                type="text"
                                placeholder="e.g. SBI"
                                value={bankDetails.bankName}
                                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-sm font-bold text-[#0f0f0f] focus:bg-white focus:border-red-500 outline-none shadow-sm transition-colors placeholder-zinc-400"
                            />
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button (FIXED) */}
          <div className="pt-4">
            <button
                onClick={handleSubmit}
                disabled={submitLoading || !reason}
                className="w-full bg-[#0f0f0f] text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-black/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {submitLoading && <Icon icon="eos-icons:loading" className="text-lg" />}
                Submit Return Request
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderReturnPage;