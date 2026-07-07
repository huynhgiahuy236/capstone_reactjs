// axios instance công dụng sau:
// 1. Tự động thêm baseURL vào tất cả request để rút ngắn URL API
// 2. Tự động thêm header Authorization hoặc các infor khác nếu token tồn tại trong localStorage
// 3. Xử lý lỗi chung (nếu cần) để tránh lặp code ở từng API call
import axios from 'axios'

// Tạo instance với cấu hình mặc định
const axiosInstance = axios.create({
    baseURL: "https://movienew.cybersoft.edu.vn/api",

    // thêm headers chung
    headers: {
        TokenCybersoft: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5Mb3AiOiJCb290Y2FtcCA5NSIsIkhldEhhblN0cmluZyI6IjA2LzEyLzIwMjYiLCJIZXRIYW5UaW1lIjoiMTc5NjUxNTIwMDAwMCIsIm5iZiI6MTc2ODQ5NjQwMCwiZXhwIjoxNzk2NjYyODAwfQ.GBx8YXuQEqPaUXMDOr0_pUGzusJf-6qUINIgi5L8LPw"
    }
})

// tạo interceptor để tự động thêm token vào header nếu có
axiosInstance.interceptors.request.use((config) => {
    // B1: Lấy user từ localStorage
    const user = localStorage.getItem("user")
    console.log("user: ", user)

    // B2: Nếu user tồn tại, thêm vào access token trong user và gửi vào header Authorization
    if (user) {
        // parse user để lấy accessToken
        const { accessToken } = JSON.parse(user)
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    // B3: Trả về config đã chỉnh sửa để request gửi về API
    return config
})

export default axiosInstance