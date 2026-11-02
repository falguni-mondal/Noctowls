import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  getAllAdminProducts,
  exportInventory,
  resetExportState,
  reorderAdminProducts,
  optimisticReorderCategoryProducts,
} from "../../../store/features/admin/adminProductSlice";
import Loader from "../../../utils/loader/Loader";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";
import * as XLSX from "xlsx";

// Helper for Desktop Action Buttons
const ActionButton = ({ to, onClick, icon, label, colorClass, disabled }) => {
  const content = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs ${
        to ? "pointer-events-none" : "cursor-pointer"
      } ${colorClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon icon={icon} className="text-xl" />
      <span>{label}</span>
    </button>
  );

  if (to) {
    return (
      <div className="relative group">
        {content}
        <Link to={to} className="absolute inset-0 z-10 cursor-pointer" />
      </div>
    );
  }

  return <div className="relative group">{content}</div>;
};

const AdminProducts = () => {
  const dispatch = useDispatch();

  const {
    adminProducts: products,
    adminProductsLoading: loading,
    adminProductsError: error,
    export: exportState,
    reorder: reorderState,
  } = useSelector((state) => state.adminProducts);

  // Drag-and-drop state
  const [dragState, setDragState] = useState({
    category: null,
    draggedIndex: null,
    overIndex: null,
  });

  useEffect(() => {
    dispatch(getAllAdminProducts());
  }, [dispatch]);

  // Persist a reordered product list for a category
  const applyCategoryReorder = async (
    category,
    currentProducts,
    fromIdx,
    toIdx
  ) => {
    if (
      fromIdx === null ||
      toIdx === null ||
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= currentProducts.length ||
      toIdx >= currentProducts.length
    ) {
      return;
    }

    const updated = [...currentProducts];
    const [movedItem] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, movedItem);

    // 1. Optimistically update Redux state for instant UI response
    dispatch(
      optimisticReorderCategoryProducts({
        category,
        reorderedProducts: updated,
      })
    );

    // 2. Save new order to backend
    const orderedProductIds = updated.map((p) => String(p.id || p._id));
    try {
      await dispatch(
        reorderAdminProducts({
          category,
          orderedProductIds,
        })
      ).unwrap();
      toast.success("Product sequence updated!", {
        ...toastControls,
        autoClose: 1500,
      });
    } catch (err) {
      toast.error(err || "Failed to save product sequence", toastControls);
      dispatch(getAllAdminProducts());
    }
  };

  // Reset a category back to pure chronological Latest First (createdAt: -1)
  const handleResetCategoryOrder = async (category) => {
    try {
      await dispatch(
        reorderAdminProducts({
          category,
          orderedProductIds: [],
          resetToLatest: true,
        })
      ).unwrap();
      await dispatch(getAllAdminProducts());
      toast.success(`Reset ${category} to latest-first order!`, {
        ...toastControls,
        autoClose: 1500,
      });
    } catch (err) {
      toast.error(err || "Failed to reset category order", toastControls);
    }
  };

  const handleDragStart = (e, category, index) => {
    setDragState({
      category,
      draggedIndex: index,
      overIndex: index,
    });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `${category}:${index}`);
    }
  };

  const handleDragOver = (e, category, index) => {
    e.preventDefault();
    if (dragState.category !== category) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    if (dragState.overIndex !== index) {
      setDragState((prev) => ({ ...prev, overIndex: index }));
    }
  };

  const handleDrop = async (e, category, targetIndex, categoryProducts) => {
    e.preventDefault();
    const { category: srcCategory, draggedIndex } = dragState;
    setDragState({ category: null, draggedIndex: null, overIndex: null });

    if (srcCategory !== category || draggedIndex === null) return;
    await applyCategoryReorder(
      category,
      categoryProducts,
      draggedIndex,
      targetIndex
    );
  };

  const handleDragEnd = () => {
    setDragState({ category: null, draggedIndex: null, overIndex: null });
  };

  const handleExport = async () => {
    try {
      const resultAction = await dispatch(exportInventory()).unwrap();
      const exportData = resultAction.data;

      if (!exportData || Object.keys(exportData).length === 0) {
        toast.error("No inventory data found to export.", toastControls);
        return;
      }

      const wb = XLSX.utils.book_new();

      Object.keys(exportData).forEach((category) => {
        const sheetData = exportData[category];
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, category.toUpperCase());
      });

      const fileName = `Noctowls_Inventory_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Inventory exported successfully!", toastControls);
      dispatch(resetExportState());
    } catch (err) {
      toast.error(err || "Failed to export inventory", toastControls);
      dispatch(resetExportState());
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f4f4f4] text-zinc-900 p-4 md:p-8 pb-24 lg:pb-12 font-sans overflow-x-hidden"
      id="admin-product-page"
    >
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 max-w-[1600px] mx-auto border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Products
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Latest products appear first by default. Drag any product card (or
            use the arrow buttons) to customize display sequence across the
            store.
          </p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <ActionButton
            onClick={handleExport}
            disabled={exportState?.loading}
            icon={
              exportState?.loading
                ? "eos-icons:loading"
                : "material-symbols:download-rounded"
            }
            label={exportState?.loading ? "Exporting..." : "Export"}
            colorClass="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          />
          <ActionButton
            to="/admin/reviews"
            icon="material-symbols-light:inbox-text-asterisk"
            label="Reviews"
            colorClass="bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-100"
          />
          <ActionButton
            to="/admin/coupons"
            icon="hugeicons:coupon-01"
            label="Coupons"
            colorClass="bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100"
          />
          <ActionButton
            to="/admin/products/add"
            icon="material-symbols:add-2-rounded"
            label="Add Product"
            colorClass="bg-indigo-600 text-white group-hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
          />
        </div>
      </div>

      {/* --- PRODUCT CONTENT --- */}
      <div className="max-w-[1600px] mx-auto space-y-12">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-red-50 rounded-3xl border border-red-200 shadow-xs">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <Icon icon="solar:danger-triangle-bold" className="text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">
              Failed to Load Products
            </h2>
            <p className="text-zinc-600 mt-2 text-sm max-w-md mx-auto">
              {typeof error === "string"
                ? error
                : "An error occurred while fetching your inventory."}
            </p>
            <button
              onClick={() => dispatch(getAllAdminProducts())}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Retry Fetch
            </button>
          </div>
        ) : products && products.length > 0 ? (
          products.map((productCategory) => {
            const categoryKey = productCategory.category;
            const categoryItems = productCategory.products || [];
            const isSavingThisCategory =
              reorderState?.loading &&
              reorderState?.savingCategory === categoryKey;
            const hasCustomOrder = categoryItems.some(
              (p) => typeof p.displayOrder === "number"
            );

            return (
              <div
                key={`admin-category-${categoryKey}`}
                className="relative group/section"
              >
                {/* Category Header */}
                <div className="sticky top-0 z-30 bg-[#f4f4f4]/95 backdrop-blur-xl py-4 border-b border-zinc-200 mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 rounded-full bg-indigo-600"></span>
                    <h2 className="font-bold text-xl capitalize text-zinc-900 tracking-wide">
                      {categoryKey}
                    </h2>
                    <span className="bg-white text-zinc-600 text-xs font-mono font-semibold px-2.5 py-1 rounded-md border border-zinc-200 shadow-2xs">
                      {categoryItems.length} items
                    </span>
                    {isSavingThisCategory && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                        <Icon icon="eos-icons:loading" className="text-sm" />
                        Saving sequence...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                      <Icon
                        icon="material-symbols:drag-pan-rounded"
                        className="text-sm text-zinc-500"
                      />
                      Drag cards to reorder
                    </span>
                    {hasCustomOrder && categoryItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleResetCategoryOrder(categoryKey)}
                        disabled={isSavingThisCategory}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        title="Reset this category to chronological Latest First order"
                      >
                        <Icon
                          icon="solar:restart-bold"
                          className="text-sm text-indigo-600"
                        />
                        <span>Reset to Latest First</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {categoryItems.map((product, index) => {
                    const isDragged =
                      dragState.category === categoryKey &&
                      dragState.draggedIndex === index;
                    const isDragOver =
                      dragState.category === categoryKey &&
                      dragState.overIndex === index &&
                      dragState.draggedIndex !== index;

                    return (
                      <AdminProductCard
                        key={product.id || product._id}
                        product={product}
                        index={index}
                        totalItems={categoryItems.length}
                        isDragged={isDragged}
                        isDragOver={isDragOver}
                        onDragStart={(e) =>
                          handleDragStart(e, categoryKey, index)
                        }
                        onDragOver={(e) =>
                          handleDragOver(e, categoryKey, index)
                        }
                        onDrop={(e) =>
                          handleDrop(e, categoryKey, index, categoryItems)
                        }
                        onDragEnd={handleDragEnd}
                        onMoveLeft={() =>
                          applyCategoryReorder(
                            categoryKey,
                            categoryItems,
                            index,
                            index - 1
                          )
                        }
                        onMoveRight={() =>
                          applyCategoryReorder(
                            categoryKey,
                            categoryItems,
                            index,
                            index + 1
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-zinc-200 border-dashed shadow-xs">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
              <Icon
                icon="solar:box-minimalistic-broken"
                className="text-4xl text-zinc-400"
              />
            </div>
            <h2 className="text-xl font-bold text-zinc-800">
              No Products Found
            </h2>
            <p className="text-zinc-500 mt-2 text-sm max-w-xs mx-auto">
              It looks like you haven't added any products yet. Start by adding
              a new product to your inventory.
            </p>
          </div>
        )}
      </div>

      {/* --- MOBILE FLOATING ACTION BUTTONS --- */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col gap-3 lg:hidden">
        <div className="w-12 h-12 rounded-xl relative shadow-lg shadow-amber-600/20">
          <button
            onClick={handleExport}
            disabled={exportState?.loading}
            className="w-full h-full flex justify-center items-center bg-amber-600 text-white rounded-xl active:bg-amber-700 disabled:opacity-70 transition-colors cursor-pointer z-20 relative"
          >
            <Icon
              icon={
                exportState?.loading
                  ? "eos-icons:loading"
                  : "material-symbols:download-rounded"
              }
              className="text-xl"
            />
          </button>
        </div>

        <div className="w-12 h-12 rounded-xl relative group shadow-lg shadow-blue-600/20">
          <div className="w-full h-full flex justify-center items-center bg-blue-600 text-white rounded-xl pointer-events-none">
            <Icon
              icon="material-symbols-light:inbox-text-asterisk"
              className="text-xl"
            />
          </div>
          <Link to="/admin/reviews" className="absolute inset-0 z-10" />
        </div>

        <div className="w-12 h-12 rounded-xl relative group shadow-lg shadow-emerald-600/20">
          <div className="w-full h-full flex justify-center items-center bg-emerald-600 text-white rounded-xl pointer-events-none">
            <Icon icon="hugeicons:coupon-01" className="text-xl" />
          </div>
          <Link to="/admin/coupons" className="absolute inset-0 z-10" />
        </div>

        <div className="w-14 h-14 rounded-2xl relative group shadow-xl shadow-indigo-600/30">
          <div className="w-full h-full flex justify-center items-center bg-indigo-600 text-white rounded-2xl pointer-events-none">
            <Icon
              icon="material-symbols:add-2-rounded"
              className="text-3xl"
            />
          </div>
          <Link to="/admin/products/add" className="absolute inset-0 z-10" />
        </div>
      </div>
    </div>
  );
};

// ==================== ADMIN PRODUCT CARD (LIGHT THEME + DRAG-TO-REPOSITION) ====================
const AdminProductCard = ({
  product,
  index,
  totalItems,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveLeft,
  onMoveRight,
}) => {
  const rawUrl =
    typeof product.image === "string"
      ? product.image
      : product.image?.url || product.images?.[0]?.url || "";
  const mainImage = optimizeImage(rawUrl, { width: 400, quality: 75 });
  const isOutOfStock =
    product.totalStock === 0 || product.stock === 0 || product.inStock === false;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative bg-white border rounded-xl overflow-hidden transition-all duration-200 h-full flex flex-col select-none cursor-grab active:cursor-grabbing shadow-xs ${
        isDragged
          ? "opacity-40 scale-95 border-indigo-500"
          : isDragOver
          ? "border-indigo-600 ring-2 ring-indigo-500/50 scale-[1.02] shadow-lg"
          : "border-zinc-200 hover:border-indigo-400 hover:shadow-md"
      }`}
    >
      {/* Top Reorder Bar (Sequence Badge + Drag Handle + Touch Move Arrows) */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-50 border-b border-zinc-200 text-xs z-30">
        <div
          className="flex items-center gap-1.5 text-zinc-600 font-mono"
          title="Drag card to reposition product sequence"
        >
          <Icon
            icon="material-symbols:drag-indicator"
            className="text-base text-zinc-500 group-hover:text-indigo-600 transition-colors"
          />
          <span className="font-bold text-zinc-800">#{index + 1}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveLeft();
            }}
            disabled={index === 0}
            title="Move Earlier"
            className="w-6 h-6 rounded bg-white hover:bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <Icon icon="solar:alt-arrow-left-linear" className="text-xs" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveRight();
            }}
            disabled={index === totalItems - 1}
            title="Move Later"
            className="w-6 h-6 rounded bg-white hover:bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <Icon icon="solar:alt-arrow-right-linear" className="text-xs" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="w-full aspect-4/3 overflow-hidden bg-zinc-100 relative">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
            No Image
          </div>
        )}

        {/* Main Link (Routes to Public Product Page) */}
        <Link
          to={`/products/${product.id}`}
          draggable={false}
          className="absolute inset-0 z-10 cursor-pointer"
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none">
            -{product.discount}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative bg-white flex-1 flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-0 h-0.5 bg-linear-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">
              {product.category}
            </span>
            {product.status === "archived" && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Archived
              </span>
            )}
          </div>
          <h3 className="text-zinc-900 text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-end justify-between mt-auto relative z-20">
          <div className="flex flex-col">
            {product.originalPrice &&
              product.originalPrice !== product.price && (
                <span className="text-zinc-400 text-[10px] font-medium line-through">
                  Rs. {product.originalPrice}
                </span>
              )}
            <span className="text-zinc-900 text-sm md:text-base font-black tracking-tight">
              Rs. {product.price}
            </span>
          </div>

          <div className="relative w-8 h-8">
            <button
              type="button"
              className="w-full h-full rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 pointer-events-none"
            >
              <Icon icon="solar:pen-new-square-linear" className="text-lg" />
            </button>
            <Link
              to={`/admin/products/update/${product.id}`}
              draggable={false}
              className="absolute inset-0 z-30 cursor-pointer rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
