import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";

const AdminProductItem = ({ product, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setIsMenuOpen(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      await onDelete(product.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="admin-product-list-item w-full flex justify-between items-center relative bg-white border border-zinc-200 rounded-lg p-2 shadow-xs">
        <div className="product-dets flex items-center gap-4 w-[90%]">
          <div className="admin-product-image-container w-1/4 aspect-square rounded-md border-zinc-200 border overflow-hidden bg-zinc-100">
            <img
              src={optimizeImage(product.image?.url, {
                width: 240,
                quality: 75,
              })}
              loading="lazy"
              decoding="async"
              alt={`${product.name}-image`}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="admin-product-list-item-name font-semibold text-zinc-900 w-3/4 truncate">
            {product.name}
          </p>
        </div>

        <div ref={containerRef} className="relative w-[10%]">
          <button
            onClick={toggleMenu}
            className="admin-product-list-item-menu-btn w-full aspect-square rounded-lg text-xl flex justify-center items-center cursor-pointer transition-colors bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <Icon icon="iconamoon:menu-kebab-vertical-bold" />
          </button>

          {isMenuOpen && (
            <div className="admin-product-list-options absolute w-[600%] rounded-lg bg-white -top-full right-0 shadow-xl border border-zinc-200 z-10 text-zinc-800">
              <p className="admin-product-list-item-name font-semibold text-zinc-900 truncate px-3 py-3 border-b border-zinc-200 tracking-wide">
                {product.name}
              </p>
              <ul className="admin-product-list-item-dets p-3 text-sm text-zinc-700">
                <li>
                  <span className="font-semibold text-zinc-900">Sales: </span>
                  <span>{product.salesCount || product.sales || 0}</span>
                </li>
                <li className="my-1">
                  <span className="font-semibold text-zinc-900">
                    In Stock:{" "}
                  </span>
                  <span>{product.totalStock}</span>
                </li>
                {product.stocks && (
                  <li>
                    <ul className="flex justify-between flex-wrap">
                      {product.stocks.map((stock, index) => (
                        <li key={index}>
                          <span className="font-semibold text-zinc-900 uppercase">
                            {stock.size}:{" "}
                          </span>
                          <span>{stock.count}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
              <div className="admin-product-list-item-btns p-2 flex flex-col gap-1.5">
                <Link
                  className="w-full py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold flex justify-center items-center gap-1 hover:bg-indigo-700 transition-colors"
                  to={`/admin/products/update/${product.id}`}
                >
                  <Icon icon="solar:pen-2-linear" />
                  <span>Update</span>
                </Link>
                <button
                  onClick={handleDeleteClick}
                  className="w-full py-2 rounded-md bg-red-50 border border-red-200 text-sm font-semibold text-red-600 flex items-center justify-center gap-1 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        productName={product.name}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  );
};

export default AdminProductItem;
