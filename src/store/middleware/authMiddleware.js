// auth middleware nhận action login/logout
// lưu/xóa thông tin user vào localStorage

export const authMiddleware = (store) => (next) => (action) => {
    // B1: Kiểm tra nếu action là login hoặc logout
    const { type, payload } = action
    switch (type) {
        case "auth/login":
            localStorage.setItem("user", JSON.stringify(payload))
            break
        case "auth/logout":
            localStorage.removeItem("user")
            break
        default:
            break
    }
    next(action) // gọi next để action tiếp tục được xử lý bởi reducer
}