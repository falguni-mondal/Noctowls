import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  updateCartItemQuantity,
  removeCartItem,
  selectActionLoading,
} from "../../store/features/user/cartSlice";
import {
  toggleWishlist,
  selectWishlistActionLoading,
} from "../../store/features/user/wishlistSlice";
import { useState } from "react";
import { toast } from "react-toastify";
import toastControls from "../../utils/global/toastControls";
import { optimizeImage } from "../../utils/helpers/imageOptimizer";
import { trackEvent } from "../../utils/pixel/pixel";

const BagItem = ({ item }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const actionLoading = useSelector(selectActionLoading);
  const wishlistLoading = useSelector(selectWishlistActionLoading);
  const user = useSelector((state) => state.auth.user);
  const admin = useSelector((state) => state.adminAuth.admin);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (action) => {
    if (isUpdating || actionLoading) return;

    setIsUpdating(true);
    let newQuantity = item.quantity;

    if (action === "increment") {
      newQuantity = item.quantity + 1;
    } else if (action === "decrement" && item.quantity > 1) {
      newQuantity = item.quantity - 1;
    } else if (action === "decrement" && item.quantity === 1) {
      await dispatch(removeCartItem(item._id));
      setIsUpdating(false);
      return;
    }

    try {
      await dispatch(
        updateCartItemQuantity({
          itemId: item._id,
          quantity: newQuantity,
        })
      ).unwrap();

      if (action === "increment" && item.product?._id) {
        const unitPrice = Number(item.price || 0);
        trackEvent("AddToCart", {
          content_name: item.name,
          content_ids: [item.product._id],
          content_type: "product",
          value: unitPrice,
          currency: "INR",
          contents: [
            {
              id: item.product._id,
              quantity: 1,
              item_price: unitPrice,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user || admin) {
      toast.info(
        admin
          ? "Please logout from admin account!"
          : "Please login to add items to your wishlist!",
        toastControls
      );
      if (!admin) {
        navigate("/account/signin", { state: { from: "/bag" } });
      }
      return;
    }

    if (isUpdating || wishlistLoading || !item.product?._id) return;

    try {
      const result = await dispatch(toggleWishlist(item.product._id)).unwrap();
      if (result.isInWishlist) {
        trackEvent("AddToWishlist", {
          content_name: item.name,
          content_ids: [item.product._id],
          content_type: "product",
          value: Number(item.price || 0),
          currency: "INR",
        });
      }
      toast.success(
        result.message ||
          (result.isInWishlist ? "Added to wishlist!" : "Removed from wishlist"),
        toastControls
      );
    } catch (error) {
      toast.error(error || "Failed to update wishlist", toastControls);
    }
  };

  const handleRemove = async () => {
    if (isUpdating || actionLoading) return;

    setIsUpdating(true);
    try {
      await dispatch(removeCartItem(item._id)).unwrap();
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <li className="w-full relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
          <Icon icon="eos-icons:loading" className="text-3xl text-red-600" />
        </div>
      )}

      <div className="cart-product-main-dets w-full">
        <Link
          to={`/products/${item.product._id}`}
          className="w-full flex justify-between"
        >
          <div className="cart-product-img aspect-square rounded bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden w-[33%] shrink-0">
            <img
              className="w-full h-full object-cover"
              src={
                optimizeImage(item.image, { width: 240, quality: 75 }) ||
                "/placeholder-image.jpg"
              }
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
          </div>
          <div className="cart-product-dets w-[63%]">
            <h2 className="cart-product-name font-bold text-[#0f0f0f] text-lg tracking-wide w-full truncate">
              {item.name}
            </h2>

            {item.discount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <p className="cart-product-price font-black text-[#0f0f0f] text-lg tracking-wide">
                  ₹{item.price.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-zinc-400 line-through">
                  ₹{item.originalPrice.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded">
                  {item.discount}% OFF
                </span>
              </div>
            )}
            {item.discount === 0 && (
              <p className="cart-product-price font-black text-[#0f0f0f] text-lg tracking-wide mt-1">
                ₹{item.price.toLocaleString("en-IN")}
              </p>
            )}

            {item.couponDiscountPerItem > 0 && (
              <p className="text-sm font-bold text-green-600 mt-1">
                Coupon: -₹{item.totalCouponDiscount.toLocaleString("en-IN")}
              </p>
            )}

            <p className="cart-product-category font-medium tracking-wide text-zinc-500 capitalize mt-2">
              {item.category.replace("-", " ")}
            </p>
            <p className="cart-product-size font-medium text-zinc-500">
              Size:{" "}
              <span className="underline font-bold text-[#0f0f0f] uppercase">
                {item.size.label || item.size.value}
              </span>
            </p>
          </div>
        </Link>
      </div>

      <div className="cart-product-actions w-full flex items-center gap-5 mt-3">
        <div className="cart-product-quantity w-[33%] rounded-full flex items-center justify-between border border-zinc-200 bg-white shadow-sm">
          <button
            onClick={() => handleQuantityChange("decrement")}
            disabled={isUpdating || actionLoading}
            className="w-10 aspect-square rounded-full font-medium text-lg text-zinc-500 hover:text-[#0f0f0f] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
          >
            <Icon icon="ic:baseline-minus" />
          </button>
          <span className="font-bold text-[#0f0f0f]">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange("increment")}
            disabled={isUpdating || actionLoading}
            className="w-10 aspect-square rounded-full font-medium text-lg text-zinc-500 hover:text-[#0f0f0f] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
          >
            <Icon icon="material-symbols:add" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isUpdating || wishlistLoading}
          title="Add to wishlist"
          className="add-to-wishlist-btn w-10 aspect-square rounded-full border border-zinc-200 bg-white shadow-sm flex justify-center items-center text-xl text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
        >
          <Icon icon="material-symbols-light:favorite-outline" />
        </button>

        <button
          onClick={handleRemove}
          disabled={isUpdating || actionLoading}
          className="ml-auto text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Remove item"
        >
          <Icon
            icon="material-symbols:delete-outline"
            className="text-xl pointer-events-none"
          />
          <span className="hidden sm:inline pointer-events-none">Remove</span>
        </button>
      </div>
    </li>
  );
};

export default BagItem;