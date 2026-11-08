import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { selectCart } from "../../store/features/user/cartSlice";

export const getGamifiedThresholdState = (totalQty = 0) => {
  if (totalQty <= 0) {
    return {
      progress: 0,
      message: "Add 1 Mat to unlock FREE Anime Keychain + 5 Stickers!",
      badgeText: "0 / 2 Mats",
      isMaxUnlocked: false,
    };
  }
  if (totalQty === 1) {
    return {
      progress: 50,
      message: "Add 1 more to unlock FREE Anime Figure (Worth ₹300)!",
      badgeText: "50% Bar",
      isMaxUnlocked: false,
    };
  }
  if (totalQty === 2) {
    return {
      progress: 100,
      message: "Unlocked! Add 1 more to get a Metal Katana (Worth ₹600)!",
      badgeText: "100% Bar",
      isMaxUnlocked: true,
    };
  }
  return {
    progress: 100,
    message:
      "Unlocked! You got a FREE Metal Katana (Worth ₹600) + All Tier Gifts!",
    badgeText: "Max Tier Unlocked",
    isMaxUnlocked: true,
  };
};

export const renderUnlockLineWithGreenFree = (totalQty = 0) => {
  if (totalQty <= 0) return null;

  if (totalQty === 1) {
    return (
      <span>
        Add 1 more to unlock{" "}
        <span className="text-green-600 font-extrabold uppercase">FREE</span>{" "}
        Anime Figure
      </span>
    );
  }
  if (totalQty === 2) {
    return (
      <span>
        Add 1 more to unlock{" "}
        <span className="text-green-600 font-extrabold uppercase">FREE</span>{" "}
        Anime Katana
      </span>
    );
  }
  return (
    <span>
      Unlocked{" "}
      <span className="text-green-600 font-extrabold uppercase">FREE</span>{" "}
      Anime Katana!
    </span>
  );
};

/**
 * Non-blocking inline slide-up offer bar rendered directly on top of the Action buttons on the Product Page.
 * Never freezes or overlays the user's screen.
 */
const CartDrawer = () => {
  const cart = useSelector(selectCart);

  const purchasedItems =
    cart?.items?.filter((item) => !item.isFreeGift) || [];
  const totalQuantity =
    cart?.summary?.totalQuantity ??
    purchasedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  if (totalQuantity <= 0) return null;

  const thresholdState = getGamifiedThresholdState(totalQuantity);

  return (
    <div className="w-full rounded-lg bg-zinc-950 text-white px-3.5 py-2.5 border border-zinc-800 shadow-md animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            icon="solar:gift-bold"
            className="text-green-400 text-base shrink-0"
          />
          <p className="text-[11px] sm:text-xs font-bold leading-snug text-zinc-100 truncate">
            {totalQuantity === 1 ? (
              <>
                Add 1 more to unlock{" "}
                <span className="text-green-400 font-extrabold uppercase">
                  FREE
                </span>{" "}
                Anime Figure (Worth ₹300)!
              </>
            ) : totalQuantity === 2 ? (
              <>
                Unlocked! Add 1 more to get a{" "}
                <span className="text-green-400 font-extrabold uppercase">
                  FREE
                </span>{" "}
                Metal Katana (Worth ₹600)!
              </>
            ) : (
              <>
                Unlocked! You got a{" "}
                <span className="text-green-400 font-extrabold uppercase">
                  FREE
                </span>{" "}
                Metal Katana (Worth ₹600)!
              </>
            )}
          </p>
        </div>

        <Link
          to="/bag"
          className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors shrink-0"
        >
          Bag ({totalQuantity}) →
        </Link>
      </div>

      {/* Dynamic 50% / 100% Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-green-500 transition-all duration-500 ease-out"
          style={{ width: `${thresholdState.progress}%` }}
        />
      </div>
    </div>
  );
};

export default CartDrawer;