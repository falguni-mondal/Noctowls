import { Icon } from '@iconify/react/dist/iconify.js'

const ProductQuantity = ({quantitySetter, quantity}) => {
    return (
        <div className="product-quantity-container mt-10 px-3">
            <h3 className="product-quantity-heading text-sm font-medium text-zinc-300">Quantity</h3>
            <div className="quantity-selector w-fit flex items-center gap-2 mt-2 text-sm font-medium border-[0.5px] border-zinc-500 rounded-full">
                <span onClick={() => quantitySetter("decrement")} className="product-quantity-decrement-btn w-10 aspect-square flex items-center justify-center hover:bg-indigo-300 hover:text-black rounded-full transition-all duration-300">
                    <Icon icon="ic:baseline-minus" />
                </span>
                <span className="product-quantity-preview w-[3ch] text-center">{quantity}</span>
                <span onClick={() => quantitySetter("increment")} className="product-quantity-increment-btn w-10 aspect-square flex items-center justify-center hover:bg-indigo-300 hover:text-black rounded-full transition-all duration-300">
                    <Icon icon="material-symbols:add" />
                </span>
            </div>
        </div>
    )
}

export default ProductQuantity