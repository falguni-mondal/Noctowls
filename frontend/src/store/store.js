import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import adminAuthReducer from "./features/admin/adminAuthSlice";
import adminProductsReducer from "./features/admin/adminProductSlice";
export const store = configureStore({
    reducer : {
        auth: authReducer,
        adminAuth: adminAuthReducer,
        adminProducts: adminProductsReducer,
    },
})

export default store;