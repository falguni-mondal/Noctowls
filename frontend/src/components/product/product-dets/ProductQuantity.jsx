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
      <h3 className="product-quantity-heading text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">
        Quantity
      </h3>
      
      <div className={`quantity-selector w-[140px] flex items-center justify-between border border-zinc-700 bg-black rounded p-1 ${
        isValidating ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}>
        <button 
          onClick={() => quantitySetter("decrement")} 
          className={`w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors ${
            quantity <= 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
        >
          <Icon icon="ic:baseline-minus" />
        </button>
        
        <span className="text-white font-bold text-lg">
          {quantity}
        </span>
        
        <button 
          onClick={() => quantitySetter("increment")} 
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
        >
          <Icon icon="material-symbols:add" />
        </button>
      </div>

      {showStockError && (
        <p className="text-xs text-red-500 mt-2 font-bold uppercase tracking-wide">
          Limit Reached
        </p>
      )}
    </div>
  )
}

export default ProductQuantity;