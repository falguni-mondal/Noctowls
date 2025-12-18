import { Icon } from '@iconify/react/dist/iconify.js'

const ProductQuantity = ({ 
  quantitySetter, 
  quantity, 
  stockValidation, 
  isValidating 
}) => {
  
  // Show stock error if validation failed
  const showStockError = stockValidation?.data && !stockValidation.data.isAvailable;

  return (
    <div className="product-quantity-container mt-10 px-3">
      <h3 className="product-quantity-heading text-sm font-medium text-zinc-300">
        Quantity
      </h3>
      
      <div className={`quantity-selector w-fit flex items-center gap-2 mt-2 text-sm font-medium border-[0.5px] border-zinc-500 rounded-full transition-all duration-300 ${
        isValidating ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}>
        <span 
          onClick={() => quantitySetter("decrement")} 
          className={`product-quantity-decrement-btn w-10 aspect-square flex items-center justify-center hover:bg-indigo-300 hover:text-black rounded-full transition-all duration-300 ${
            quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Icon icon="ic:baseline-minus" />
        </span>
        
        <span className="product-quantity-preview w-[3ch] text-center">
          {quantity}
        </span>
        
        <span 
          onClick={() => quantitySetter("increment")} 
          className="product-quantity-increment-btn w-10 aspect-square flex items-center justify-center hover:bg-indigo-300 hover:text-black rounded-full transition-all duration-300 cursor-pointer"
        >
          <Icon icon="material-symbols:add" />
        </span>
      </div>

      {/* Stock validation feedback */}
      {showStockError && (
        <p className="text-xs text-red-400 mt-2 font-medium">
          No more in stock
        </p>
      )}

      {stockValidation?.error && (
        <p className="text-xs text-red-400 mt-2">
          {stockValidation.error}
        </p>
      )}
    </div>
  )
}

export default ProductQuantity