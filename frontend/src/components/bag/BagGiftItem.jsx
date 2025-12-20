import { Icon } from '@iconify/react/dist/iconify.js';

const BagGiftItem = ({ gift }) => {
    return (
        <li className='w-full relative'>
            <div className="cart-product-main-dets w-full">
                <div className='w-full flex justify-between'>
                    <div className="cart-product-img aspect-square rounded bg-zinc-950 overflow-hidden w-[25%] shrink-0 flex justify-center items-center">
                        <img 
                            className='w-1/2 aspect-square object-cover' 
                            src={gift.image || '/placeholder-image.jpg'} 
                            alt={gift.name}
                            onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                            }}
                        />
                    </div>
                    <div className="cart-product-dets w-[70%]">
                        <h2 className="cart-product-name font-medium text-lg tracking-wide w-full truncate">
                            {gift.name}
                        </h2>
                        
                        <p className="text-green-400 flex items-center gap-1">
                            <Icon icon="solar:gift-bold" className="text-base" />
                            <span>Free Gift</span>
                        </p>
                        
                        <p className="cart-product-size font-medium text-zinc-400">
                            Quantity: <span className='font-medium text-white'>{gift.quantity}</span>
                        </p>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default BagGiftItem;