import { useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { AdminFeedbackProvider } from '../components/AdminFeedback'
import { logout } from '../store/authSlice'

const AdminLayout = () => {
    const navLinkClassName = ({ isActive }) => {
        return isActive
            ? 'flex shrink-0 items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-yellow-400 text-gray-900'
            : 'flex shrink-0 items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-gray-400 hover:bg-gray-800 hover:text-white'
    }

    const dispatch = useDispatch()
    const queryClient = useQueryClient()

    const handleLogout = () => {
        queryClient.refetchQueries({ queryKey: ['profile'] })
        dispatch(logout())
    }

    return (
        <AdminFeedbackProvider>
            <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
                <aside className="w-full flex-shrink-0 bg-gray-900 border-b border-gray-800 flex flex-col md:w-64 md:border-b-0 md:border-r">
                    <div className="px-4 py-4 border-b border-gray-800 sm:px-6 md:py-5">
                        <span className="text-xl font-bold text-yellow-400">MovieApp</span>
                        <p className="text-gray-500 text-xs mt-1">Bảng quản trị</p>
                    </div>

                    <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:gap-0 md:space-y-1 md:overflow-visible md:py-4">
                        <p className="hidden text-gray-600 text-xs uppercase tracking-widest px-4 mb-3 md:block">Quản lý</p>
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

                    <div className="hidden px-3 pb-4 border-t border-gray-800 pt-4 md:block">
                        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                            <span>&lt;</span>
                            Về trang chủ
                        </Link>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex flex-col gap-3 flex-shrink-0 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-white font-semibold text-lg">Bảng quản trị</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="text-left sm:text-right">
                                <p className="text-white text-sm font-medium">Admin User</p>
                                <p className="text-yellow-400 text-xs">Quản trị viên</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                                A
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Đăng xuất
                            </button>
                            <Link to="/" className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white md:hidden">
                                Trang chủ
                            </Link>
                        </div>
                    </header>

                    <main className="flex-1 p-3 overflow-auto sm:p-4 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </AdminFeedbackProvider>
    )
}

export default AdminLayout
