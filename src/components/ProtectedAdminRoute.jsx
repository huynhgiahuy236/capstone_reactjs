import { useSelector } from "react-redux"
import { selectorIsLoggedIn, selectorUser } from "../store/authSlice"
import { Navigate } from "react-router-dom"

const ProtectedAdminRoute = ({children}) => {
    // isLoggedIn: kiểm tra xem người dùng đã đăng nhập chưa
    // user: kiểm tra role của người dùng (admin hay user)
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const user = useSelector(selectorUser)
    
    // nếu chưa đăng nhập, chuyển hướng về trang login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />
    }

    // nếu không phải là quản trị viên, chuyển hướng về trang home
    if (user?.maLoaiNguoiDung !== "QuanTri") {
        return <Navigate to="/" replace />
    }

    return children
}
export default ProtectedAdminRoute