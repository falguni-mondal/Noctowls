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
        color: "text-zinc-600",
        bg: "bg-zinc-100 border border-zinc-200",
        icon: "mdi:cancel",
      };
    }

    if (endDate <= now) {
      return {
        text: "Expired",
        color: "text-orange-700",
        bg: "bg-orange-50 border border-orange-200",
        icon: "mdi:alert-circle",
      };
    }

    if (startDate > now) {
      return {
        text: "Upcoming",
        color: "text-blue-700",
        bg: "bg-blue-50 border border-blue-200",
        icon: "mdi:clock-outline",
      };
    }

    if (coupon.usageLimitType === "max-total" && coupon.maxTotalUsage) {
      if (coupon.totalUsedCount >= coupon.maxTotalUsage) {
        return {
          text: "Exhausted",
          color: "text-purple-700",
          bg: "bg-purple-50 border border-purple-200",
          icon: "mdi:counter",
        };
      }
    }

    return {
      text: "Active",
      color: "text-emerald-700",
      bg: "bg-emerald-50 border border-emerald-200",
      icon: "mdi:check-circle",
    };
  };

  const getStatusColor = (statusKey) => {
    const colors = {
      active: "text-emerald-700",
      upcoming: "text-blue-700",
      exhausted: "text-purple-700",
      expired: "text-orange-700",
      inactive: "text-zinc-600",
    };
    return colors[statusKey] || "text-zinc-600";
  };

  const getStatusBg = (statusKey) => {
    const backgrounds = {
      active: "bg-emerald-50 border border-emerald-200",
      upcoming: "bg-blue-50 border border-blue-200",
      exhausted: "bg-purple-50 border border-purple-200",
      expired: "bg-orange-50 border border-orange-200",
      inactive: "bg-zinc-100 border border-zinc-200",
    };
    return backgrounds[statusKey] || "bg-zinc-100 border border-zinc-200";
  };

  const getStatusIcon = (statusKey) => {
    const icons = {
      active: "mdi:check-circle",
      upcoming: "mdi:clock-outline",
      exhausted: "mdi:counter",
      expired: "mdi:alert-circle",
      inactive: "mdi:cancel",
    };
    return icons[statusKey] || "mdi:help-circle";
  };

  const statusInfo = getCouponStatus();

  // Format discount display
  const discountDisplay =
    coupon.discountType === "fixed"
      ? `₹${coupon.discountValue}`
      : `${coupon.discountValue}%`;

  // Get usage limit display
  const getUsageLimitDisplay = () => {
    switch (coupon.usageLimitType) {
      case "once-per-user":
        return {
          icon: "mdi:account-check",
          text: "Once per user",
          color: "text-blue-700",
        };
      case "multiple-per-user":
        return {
          icon: "mdi:account-multiple-check",
          text: `${coupon.perUserLimit}x per user`,
          color: "text-emerald-700",
        };
      case "max-total": {
        const remaining = coupon.maxTotalUsage - (coupon.totalUsedCount || 0);
        const percentage =
          ((coupon.totalUsedCount || 0) / coupon.maxTotalUsage) * 100;

        return {
          icon: "mdi:counter",
          text: `${coupon.totalUsedCount || 0}/${coupon.maxTotalUsage} used`,
          remaining: remaining,
          percentage: percentage.toFixed(0),
          color:
            percentage >= 90
              ? "text-red-700"
              : percentage >= 70
              ? "text-orange-700"
              : "text-purple-700",
        };
      }
      default:
        return {
          icon: "mdi:infinity",
          text: "Unlimited",
          color: "text-zinc-600",
        };
    }
  };

  const usageLimitInfo = getUsageLimitDisplay();

  // Get user/guest usage breakdown
  const getUsageBreakdown = () => {
    if (!coupon.userUsageHistory || coupon.userUsageHistory.length === 0) {
      return null;
    }

    const userCount = coupon.userUsageHistory.filter(
      (entry) => entry.user
    ).length;
    const guestCount = coupon.userUsageHistory.filter(
      (entry) => entry.deviceId
    ).length;

    return {
      users: userCount,
      guests: guestCount,
      total: userCount + guestCount,
    };
  };

  const usageBreakdown = getUsageBreakdown();

  // Format dates strictly as dd/mm/yyyy
  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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

  // Close menu on error too
  const handleToggleStatus = async () => {
    if (actionLoading) return;
    try {
      await dispatch(toggleCouponStatus(coupon._id)).unwrap();
      toast.success(
        `Coupon ${coupon.isActive ? "deactivated" : "activated"} successfully`,
        toastControls
      );
      setShowActions(false);
    } catch (error) {
      toast.error(
        error.message || "Failed to toggle coupon status",
        toastControls
      );
      setShowActions(false);
    }
  };

  const handleDelete = async () => {
    if (actionLoading) return;
    const confirmMessage = `Are you sure you want to delete coupon "${coupon.code}"?\n\n${
      coupon.totalUsedCount > 0
        ? `⚠️ This coupon has been used ${coupon.totalUsedCount} time${
            coupon.totalUsedCount > 1 ? "s" : ""
          }.\n\n`
        : ""
    }This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await dispatch(deleteCoupon(coupon._id)).unwrap();
        toast.success("Coupon deleted successfully", toastControls);
        setShowActions(false);
      } catch (error) {
        toast.error(error.message || "Failed to delete coupon", toastControls);
        setShowActions(false);
      }
    } else {
      setShowActions(false);
    }
  };

  return (
    <div className="admin-coupon-item bg-white rounded-lg p-4 relative transition-colors h-full">
      {/* Loading Overlay */}
      {actionLoading && (
        <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center z-10">
          <Icon icon="eos-icons:loading" className="text-3xl text-indigo-600" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Coupon Info */}
        <div className="flex-1 min-w-0">
          {/* Code & Status */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-lg tracking-wide text-zinc-900">
              {coupon.code}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color} font-semibold flex items-center gap-1`}
            >
              <Icon icon={statusInfo.icon} className="text-sm" />
              {statusInfo.text}
            </span>
            {expiryWarning && statusInfo.text === "Active" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold flex items-center gap-1">
                <Icon icon="mdi:clock-alert-outline" className="text-sm" />
                {expiryWarning}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
            {coupon.description}
          </p>

          {/* Discount Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Discount Amount */}
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
              <Icon icon="mdi:tag" className="text-lg text-indigo-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Discount</p>
                <p className="font-semibold text-indigo-700 truncate">
                  {discountDisplay} OFF
                </p>
              </div>
            </div>

            {/* Apply Type */}
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
              <Icon
                icon="mdi:application-outline"
                className="text-lg text-cyan-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Applies to</p>
                <p className="font-semibold text-cyan-700 text-xs capitalize truncate">
                  {coupon.applyType.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Limit Info */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2 mb-3">
            <Icon
              icon={usageLimitInfo.icon}
              className={`text-lg ${usageLimitInfo.color}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">Usage Limit</p>
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${usageLimitInfo.color} text-sm`}>
                  {usageLimitInfo.text}
                </p>
                {coupon.usageLimitType === "max-total" && (
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          parseFloat(usageLimitInfo.percentage) >= 90
                            ? "bg-red-500"
                            : parseFloat(usageLimitInfo.percentage) >= 70
                            ? "bg-orange-500"
                            : "bg-purple-500"
                        }`}
                        style={{ width: `${usageLimitInfo.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {coupon.usageLimitType === "max-total" &&
                usageLimitInfo.remaining !== undefined && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {usageLimitInfo.remaining}{" "}
                    {usageLimitInfo.remaining === 1 ? "use" : "uses"} remaining
                  </p>
                )}
            </div>
          </div>

          {/* User/Guest Usage Breakdown */}
          {usageBreakdown && usageBreakdown.total > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <Icon icon="mdi:account-group" className="text-sm text-zinc-500" />
              <div className="flex items-center gap-3">
                <span className="text-zinc-600">
                  <span className="font-semibold text-blue-700">
                    {usageBreakdown.users}
                  </span>{" "}
                  users
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-600">
                  <span className="font-semibold text-purple-700">
                    {usageBreakdown.guests}
                  </span>{" "}
                  guests
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
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-medium">
                  <Icon icon="mdi:currency-inr" />
                  <span>Min: ₹{coupon.minPurchaseAmount}</span>
                </div>
              )}
              {coupon.minItemsRequired > 0 && (
                <div className="flex items-center gap-1 text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded font-medium">
                  <Icon icon="mdi:shopping-outline" />
                  <span>Min: {coupon.minItemsRequired} items</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative shrink-0">
          <div className="relative w-8 h-8 group/menu">
            <div
              className={`w-full h-full flex items-center justify-center rounded transition-colors pointer-events-none text-zinc-600 ${
                showActions
                  ? "bg-zinc-100 text-zinc-900"
                  : "group-hover/menu:bg-zinc-100 group-hover/menu:text-zinc-900"
              }`}
            >
              <Icon icon="mdi:dots-vertical" className="text-xl" />
            </div>
            <span
              onClick={() => !actionLoading && setShowActions(!showActions)}
              className={`absolute inset-0 z-10 cursor-pointer rounded ${
                actionLoading ? "cursor-not-allowed" : ""
              }`}
            />
          </div>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
                aria-hidden="true"
              />

              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden text-zinc-800">
                {/* Edit Item */}
                <div className="relative group/item">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm group-hover/item:bg-zinc-50 transition pointer-events-none">
                    <Icon icon="mdi:pencil" className="text-lg text-blue-600" />
                    <span>Edit Coupon</span>
                  </div>
                  <Link
                    to={`/admin/coupons/update/${coupon._id}`}
                    className="absolute inset-0 z-20"
                    onClick={() => setShowActions(false)}
                  />
                </div>

                {/* Toggle Status Item */}
                <div className="relative group/item border-t border-zinc-100">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm group-hover/item:bg-zinc-50 transition pointer-events-none">
                    <Icon
                      icon={
                        coupon.isActive ? "mdi:pause-circle" : "mdi:play-circle"
                      }
                      className={`text-lg ${
                        coupon.isActive ? "text-orange-600" : "text-emerald-600"
                      }`}
                    />
                    <span>{coupon.isActive ? "Deactivate" : "Activate"}</span>
                  </div>
                  {!actionLoading && (
                    <span
                      onClick={handleToggleStatus}
                      className="absolute inset-0 z-20 cursor-pointer"
                    />
                  )}
                </div>

                {/* Delete Item */}
                <div className="relative group/item border-t border-zinc-100">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 group-hover/item:bg-red-50 transition pointer-events-none">
                    <Icon icon="mdi:delete" className="text-lg" />
                    <span>Delete Coupon</span>
                  </div>
                  {!actionLoading && (
                    <span
                      onClick={handleDelete}
                      className="absolute inset-0 z-20 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCouponItem;