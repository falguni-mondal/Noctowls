import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getBestSellingProducts } from "../../../store/features/user/productSlice";
import {
  addToCart,
  selectCart,
} from "../../../store/features/user/cartSlice";
import { Icon } from "@iconify/react";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import { trackEvent } from "../../../utils/pixel/pixel";
import { renderUnlockLineWithGreenFree } from "../../bag/CartDrawer";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";

const SIZE_CHIP_MAP = {
  l: "600x300mm | 3mm Heavy Density",
  xl: "800x330mm | 3mm Heavy Density",
  xxl: "900x400mm | 3mm Heavy Density",
};

const BestSelling = () => {
  const dispatch = useDispatch();
  const { bestSellingProducts, bestSellingLoading } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(getBestSellingProducts(4));
  }, [dispatch]);

  if (bestSellingLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-zinc-500">
        <Icon icon="eos-icons:loading" className="text-3xl" />
      </div>
    );
  }

  if (!bestSellingProducts || bestSellingProducts.length === 0) return null;

  return (
    <section className="best-selling-section mt-10 pt-10 border-t border-zinc-200 w-full">
      <h2 className="text-[#0f0f0f] text-xl md:text-2xl font-black uppercase mb-8 tracking-wide pl-2 border-l-4 border-red-600 flex items-center gap-3">
        Best Selling{" "}
        <Icon icon="mdi:fire" className="text-red-600 animate-pulse" />
      </h2>

      {/* ==================== MOBILE / TABLET (SWIPER) ==================== */}
      <div className="block lg:hidden">
        <Swiper
          slidesPerView={1.4}
          spaceBetween={16}
          breakpoints={{
            500: { slidesPerView: 2.2, spaceBetween: 16 },
            768: { slidesPerView: 2.5, spaceBetween: 20 },
          }}
          className="pb-4 px-1"
        >
          {bestSellingProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ==================== DESKTOP (GRID) ==================== */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {bestSellingProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

// ==================== REUSABLE PRODUCT CARD COMPONENT ====================
const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const isAdmin = useSelector((state) => state.adminAuth.admin);
  const cart = useSelector(selectCart);
  const [adding, setAdding] = useState(false);

  const purchasedItems =
    cart?.items?.filter((item) => !item.isFreeGift) || [];
  const totalCartQuantity =
    cart?.summary?.totalQuantity ??
    purchasedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const isAddedToCart = purchasedItems.some((item) => {
    const itemProdId = String(
      item.product?._id || item.product?.id || item.product || ""
    );
    return itemProdId === String(product.id);
  });

  const rawMainUrl =
    product.images && product.images.length > 0 ? product.images[0].url : "";
  const mainImage = optimizeImage(rawMainUrl, { width: 500, quality: 80 });
  const seoAltText = `${product.name} Extended Gaming Deskmat 900x400mm`;
  const specChipLabel =
    SIZE_CHIP_MAP[String(product.primarySize || "l").toLowerCase()] ||
    SIZE_CHIP_MAP.l;
  const isOutOfStock = product.inStock === false;

  const handleQuickAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (adding || isOutOfStock || isAdmin) return;
    setAdding(true);

    try {
      await dispatch(
        addToCart({
          productId: product.id,
          sizeValue: product.defaultSize || product.primarySize || "l",
          quantity: 1,
        })
      ).unwrap();

      const numericVal =
        product.numPrice ??
        (Number(String(product.price || "0").replace(/,/g, "")) || 0);

      trackEvent("AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: numericVal,
        currency: "INR",
        contents: [{ id: product.id, quantity: 1 }],
      });
    } catch (err) {
      console.error("Quick add error:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden hover:border-red-600/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-300 h-full flex flex-col"
      onClick={() => window.scrollTo(0, 0)}
    >
      {/* Image Container */}
      <div className="w-full aspect-4/3 overflow-hidden bg-zinc-100 relative">
        <img
          src={mainImage}
          alt={seoAltText}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
        />

        <div className="absolute top-0 left-0 z-10">
          <div className="bg-linear-to-r from-red-600 to-red-800 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-br-lg shadow-sm">
            Best Selling
          </div>
        </div>

        {product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
            -{product.discount}%
          </div>
        )}

        {/* Persistent Hardware Spec Pill (Size L default dimensions) */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-start pointer-events-none">
          <span className="inline-flex items-center bg-black/75 backdrop-blur-md text-white border border-white/15 text-[8.5px] sm:text-[9.5px] md:text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full shadow-sm truncate">
            {specChipLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 relative bg-white flex-1 flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="text-[#0f0f0f] text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              {product.originalPrice &&
                product.originalPrice !== product.price && (
                  <span className="text-zinc-400 text-[10px] font-medium line-through decoration-zinc-300">
                    Rs. {product.originalPrice}
                  </span>
                )}
              <span className="text-[#0f0f0f] text-sm md:text-base font-black tracking-tight">
                Rs. {product.price}
              </span>
            </div>
          </div>

          {/* 1-Line Dynamic Unlock Message directly ON TOP of the Add to Cart button */}
          {isAddedToCart && totalCartQuantity > 0 && (
            <div className="w-full text-[9.5px] sm:text-[10.5px] font-semibold text-[#0f0f0f] bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-center leading-tight animate-in slide-in-from-bottom-1 fade-in duration-200 truncate">
              {renderUnlockLineWithGreenFree(totalCartQuantity)}
            </div>
          )}

          <button
            type="button"
            onClick={handleQuickAddToCart}
            disabled={isOutOfStock || adding || isAdmin}
            className={`w-full py-2 px-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                : isAddedToCart
                ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                : "bg-[#0f0f0f] text-white hover:bg-red-600 cursor-pointer shadow-xs"
            }`}
          >
            {adding ? (
              <>
                <Icon icon="eos-icons:loading" className="text-sm" />
                <span>Adding...</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isAddedToCart ? (
              <>
                <Icon icon="mdi:check-circle" className="text-sm" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Icon
                  icon="material-symbols:shopping-bag-outline"
                  className="text-sm"
                />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default BestSelling;