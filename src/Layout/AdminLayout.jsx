import { useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { logout } from '../store/authSlice'

const AdminLayout = () => {

    const navLinkClassName = ({isActive}) => {
        return isActive ?
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-yellow-400 text-gray-900"
        : "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
    }

    const dispatch = useDispatch()
    const queryClient = useQueryClient()

    const handleLogout = () => {
        queryClient.refetchQueries({queryKey: ['profile']})
        dispatch(logout())
    }

    return (
        <div className="min-h-screen bg-gray-950 flex">
            <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="px-6 py-5 border-b border-gray-800">
                    <span className="text-xl font-bold text-yellow-400">MovieApp</span>
                    <p className="text-gray-500 text-xs mt-1">Bảng quản trị</p>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <p className="text-gray-600 text-xs uppercase tracking-widest px-4 mb-3">Quản lý</p>
                    <NavLink to="/admin/users" className={navLinkClassName}>
                        Người dùng
                    </NavLink>
                    <NavLink to="/admin/films" className={navLinkClassName}>
                        Phim
                    </NavLink>
                    <NavLink to="/admin/showtimes" className={navLinkClassName}>
                        Lịch chiếu
                    </NavLink>
                </nav>
                <div className="px-3 pb-4 border-t border-gray-800 pt-4">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                        <span>&lt;</span>
                        Về trang chủ
                    </Link>
                </div>
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-white font-semibold text-lg">Bảng quản trị</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-white text-sm font-medium">Admin User</p>
                            <p className="text-yellow-400 text-xs">Quản trị viên</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                            A
                        </div>
                        <button
                            onClick = {handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                            Đăng xuất
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>

    )
}

export default AdminLayout
