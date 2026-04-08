import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getAllAdminProducts, exportInventory, resetExportState } from "../../../store/features/admin/adminProductSlice";
import Loader from "../../../utils/loader/Loader";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";
import * as XLSX from "xlsx"; // ✅ Import SheetJS

// Helper for Desktop Action Buttons (Updated to support onClick)
const ActionButton = ({ to, onClick, icon, label, colorClass, disabled }) => {
  const content = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        to ? 'pointer-events-none' : 'cursor-pointer'
      } ${colorClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  
  // Pull in the export state as well
  const { adminProducts: products, loading, export: exportState } = useSelector(state => state.adminProducts);

  useEffect(() => {
    dispatch(getAllAdminProducts());
  }, [dispatch]);

  // NEW: Handle Export Logic
  const handleExport = async () => {
    try {
      // 1. Fetch data from backend
      const resultAction = await dispatch(exportInventory()).unwrap();
      const exportData = resultAction.data;

      if (!exportData || Object.keys(exportData).length === 0) {
        toast.error("No inventory data found to export.", toastControls);
        return;
      }

      // 2. Create a new Excel Workbook
      const wb = XLSX.utils.book_new();

      // 3. Iterate over each category and create a separate tab (worksheet)
      Object.keys(exportData).forEach((category) => {
        const sheetData = exportData[category];
        const ws = XLSX.utils.json_to_sheet(sheetData);
        
        // Append sheet to workbook (Category names as tab names)
        XLSX.utils.book_append_sheet(wb, ws, category.toUpperCase());
      });

      // 4. Generate Excel file and trigger browser download
      const fileName = `Noctowls_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success("Inventory exported successfully!", toastControls);
      
      // Reset Redux state
      dispatch(resetExportState());
    } catch (error) {
      toast.error(error || "Failed to export inventory", toastControls);
      dispatch(resetExportState());
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-zinc-950">
        <Loader />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 pb-24 lg:pb-12 font-sans overflow-x-hidden' id="admin-product-page">

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 max-w-[1600px] mx-auto border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Products</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your inventory by category</p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* NEW EXPORT BUTTON */}
          <ActionButton
            onClick={handleExport}
            disabled={exportState?.loading}
            icon={exportState?.loading ? "eos-icons:loading" : "material-symbols:download-rounded"}
            label={exportState?.loading ? "Exporting..." : "Export"}
            colorClass="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
          />
          <ActionButton
            to="/admin/reviews"
            icon="material-symbols-light:inbox-text-asterisk"
            label="Reviews"
            colorClass="bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20"
          />
          <ActionButton
            to="/admin/coupons"
            icon="hugeicons:coupon-01"
            label="Coupons"
            colorClass="bg-green-500/10 text-green-400 border border-green-500/20 group-hover:bg-green-500/20"
          />
          <ActionButton
            to="/admin/products/add"
            icon="material-symbols:add-2-rounded"
            label="Add Product"
            colorClass="bg-indigo-600 text-white group-hover:bg-indigo-700 shadow-lg shadow-indigo-900/20"
          />
        </div>
      </div>

      {/* --- PRODUCT CONTENT --- */}
      <div className="max-w-[1600px] mx-auto space-y-12">
        {products && products.length > 0 ? (
          products.map((productCategory) => (
            <div key={`admin-category-${productCategory.category}`} className="relative group/section">

              {/* Category Header */}
              <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl py-4 border-b border-zinc-800 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                  <h2 className="font-bold text-xl capitalize text-zinc-100 tracking-wide">
                    {productCategory.category}
                  </h2>
                  <span className="bg-zinc-900 text-zinc-500 text-xs font-mono px-2 py-1 rounded-md border border-zinc-800">
                    {productCategory.products.length} items
                  </span>
                </div>
              </div>

              {/* CARD GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {productCategory.products.map((product) => (
                  <AdminProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Icon icon="solar:box-minimalistic-broken" className="text-4xl text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-300">No Products Found</h2>
            <p className="text-zinc-500 mt-2 text-sm max-w-xs mx-auto">It looks like you haven't added any products yet. Start by adding a new product to your inventory.</p>
          </div>
        )}
      </div>

      {/* --- MOBILE FLOATING ACTION BUTTONS --- */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col gap-3 lg:hidden">
        {/* NEW EXPORT MOBILE BUTTON */}
        <div className="w-12 h-12 rounded-xl relative shadow-lg shadow-amber-900/20">
          <button
            onClick={handleExport}
            disabled={exportState?.loading}
            className="w-full h-full flex justify-center items-center bg-amber-600 text-white rounded-xl active:bg-amber-700 disabled:opacity-70 transition-colors cursor-pointer z-20 relative"
          >
            <Icon icon={exportState?.loading ? "eos-icons:loading" : "material-symbols:download-rounded"} className="text-xl" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-xl relative group shadow-lg shadow-blue-900/20">
          <div className="w-full h-full flex justify-center items-center bg-blue-600 text-white rounded-xl pointer-events-none">
            <Icon icon="material-symbols-light:inbox-text-asterisk" className="text-xl" />
          </div>
          <Link to="/admin/reviews" className="absolute inset-0 z-10" />
        </div>

        <div className="w-12 h-12 rounded-xl relative group shadow-lg shadow-green-900/20">
          <div className="w-full h-full flex justify-center items-center bg-green-600 text-white rounded-xl pointer-events-none">
            <Icon icon="hugeicons:coupon-01" className="text-xl" />
          </div>
          <Link to="/admin/coupons" className="absolute inset-0 z-10" />
        </div>

        <div className="w-14 h-14 rounded-2xl relative group shadow-xl shadow-indigo-900/30">
          <div className="w-full h-full flex justify-center items-center bg-indigo-600 text-white rounded-2xl pointer-events-none">
            <Icon icon="material-symbols:add-2-rounded" className="text-3xl" />
          </div>
          <Link to="/admin/products/add" className="absolute inset-0 z-10" />
        </div>
      </div>
    </div>
  )
}

// ==================== ADMIN PRODUCT CARD ====================
const AdminProductCard = ({ product }) => {
  const mainImage = product.image && product.image.url;

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 h-full flex flex-col">

      {/* Image Container */}
      <div className="w-full aspect-4/3 overflow-hidden bg-black relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
        />

        {/* Main Link (Routes to Public Product Page) */}
        <Link to={`/products/${product.id}`} className="absolute inset-0 z-10 cursor-pointer" />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            -{product.discount}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 z-10 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative bg-zinc-900 flex-1 flex flex-col justify-between">
        {/* Hover Line Effect */}
        <div className="absolute top-0 left-0 w-0 h-px bg-linear-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-500 ease-out"></div>

        <div className="mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="text-zinc-200 text-xs md:text-sm font-bold uppercase tracking-wide truncate group-hover:text-indigo-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-end justify-between mt-auto relative z-20">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="text-zinc-600 text-[10px] font-medium line-through decoration-zinc-600/50">
                Rs. {product.originalPrice}
              </span>
            )}
            <span className="text-white text-sm md:text-base font-black tracking-tight">
              Rs. {product.price}
            </span>
          </div>

          {/* Edit Button (Routes to Admin Update Page) */}
          <div className="relative w-8 h-8">
            <button className="w-full h-full rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 pointer-events-none">
              <Icon icon="solar:pen-new-square-linear" className="text-lg" />
            </button>
            {/* Interaction Fix for Edit Button */}
            <Link to={`/admin/products/update/${product.id}`} className="absolute inset-0 z-30 cursor-pointer rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;