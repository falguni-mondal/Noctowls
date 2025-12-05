import {configureStore} from '@reduxjs/toolkit';
import authReducer from "./features/user/authSlice";
import adminAuthReducer from "./features/admin/adminAuthSlice";
export const store = configureStore({
    reducer : {
        auth: authReducer,
        adminAuth: adminAuthReducer,
    },
})

export default store;