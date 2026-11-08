const STORAGE_KEY = 'noctowls_recently_viewed';
const MAX_ITEMS = 5;

export const addToRecentlyViewed = (product) => {
    // Safety check for product and ID (support both .id and ._id)
    const productId = product?.id || product?._id;
    if (!product || !productId) return;

    try {
        // 1. Get existing list
        let recent = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        // 2. Filter out the current product if it exists
        recent = recent.filter((item) => item.id !== productId);

        // 3. ROBUST PRICE & SIZE EXTRACTION
        let finalPrice = product.price;
        let finalOriginalPrice = product.originalPrice;
        const primarySizeObj = product.sizes?.[0];
        const availableSizeObj = product.sizes?.find((s) => s.stock > 0) || primarySizeObj;

        if ((finalPrice === undefined || finalPrice === null) && primarySizeObj) {
            finalPrice = primarySizeObj.price;
            finalOriginalPrice = primarySizeObj.originalPrice;
        }

        // 4. Create minimal object
        const minimalProduct = {
            id: productId,
            name: product.name,
            price: finalPrice || 0,
            originalPrice: finalOriginalPrice || 0,
            primarySize: product.primarySize || primarySizeObj?.value || "l",
            defaultSize: product.defaultSize || availableSizeObj?.value || "l",
            inStock: product.inStock !== undefined ? product.inStock : Boolean(availableSizeObj && availableSizeObj.stock > 0),
            images: product.images ? product.images.slice(0, 2) : [],
            category: product.category,
            rating: product.rating || { average: 0, count: 0 }
        };

        // 5. Add to the front
        recent.unshift(minimalProduct);

        // 6. Trim to max size
        if (recent.length > MAX_ITEMS) {
            recent = recent.slice(0, MAX_ITEMS);
        }

        // 7. Save
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
        
        // 8. Notify listeners
        window.dispatchEvent(new Event('recentlyViewedUpdated'));

    } catch (error) {
        console.error("Error saving to recently viewed:", error);
    }
};

export const getRecentlyViewed = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
};