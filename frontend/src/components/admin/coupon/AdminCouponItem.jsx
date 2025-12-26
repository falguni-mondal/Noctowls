import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import {
  deleteCoupon,
  toggleCouponStatus,
  selectActionLoading,
} from "../../../store/features/admin/adminCouponSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const AdminCouponItem = ({ coupon, status }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectActionLoading);
  const [showActions, setShowActions] = useState(false);

  const now = new Date();
  const startDate = new Date(coupon.startsAt);
  const endDate = new Date(coupon.expiresAt);

  // Helper function to get coupon status
  const getCouponStatus = () => {
    if (status) {
      return {
        text: status.charAt(0).toUpperCase() + status.slice(1),
        color: getStatusColor(status),
        bg: getStatusBg(status),
        icon: getStatusIcon(status),
      };
    }

    if (!coupon.isActive) {
      return {
        text: "Inactive",
        color: "text-zinc-500",
        bg: "bg-zinc-900/50",
        icon: "mdi:cancel",
      };
    }

    if (endDate <= now) {
      return {
        text: "Expired",
        color: "text-orange-400",
        bg: "bg-orange-900/30",
        icon: "mdi:alert-circle",
      };
    }

    if (startDate > now) {
      return {
        text: "Upcoming",
        color: "text-blue-400",
        bg: "bg-blue-900/30",
        icon: "mdi:clock-outline",
      };
    }

    if (coupon.usageLimitType === 'max-total' && coupon.maxTotalUsage) {
      if (coupon.totalUsedCount >= coupon.maxTotalUsage) {
        return {
          text: "Exhausted",
          color: "text-purple-400",
          bg: "bg-purple-900/30",
          icon: "mdi:counter",
        };
      }
    }

    return {
      text: "Active",
      color: "text-green-400",
      bg: "bg-green-900/30",
      icon: "mdi:check-circle",
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "text-green-400",
      upcoming: "text-blue-400",
      exhausted: "text-purple-400",
      expired: "text-orange-400",
      inactive: "text-zinc-500",
    };
    return colors[status] || "text-zinc-500";
  };

  const getStatusBg = (status) => {
    const backgrounds = {
      active: "bg-green-900/30",
      upcoming: "bg-blue-900/30",
      exhausted: "bg-purple-900/30",
      expired: "bg-orange-900/30",
      inactive: "bg-zinc-900/50",
    };
    return backgrounds[status] || "bg-zinc-900/50";
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: "mdi:check-circle",
      upcoming: "mdi:clock-outline",
      exhausted: "mdi:counter",
      expired: "mdi:alert-circle",
      inactive: "mdi:cancel",
    };
    return icons[status] || "mdi:help-circle";
  };

  const statusInfo = getCouponStatus();

  // Format discount display
  const discountDisplay = coupon.discountType === "fixed"
    ? `₹${coupon.discountValue}`
    : `${coupon.discountValue}%`;

  // Get usage limit display
  const getUsageLimitDisplay = () => {
    switch (coupon.usageLimitType) {
      case 'once-per-user':
        return {
          icon: "mdi:account-check",
          text: "Once per user",
          color: "text-blue-400",
        };
      case 'multiple-per-user':
        return {
          icon: "mdi:account-multiple-check",
          text: `${coupon.perUserLimit}x per user`,
          color: "text-green-400",
        };
      case 'max-total':
        const remaining = coupon.maxTotalUsage - (coupon.totalUsedCount || 0);
        const percentage = ((coupon.totalUsedCount || 0) / coupon.maxTotalUsage) * 100;
        
        return {
          icon: "mdi:counter",
          text: `${coupon.totalUsedCount || 0}/${coupon.maxTotalUsage} used`,
          remaining: remaining,
          percentage: percentage.toFixed(0),
          color: percentage >= 90 ? "text-red-400" : percentage >= 70 ? "text-orange-400" : "text-purple-400",
        };
      default:
        return {
          icon: "mdi:infinity",
          text: "Unlimited",
          color: "text-zinc-500",
        };
    }
  };

  const usageLimitInfo = getUsageLimitDisplay();

  // ✅ NEW: Get user/guest usage breakdown
  const getUsageBreakdown = () => {
    if (!coupon.userUsageHistory || coupon.userUsageHistory.length === 0) {
      return null;
    }

    const userCount = coupon.userUsageHistory.filter(entry => entry.user).length;
    const guestCount = coupon.userUsageHistory.filter(entry => entry.deviceId).length;

    return {
      users: userCount,
      guests: guestCount,
      total: userCount + guestCount,
    };
  };

  const usageBreakdown = getUsageBreakdown();

  // Format dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    const diff = endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return null;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    if (days <= 7) return `${days} days left`;
    return null;
  };

  const expiryWarning = getDaysUntilExpiry();

  // ✅ UPDATED: Close menu on error too
  const handleToggleStatus = async () => {
    try {
      await dispatch(toggleCouponStatus(coupon._id)).unwrap();
      toast.success(
        `Coupon ${coupon.isActive ? "deactivated" : "activated"} successfully`,
        toastControls
      );
      setShowActions(false);
    } catch (error) {
      toast.error(error.message || "Failed to toggle coupon status", toastControls);
      setShowActions(false); // ✅ Close menu on error too
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete coupon "${coupon.code}"?\n\n${
      coupon.totalUsedCount > 0 
        ? `⚠️ This coupon has been used ${coupon.totalUsedCount} time${coupon.totalUsedCount > 1 ? 's' : ''}.\n\n` 
        : ''
    }This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await dispatch(deleteCoupon(coupon._id)).unwrap();
        toast.success("Coupon deleted successfully", toastControls);
        setShowActions(false);
      } catch (error) {
        toast.error(error.message || "Failed to delete coupon", toastControls);
        setShowActions(false); // ✅ Close menu on error
      }
    } else {
      setShowActions(false); // ✅ Close menu if cancelled
    }
  };

  return (
    <div className="admin-coupon-item bg-zinc-900 border border-zinc-800 rounded-lg p-4 relative hover:border-zinc-700 transition-colors">
      {/* Loading Overlay */}
      {actionLoading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
          <Icon icon="eos-icons:loading" className="text-3xl text-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Coupon Info */}
        <div className="flex-1 min-w-0">
          {/* Code & Status */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-lg tracking-wide">{coupon.code}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${statusInfo.bg} ${statusInfo.color} font-medium flex items-center gap-1`}
            >
              <Icon icon={statusInfo.icon} className="text-sm" />
              {statusInfo.text}
            </span>
            {expiryWarning && statusInfo.text === "Active" && (
              <span className="text-xs px-2 py-1 rounded bg-orange-900/30 text-orange-400 font-medium flex items-center gap-1">
                <Icon icon="mdi:clock-alert-outline" className="text-sm" />
                {expiryWarning}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
            {coupon.description}
          </p>

          {/* Discount Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Discount Amount */}
            <div className="flex items-center gap-2 bg-zinc-950/50 rounded p-2">
              <Icon icon="mdi:tag" className="text-lg text-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Discount</p>
                <p className="font-semibold text-indigo-400 truncate">
                  {discountDisplay} OFF
                </p>
              </div>
            </div>

            {/* Apply Type */}
            <div className="flex items-center gap-2 bg-zinc-950/50 rounded p-2">
              <Icon icon="mdi:application-outline" className="text-lg text-cyan-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Applies to</p>
                <p className="font-semibold text-cyan-400 text-xs capitalize truncate">
                  {coupon.applyType.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Limit Info */}
          <div className="flex items-center gap-2 bg-zinc-950/50 rounded p-2 mb-3">
            <Icon icon={usageLimitInfo.icon} className={`text-lg ${usageLimitInfo.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">Usage Limit</p>
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${usageLimitInfo.color} text-sm`}>
                  {usageLimitInfo.text}
                </p>
                {coupon.usageLimitType === 'max-total' && (
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          parseFloat(usageLimitInfo.percentage) >= 90
                            ? 'bg-red-500'
                            : parseFloat(usageLimitInfo.percentage) >= 70
                            ? 'bg-orange-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${usageLimitInfo.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {coupon.usageLimitType === 'max-total' && usageLimitInfo.remaining !== undefined && (
                <p className="text-xs text-zinc-600 mt-0.5">
                  {usageLimitInfo.remaining} {usageLimitInfo.remaining === 1 ? 'use' : 'uses'} remaining
                </p>
              )}
            </div>
          </div>

          {/* User/Guest Usage Breakdown */}
          {usageBreakdown && usageBreakdown.total > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <Icon icon="mdi:account-group" className="text-sm text-zinc-500" />
              <div className="flex items-center gap-3">
                <span className="text-zinc-400">
                  <span className="font-medium text-blue-400">{usageBreakdown.users}</span> users
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">
                  <span className="font-medium text-purple-400">{usageBreakdown.guests}</span> guests
                </span>
              </div>
            </div>
          )}

          {/* Validity Period */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Icon icon="mdi:calendar-range" className="text-base" />
            <span>
              {formatDate(coupon.startsAt)} → {formatDate(coupon.expiresAt)}
            </span>
          </div>

          {/* Additional Info (if applicable) */}
          {(coupon.minPurchaseAmount > 0 || coupon.minItemsRequired > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {coupon.minPurchaseAmount > 0 && (
                <div className="flex items-center gap-1 text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                  <Icon icon="mdi:currency-inr" />
                  <span>Min: ₹{coupon.minPurchaseAmount}</span>
                </div>
              )}
              {coupon.minItemsRequired > 0 && (
                <div className="flex items-center gap-1 text-sky-400 bg-sky-900/20 px-2 py-1 rounded">
                  <Icon icon="mdi:shopping-outline" />
                  <span>Min: {coupon.minItemsRequired} items</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={actionLoading}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Coupon actions menu"
            aria-expanded={showActions}
          >
            <Icon icon="mdi:dots-vertical" className="text-xl" />
          </button>

          {showActions && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
                aria-hidden="true"
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden">
                <Link
                  to={`/admin/coupons/update/${coupon._id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-800 transition"
                  onClick={() => setShowActions(false)}
                  aria-label={`Edit ${coupon.code}`}
                >
                  <Icon icon="mdi:pencil" className="text-lg text-blue-400" />
                  <span>Edit Coupon</span>
                </Link>
                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading} // ✅ Disable while loading
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-800 transition border-t border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`${coupon.isActive ? 'Deactivate' : 'Activate'} ${coupon.code}`}
                >
                  <Icon
                    icon={coupon.isActive ? "mdi:pause-circle" : "mdi:play-circle"}
                    className={`text-lg ${coupon.isActive ? 'text-orange-400' : 'text-green-400'}`}
                  />
                  <span>{coupon.isActive ? "Deactivate" : "Activate"}</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition border-t border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Delete ${coupon.code}`}
                >
                  <Icon icon="mdi:delete" className="text-lg" />
                  <span>Delete Coupon</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCouponItem;