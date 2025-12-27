import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import productReducer from "./features/user/productSlice";
import cartReducer from "./features/user/cartSlice";
import wishlistReducer from "./features/user/wishlistSlice";
import adminAuthReducer from "./features/admin/adminAuthSlice";
import adminProductsReducer from "./features/admin/adminProductSlice";
import adminCouponsReducer from "./features/admin/adminCouponSlice";
export const store = configureStore({
    reducer : {
        products: productReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        auth: authReducer,
        adminAuth: adminAuthReducer,
        adminProducts: adminProductsReducer,
        adminCoupons: adminCouponsReducer,
    },
})

export default store;