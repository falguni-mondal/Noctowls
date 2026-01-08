import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import productReducer from "./features/user/productSlice";
import reviewReducer from "./features/user/reviewSlice";
import cartReducer from "./features/user/cartSlice";
import wishlistReducer from "./features/user/wishlistSlice";
import addressReducer from "./features/user/addressSlice";
import orderReducer from "./features/user/orderSlice";
import adminAuthReducer from "./features/admin/adminAuthSlice";
import adminProductsReducer from "./features/admin/adminProductSlice";
import adminCouponsReducer from "./features/admin/adminCouponSlice";
import adminReviewReducer from "./features/admin/adminReviewSlice";
import adminOrdersReducer from "./features/admin/adminOrderSlice";

export const store = configureStore({
    reducer : {
        auth: authReducer,
        products: productReducer,
        reviews: reviewReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        address: addressReducer,
        order: orderReducer,
        adminAuth: adminAuthReducer,
        adminProducts: adminProductsReducer,
        adminCoupons: adminCouponsReducer,
        adminReviews: adminReviewReducer,
        adminOrders: adminOrdersReducer,
    },
})

export default store;