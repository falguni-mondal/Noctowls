import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import toastControls from "../../utils/global/toastControls";
import userApi from "../../configs/userAxiosConfig";
import { optimizeImage } from "../../utils/helpers/imageOptimizer";
import { trackEvent } from "../../utils/pixel/pixel";
import {
  addToCart,
  closeQuickAddDrawer,
  selectActionLoading,
  selectCart,
  selectQuickAddProduct,
} from "../../store/features/user/cartSlice";

const SIZE_DIMENSIONS_MAP = {
  l: "600mm × 300mm | 3mm",
  xl: "800mm × 330mm | 3mm",
  xxl: "900mm × 400mm | 3mm",
  onesize: "Standard Size",
  miniature: "Miniature",
  "kids-short": "Kids Short",
  "full-length": "Full Length",
};

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
 * 50-60% Screen-Coverage Bottom Slide-Up Quick-Add Drawer for Product Cards.
 * Allows selecting size and quantity while dynamically showing price.
 * Closes when clicking outside on the backdrop or clicking the cross button.
 */
export const QuickAddDrawer = () => {
  const dispatch = useDispatch();
  const quickAddProduct = useSelector(selectQuickAddProduct);
  const cartActionLoading = useSelector(selectActionLoading);
  const isAdmin = useSelector((state) => state.adminAuth.admin);

  const [fetchedSizes, setFetchedSizes] = useState(null);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [selectedSize, setSelectedSize] = useState("l");
  const [quantity, setQuantity] = useState(1);

  const productId = quickAddProduct?.id || quickAddProduct?._id;

  // Use sizes from product card if available, or fetch product detail if missing
  const availableSizesList =
    Array.isArray(quickAddProduct?.sizes) && quickAddProduct.sizes.length > 0
      ? quickAddProduct.sizes
      : fetchedSizes || [];

  useEffect(() => {
    if (!quickAddProduct) {
      setFetchedSizes(null);
      setQuantity(1);
      return;
    }

    const initialDefault =
      quickAddProduct.defaultSize || quickAddProduct.primarySize || "l";
    setSelectedSize(String(initialDefault).toLowerCase());
    setQuantity(1);

    if (
      !Array.isArray(quickAddProduct.sizes) ||
      quickAddProduct.sizes.length === 0
    ) {
      let active = true;
      setLoadingSizes(true);
      userApi
        .get(`/products/${productId}`)
        .then((res) => {
          if (!active) return;
          const prodSizes = res.data?.product?.sizes || [];
          setFetchedSizes(prodSizes);
          const firstInStock = prodSizes.find((s) => (s.stock ?? 0) > 0);
          if (firstInStock) {
            setSelectedSize(String(firstInStock.value).toLowerCase());
          }
        })
        .catch(() => {
          if (!active) return;
          setFetchedSizes([]);
        })
        .finally(() => {
          if (active) setLoadingSizes(false);
        });

      return () => {
        active = false;
      };
    } else {
      const firstInStock = quickAddProduct.sizes.find(
        (s) => (s.stock ?? 0) > 0
      );
      if (firstInStock) {
        setSelectedSize(String(firstInStock.value).toLowerCase());
      }
    }
  }, [quickAddProduct, productId]);

  // Lock body scroll while drawer is open & close on Escape
  useEffect(() => {
    if (!quickAddProduct) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(closeQuickAddDrawer());
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickAddProduct, dispatch]);

  if (!quickAddProduct) return null;

  const currentSizeObj =
    availableSizesList.find(
      (s) => String(s.value).toLowerCase() === String(selectedSize).toLowerCase()
    ) || availableSizesList[0];

  const unitPrice =
    currentSizeObj?.numPrice ??
    quickAddProduct.numPrice ??
    (Number(String(quickAddProduct.price || "0").replace(/,/g, "")) || 0);

  const origPrice =
    currentSizeObj?.originalPrice ??
    (Number(String(quickAddProduct.originalPrice || "0").replace(/,/g, "")) ||
      unitPrice);

  const discountPct =
    currentSizeObj?.discount ??
    (origPrice > unitPrice
      ? Math.round(((origPrice - unitPrice) / origPrice) * 100)
      : 0);

  const maxStock =
    currentSizeObj?.stock !== undefined ? Number(currentSizeObj.stock) : 99;
  const isSelectedSizeInStock = maxStock > 0;

  const totalPrice = unitPrice * quantity;
  const thumbUrl = optimizeImage(quickAddProduct.images?.[0]?.url || "", {
    width: 240,
    quality: 80,
  });

  const handleSizeSelect = (val) => {
    setSelectedSize(String(val).toLowerCase());
    setQuantity(1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleIncrement = () => {
    if (quantity < maxStock) {
      setQuantity((q) => q + 1);
    } else {
      toast.info(`Maximum available stock (${maxStock}) reached`, toastControls);
    }
  };

  const handleConfirmAddToCart = async () => {
    if (!isSelectedSizeInStock || cartActionLoading || isAdmin) return;

    try {
      await dispatch(
        addToCart({
          productId,
          sizeValue: selectedSize,
          quantity,
        })
      ).unwrap();

      trackEvent("AddToCart", {
        content_name: quickAddProduct.name,
        content_ids: [productId],
        content_type: "product",
        value: totalPrice,
        currency: "INR",
        contents: [{ id: productId, quantity }],
      });

      dispatch(closeQuickAddDrawer());
    } catch (error) {
      toast.error(error || "Failed to add item to cart", toastControls);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-200"
      onClick={() => dispatch(closeQuickAddDrawer())}
    >
      {/* 50-60% Screen Coverage Slide-Up Drawer */}
      <div
        className="w-full max-w-xl bg-white text-[#0f0f0f] rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.25)] border-t border-zinc-200 h-[56vh] min-h-[390px] max-h-[62vh] flex flex-col justify-between p-4 sm:p-6 relative overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle & Cross Button */}
        <div>
          <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto mb-3" />

          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-zinc-200">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                <img
                  src={thumbUrl}
                  alt={quickAddProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
                  {quickAddProduct.category || "Deskmat"}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#0f0f0f] truncate">
                  {quickAddProduct.name}
                </h3>

                {/* Dynamic Price Display */}
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <span className="text-base sm:text-lg font-black text-[#0f0f0f]">
                    ₹{unitPrice.toLocaleString("en-IN")}
                  </span>
                  {origPrice > unitPrice && (
                    <span className="text-xs sm:text-sm font-medium text-zinc-400 line-through">
                      ₹{origPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cross Button */}
            <button
              type="button"
              onClick={() => dispatch(closeQuickAddDrawer())}
              aria-label="Close drawer"
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-[#0f0f0f] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Middle: Size Selection & Quantity Selection */}
        <div className="my-auto py-3 space-y-4">
          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Select Size
              </span>
              <span className="text-[11px] font-semibold text-zinc-500">
                {SIZE_DIMENSIONS_MAP[selectedSize] || ""}
              </span>
            </div>

            {loadingSizes ? (
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 rounded-xl bg-zinc-100 animate-pulse border border-zinc-200"
                  />
                ))}
              </div>
            ) : availableSizesList.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {availableSizesList.map((s) => {
                  const val = String(s.value).toLowerCase();
                  const isSelected = val === selectedSize;
                  const sStock = Number(s.stock ?? 0);
                  const outOfStock = sStock <= 0;
                  const sPrice = s.numPrice ?? unitPrice;

                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => handleSizeSelect(val)}
                      className={`py-2 px-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        outOfStock
                          ? "bg-zinc-100 border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-[#0f0f0f] border-[#0f0f0f] text-white shadow-md"
                          : "bg-white border-zinc-200 text-[#0f0f0f] hover:border-zinc-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs sm:text-sm font-extrabold uppercase">
                          {val}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-green-400" : "text-zinc-700"
                          }`}
                        >
                          ₹{Number(sPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span
                        className={`text-[9.5px] sm:text-[10px] font-medium truncate mt-0.5 ${
                          isSelected ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        {outOfStock
                          ? "Sold Out"
                          : SIZE_DIMENSIONS_MAP[val]?.split(" | ")[0] || val}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {["l", "xl", "xxl"].map((val) => {
                  const isSelected = val === selectedSize;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSizeSelect(val)}
                      className={`py-2 px-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[#0f0f0f] border-[#0f0f0f] text-white shadow-md"
                          : "bg-white border-zinc-200 text-[#0f0f0f] hover:border-zinc-400"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-extrabold uppercase">
                        {val}
                      </span>
                      <span
                        className={`text-[9.5px] sm:text-[10px] font-medium truncate mt-0.5 ${
                          isSelected ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        {SIZE_DIMENSIONS_MAP[val]?.split(" | ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity Selector & Subtotal */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                Quantity
              </span>
              <span className="text-[11px] font-medium text-zinc-500">
                Total:{" "}
                <strong className="text-[#0f0f0f] font-black">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>

            <div className="flex items-center border border-zinc-300 rounded-full bg-zinc-50 p-0.5">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || cartActionLoading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 hover:bg-white hover:shadow-xs disabled:opacity-40 transition cursor-pointer"
              >
                <Icon icon="ic:baseline-minus" />
              </button>
              <span className="w-10 text-center text-sm font-extrabold text-[#0f0f0f]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={!isSelectedSizeInStock || cartActionLoading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 hover:bg-white hover:shadow-xs disabled:opacity-40 transition cursor-pointer"
              >
                <Icon icon="material-symbols:add" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            disabled={!isSelectedSizeInStock || cartActionLoading || isAdmin}
            className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              !isSelectedSizeInStock || isAdmin
                ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 cursor-pointer"
            }`}
          >
            {cartActionLoading ? (
              <>
                <Icon icon="eos-icons:loading" className="text-lg" />
                <span>Adding to Cart...</span>
              </>
            ) : !isSelectedSizeInStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <Icon
                  icon="material-symbols:shopping-bag-outline"
                  className="text-lg"
                />
                <span>
                  Add to Cart • ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
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