import { createSlice } from "@reduxjs/toolkit"
import { getStoredUser } from "../utils/authStorage"

const storedUser = getStoredUser()

const initialState = {
    // để hiển thị tên user trên header, thông tin user trong page profile
    user: storedUser,
    isLoggedIn: Boolean(storedUser?.accessToken)
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
