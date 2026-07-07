import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { logout, selectorIsLoggedIn, selectorUser } from '../store/authSlice'
import { useQueryClient } from '@tanstack/react-query'

const navLinks = [
    { to: '/', label: 'Trang chủ', end: true },
    { to: '/movie#phim-hot', label: 'Phim' },
    { to: '/movie#dang-chieu', label: 'Đặt vé' },
    { to: '/cinema', label: 'Rạp chiếu' }
]

const getNavLinkClassName = (isActive) => (
    `rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
            ? 'bg-yellow-400 text-gray-950 shadow-sm shadow-yellow-400/30'
            : 'text-gray-300 hover:bg-white/10 hover:text-yellow-300'
    }`
)

const navLinkClassName = ({ isActive }) => getNavLinkClassName(isActive)

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const user = useSelector(selectorUser)
    const isAdmin = user?.maLoaiNguoiDung === 'QuanTri'
    const location = useLocation()

    const dispatch = useDispatch()

    // useQueryClient dùng để tương tác với cache của ReactQuery 
    const queryClient = useQueryClient()

    const handleLogout = () => {
        queryClient.removeQueries({ queryKey: ['profile'] })
        dispatch(logout())
        setIsMenuOpen(false)
    }

    const handleCloseMenu = () => {
        setIsMenuOpen(false)
    }

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/95 text-white shadow-xl shadow-black/20 backdrop-blur">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="grid grid-cols-[auto_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto]">
                    <Link onClick={handleCloseMenu} to="/" className="inline-flex w-fit items-center gap-2 text-2xl font-bold text-yellow-400 tracking-wide">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-400 text-xl text-gray-950 shadow-lg shadow-yellow-400/20">
                            🎬
                        </span>
                        <span>MovieApp</span>
                    </Link>

                    <button
                        type="button"
                        aria-label="Mở menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((current) => !current)}
                        className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-yellow-400/50 hover:bg-yellow-400/10 md:hidden"
                    >
                        <span className="flex flex-col gap-1.5">
                            <span className={`block h-0.5 w-5 rounded-full bg-yellow-400 transition-all duration-300 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                            <span className={`block h-0.5 w-5 rounded-full bg-yellow-400 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                            <span className={`block h-0.5 w-5 rounded-full bg-yellow-400 transition-all duration-300 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
                        </span>
                    </button>

                    <nav className="hidden flex-wrap items-center gap-2 md:flex md:justify-center">
                        {navLinks.map((link) => {
                            const [pathname, hash = ''] = link.to.split('#')
                            const isActive = link.end
                                ? location.pathname === pathname
                                : location.pathname === pathname && (!hash || location.hash === `#${hash}`)

                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={getNavLinkClassName(isActive)}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}

                        {isAdmin && (
                            <NavLink to="/admin" className={navLinkClassName}>
                                Admin
                            </NavLink>
                        )}
                    </nav>

                    <div className="hidden md:block">
                        {
                            isLoggedIn ? (
                                <div className='flex flex-wrap gap-3 items-center md:justify-end'>
                                    <Link
                                        to="/profile"
                                        className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 text-sm text-gray-300 transition-all hover:border-yellow-400/40 hover:bg-yellow-400/10 hover:text-white"
                                    >
                                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-800 text-xs font-bold text-yellow-400 group-hover:bg-yellow-400 group-hover:text-gray-950">
                                            {user?.hoTen?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                        Xin chào, <span className="text-yellow-400 font-semibold">{user?.hoTen}</span>
                                    </Link>
                                    <button
                                        className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-all hover:bg-red-500 hover:text-white"
                                        onClick={handleLogout}
                                    >Đăng xuất</button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                    <Link to="/login" className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-gray-950 shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:-translate-y-0.5">
                                        Đăng nhập
                                    </Link>
                                </div>
                            )
                        }
                    </div>
                </div>

                <div className={`grid transition-all duration-300 ease-out md:hidden ${isMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="rounded-2xl border border-white/10 bg-gray-900/95 p-3 shadow-xl shadow-black/30">
                            <nav className="grid gap-2">
                                {navLinks.map((link) => {
                                    const [pathname, hash = ''] = link.to.split('#')
                                    const isActive = link.end
                                        ? location.pathname === pathname
                                        : location.pathname === pathname && (!hash || location.hash === `#${hash}`)

                                    return (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            onClick={handleCloseMenu}
                                            className={`${getNavLinkClassName(isActive)} block text-center`}
                                        >
                                            {link.label}
                                        </Link>
                                    )
                                })}

                                {isAdmin && (
                                    <NavLink onClick={handleCloseMenu} to="/admin" className={({ isActive }) => `${getNavLinkClassName(isActive)} block text-center`}>
                                        Admin
                                    </NavLink>
                                )}
                            </nav>

                            <div className="mt-3 border-t border-white/10 pt-3">
                                {
                                    isLoggedIn ? (
                                        <div className='grid gap-2'>
                                            <Link
                                                onClick={handleCloseMenu}
                                                to="/profile"
                                                className="group flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 pl-2 pr-4 text-sm text-gray-300 transition-all hover:border-yellow-400/40 hover:bg-yellow-400/10 hover:text-white"
                                            >
                                                <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-800 text-xs font-bold text-yellow-400 group-hover:bg-yellow-400 group-hover:text-gray-950">
                                                    {user?.hoTen?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                                Xin chào, <span className="text-yellow-400 font-semibold">{user?.hoTen}</span>
                                            </Link>
                                            <button
                                                className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-all hover:bg-red-500 hover:text-white"
                                                onClick={handleLogout}
                                            >Đăng xuất</button>
                                        </div>
                                    ) : (
                                        <Link onClick={handleCloseMenu} to="/login" className="block rounded-full bg-yellow-400 px-5 py-2 text-center text-sm font-bold text-gray-950 shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300">
                                            Đăng nhập
                                        </Link>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

    )
}

export default Header
