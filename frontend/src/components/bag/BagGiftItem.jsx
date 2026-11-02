import { Icon } from "@iconify/react/dist/iconify.js";
import { optimizeImage } from "../../utils/helpers/imageOptimizer";

const BagGiftItem = ({ gift }) => {
  const shouldShowPrice =
    gift.category !== "sticker" && gift.originalPrice > 0;

  return (
    <li className="w-full relative">
      <div className="cart-product-main-dets w-full">
        <div className="w-full flex justify-between">
          <div className="cart-product-img aspect-square rounded bg-zinc-100 border border-zinc-200 overflow-hidden w-[25%] shrink-0 flex justify-center items-center shadow-sm">
            <img
              className="w-1/2 aspect-square object-cover"
              src={
                optimizeImage(gift.image, { width: 120, quality: 75 }) ||
                "/placeholder-image.jpg"
              }
              alt={gift.name}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
          </div>
          <div className="cart-product-dets w-[70%]">
            <h2 className="cart-product-name font-medium text-[#0f0f0f] text-lg tracking-wide w-full truncate">
              {gift.name}
            </h2>

            {shouldShowPrice && (
              <div className="flex items-center gap-2 mb-1">
                <p className="cart-product-price font-medium text-lg tracking-wide text-green-600">
                  ₹0.00
                </p>
                <p className="text-sm text-zinc-400 line-through">
                  ₹{gift.originalPrice.toLocaleString("en-IN")}.00
                </p>
              </div>
            )}

            {!shouldShowPrice && (
              <p className="text-green-600 font-bold flex items-center gap-1 mt-1">
                <Icon icon="solar:gift-bold" className="text-base" />
                <span>Free Gift</span>
              </p>
            )}

            <p className="cart-product-size font-medium text-zinc-500 mt-1">
              Quantity:{" "}
              <span className="font-bold text-[#0f0f0f]">{gift.quantity}</span>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};

export default BagGiftItem;