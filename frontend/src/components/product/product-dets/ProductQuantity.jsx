import { Icon } from '@iconify/react/dist/iconify.js'

const ProductQuantity = ({ 
  quantitySetter, 
  quantity, 
  stockValidation, 
  isValidating 
}) => {
  
  const showStockError = stockValidation?.data && !stockValidation.data.isAvailable;

  return (
    <div className="product-quantity-container mt-2.5 px-3 md:px-0 flex items-center justify-between gap-3">
      <h3 className="product-quantity-heading text-xs font-bold text-[#0f0f0f] uppercase tracking-widest">
        Quantity
      </h3>
      
      <div className="flex items-center gap-3">
        {showStockError && (
          <p className="text-[11px] text-red-600 font-bold uppercase tracking-wide">
            Limit Reached
          </p>
        )}

        <div className={`quantity-selector w-[116px] flex items-center justify-between border border-zinc-300 bg-white rounded-full p-0.5 shadow-xs ${
          isValidating ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}>
          <button 
            onClick={() => quantitySetter("decrement")} 
            className={`w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-[#0f0f0f] hover:bg-zinc-100 rounded-full transition-colors ${
              quantity <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Icon icon="ic:baseline-minus" className="text-sm" />
          </button>
          
          <span className="text-[#0f0f0f] font-bold text-sm">
            {quantity}
          </span>
          
          <button 
            onClick={() => quantitySetter("increment")} 
            className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-[#0f0f0f] hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          >
            <Icon icon="material-symbols:add" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductQuantity;