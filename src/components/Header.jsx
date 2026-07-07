import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logout, selectorIsLoggedIn, selectorUser } from '../store/authSlice'
import { useQueryClient } from '@tanstack/react-query'

const Header = () => {
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const user = useSelector(selectorUser)

    const dispatch = useDispatch()

    // useQueryClient dùng để tương tác với cache của ReactQuery 
    const queryClient = useQueryClient()

    const handleLogout = () => {
        queryClient.removeQueries({queryKey: ['profile']})
        dispatch(logout())
    }
    return (
        <header className="bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-yellow-400 tracking-wide">🎬 MovieApp</Link>
                <nav className="flex items-center gap-6">
                    {
                        isLoggedIn ? (
                            <div className='flex gap-3 items-center'>
                                <Link
                                    to="/profile"
                                    className="text-sm text-gray-300"
                                >Xin chào, <span className="text-yellow-400 font-medium">{user?.hoTen}</span>
                                </Link>
                                <button
                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                                    onClick={handleLogout}
                                >Đăng xuất</button>
                            </div>
                        ) : (
                            <div>
                                <Link to="/" className="hover:text-yellow-400 transition-colors">Trang chủ</Link>
                                {/* State: chưa đăng nhập */}
                                <Link to="/login" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Đăng nhập
                                </Link>
                            </div>
                        )
                    }
                </nav>
            </div>
        </header>

    )
}

export default Header
