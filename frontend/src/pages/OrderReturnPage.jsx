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
      <div className="min-h-screen bg-black flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-20 pt-8">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={`/orders/${orderId}`}
            className="flex items-center gap-2 text-sm text-zinc-500 mb-4 hover:text-zinc-300 transition-colors w-fit"
          >
            <Icon icon="solar:arrow-left-linear" /> Cancel & Go Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">Request Return</h1>
          <p className="text-zinc-400 text-sm">
            Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          
          {/* 1. Reason Selection */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs text-zinc-400">1</span>
                Why are you returning this?
            </h2>
            <div className="space-y-3">
              {returnReasonsList.map((r) => (
                <label
                  key={r}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    reason === r
                      ? "bg-amber-950/20 border-amber-600/50 text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-3 text-sm font-medium">{r}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Textarea */}
            {reason === "Other" && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                  Please describe the issue
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us more about the problem..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none h-32 resize-none placeholder-zinc-600"
                />
              </div>
            )}
          </div>

          {/* 2. Refund Method */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs text-zinc-400">2</span>
                Refund Details
            </h2>

            {order.payment.method === "ONLINE" ? (
              <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <Icon icon="solar:card-check-bold" className="text-2xl text-green-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-green-500 text-sm">Original Payment Method</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Your refund of <span className="text-white font-medium">₹{order.pricing.finalTotal}</span> will be credited back to the original source (Card/UPI) within 5-7 business days after approval.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-6">
                    <Icon icon="solar:wallet-money-bold" className="text-2xl text-amber-500 shrink-0 mt-1" />
                    <div>
                    <h4 className="font-bold text-amber-500 text-sm">Bank Details Required</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                        Since this order was paid via Cash on Delivery, we need your bank details to transfer the refund amount.
                    </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1.5 ml-1">Account Holder Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={bankDetails.accountHolderName}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1.5 ml-1">Account Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234567890"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1.5 ml-1">IFSC Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SBIN0001234"
                                value={bankDetails.ifscCode}
                                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1.5 ml-1">Bank Name</label>
                            <input
                                type="text"
                                placeholder="e.g. SBI"
                                value={bankDetails.bankName}
                                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"
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
                className="w-full bg-white text-black font-bold uppercase py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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