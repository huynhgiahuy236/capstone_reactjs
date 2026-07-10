import { useSelector } from "react-redux"
import { selectorIsLoggedIn } from "../store/authSlice"
import { Navigate, useLocation } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
    // lấy state isLoggedIn từ redux store về
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const location = useLocation()

    if (!isLoggedIn) {
        // nếu chưa đăng nhập, chuyển hướng về trang login
        // replace: true để khi chuyển hướng, trang login sẽ thay thế trang hiện tại trong lịch sử trình duyệt
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return children
}

export default ProtectedRoute
