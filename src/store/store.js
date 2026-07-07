import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { authMiddleware } from "./middleware/authMiddleware";

export const store = configureStore({
    reducer: {
        auth: authReducer
    },
    middleware: () => [authMiddleware] // thêm authMiddleware vào middleware của store
})