import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    // để hiển thị tên user trên header, thông tin user trong page profile
    user: JSON.parse(localStorage.getItem("user")) || null,
    isLoggedIn: localStorage.getItem("user") !== null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload
            state.isLoggedIn = true
        },
        logout: (state) => {
            state.user = null
            state.isLoggedIn = false
        }
    }
})

export const { login, logout } = authSlice.actions

export const selectorIsLoggedIn = (state) => state.auth.isLoggedIn
export const selectorUser = (state) => state.auth.user

export default authSlice.reducer