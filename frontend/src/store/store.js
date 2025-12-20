import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import productReducer from "./features/user/productSlice";
import cartReducer from "./features/user/cartSlice";
import adminAuthReducer from "./features/admin/adminAuthSlice";
import adminProductsReducer from "./features/admin/adminProductSlice";
export const store = configureStore({
    reducer : {
        products: productReducer,
        cart: cartReducer,
        auth: authReducer,
        adminAuth: adminAuthReducer,
        adminProducts: adminProductsReducer,
    },
})

export default store;