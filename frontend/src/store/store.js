import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import productReducer from "./features/user/productSlice";
import reviewReducer from "./features/user/reviewSlice";
import cartReducer from "./features/user/cartSlice";
import wishlistReducer from "./features/user/wishlistSlice";
import addressReducer from "./features/user/addressSlice";
import orderReducer from "./features/user/orderSlice";
import gokwikReducer from "./features/user/gokwikSlice";
import contactReducer from "./features/user/contactSlice";

import adminAuthReducer from "./features/admin/adminAuthSlice";
import adminDashboardReducer from "./features/admin/adminDashboardSlice";
import adminProductsReducer from "./features/admin/adminProductSlice";
import adminCouponsReducer from "./features/admin/adminCouponSlice";
import adminReviewReducer from "./features/admin/adminReviewSlice";
import adminOrdersReducer from "./features/admin/adminOrderSlice";
import adminUserReducer from "./features/admin/adminUserSlice";
import adminBagReducer from "./features/admin/adminBagSlice";
import adminWishlistReducer from "./features/admin/adminWishlistSlice";

export const store = configureStore({
    reducer : {
        auth: authReducer,
        products: productReducer,
        reviews: reviewReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        address: addressReducer,
        order: orderReducer,
        gokwik: gokwikReducer,
        contact: contactReducer,

        adminAuth: adminAuthReducer,
        adminDashboard: adminDashboardReducer,
        adminProducts: adminProductsReducer,
        adminCoupons: adminCouponsReducer,
        adminReviews: adminReviewReducer,
        adminOrders: adminOrdersReducer,
        adminUsers: adminUserReducer,
        adminBag: adminBagReducer,
        adminWishlist: adminWishlistReducer,
    },
})

export default store;