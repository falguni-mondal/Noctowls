export const fireGooglePurchasePixel = ({ orderNumber, finalTotal, items, email, phone }) => {
    if (typeof window.gtag !== 'undefined') {
        
        // 1. Enhanced Conversions
        window.gtag('set', 'user_data', {
            email: email || '',
            phone_number: phone || ''
        });

        // 2. Format items for Google
        const formattedItems = items ? items.map(item => ({
            item_id: item.product._id,
            item_name: item.product.name,
            price: item.price,
            quantity: item.quantity
        })) : [];

        // 3. Purchase Event
        window.gtag('event', 'purchase', {
            send_to: import.meta.env.VITE_GOOGLE_CONVERSION_SEND_TO, 
            transaction_id: orderNumber,       
            value: finalTotal,         
            currency: 'INR',
            items: formattedItems
        });
        
        console.log("Google Purchase Pixel Fired!");
    }
};