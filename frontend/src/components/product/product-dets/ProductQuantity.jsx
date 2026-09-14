import { Icon } from '@iconify/react/dist/iconify.js'

const ProductQuantity = ({ 
  quantitySetter, 
  quantity, 
  stockValidation, 
  isValidating 
}) => {
  
  const showStockError = stockValidation?.data && !stockValidation.data.isAvailable;

  return (
    <div className="product-quantity-container mt-6 px-3 md:px-0">
      {/* Light theme heading */}
      <h3 className="product-quantity-heading text-xs font-bold text-[#0f0f0f] uppercase tracking-widest mb-3">
        Quantity
      </h3>
      
      {/* Light theme selector container: white bg, light border */}
      <div className={`quantity-selector w-[140px] flex items-center justify-between border border-zinc-300 bg-white rounded p-1 shadow-sm ${
        isValidating ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}>
        <button 
          onClick={() => quantitySetter("decrement")} 
          // Light theme button hover: soft gray bg, dark text
          className={`w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-[#0f0f0f] hover:bg-zinc-100 rounded transition-colors ${
            quantity <= 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
        >
          <Icon icon="ic:baseline-minus" />
        </button>
        
        {/* Light theme number text */}
        <span className="text-[#0f0f0f] font-bold text-lg">
          {quantity}
        </span>
        
        <button 
          onClick={() => quantitySetter("increment")} 
          // Light theme button hover
          className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-[#0f0f0f] hover:bg-zinc-100 rounded transition-colors"
        >
          <Icon icon="material-symbols:add" />
        </button>
      </div>

      {showStockError && (
        <p className="text-xs text-red-600 mt-2 font-bold uppercase tracking-wide">
          Limit Reached
        </p>
      )}
    </div>
  )
}

export default ProductQuantity;