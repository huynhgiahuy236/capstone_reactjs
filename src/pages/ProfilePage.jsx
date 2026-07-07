import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingSpinner from '../components/LoadingSpinner'
import { useProfile } from '../hooks/useUser'
import { selectorIsLoggedIn } from '../store/authSlice'

const formatDateTime = (dateValue) => {
    if (!dateValue) return 'Chưa có thời gian'

    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return dateValue

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatMoney = (money) => Number(money || 0).toLocaleString('vi-VN')

const getCinemaInfo = (booking) => {
    const firstSeat = booking.danhSachGhe?.[0]

    return {
        tenHeThongRap: firstSeat?.tenHeThongRap || 'Chưa có hệ thống rạp',
        tenCumRap: firstSeat?.tenCumRap || 'Chưa có cụm rạp',
        tenRap: firstSeat?.tenRap || 'Chưa có rạp'
    }
}

const ProfilePage = () => {
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const { data: profile, isLoading, isError, error } = useProfile(isLoggedIn)
    const avatar = profile?.hoTen?.charAt(0)?.toUpperCase() || 'U'
    const bookingHistory = profile?.thongTinDatVe || []

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
                    <LoadingSpinner />
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 py-10">
                {isError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
                        <p className="font-medium">Không thể tải thông tin tài khoản</p>
                        <p className="text-sm text-red-300 mt-1">{error?.response?.data?.content || error?.message}</p>
                    </div>
                )}

                <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 text-3xl font-bold flex-shrink-0">
                            {avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white">{profile?.hoTen || 'Người dùng'}</h1>
                                <span className="bg-gray-800 text-gray-300 border border-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {profile?.maLoaiNguoiDung === 'QuanTri' ? 'Quản trị' : 'Khách hàng'}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">@{profile?.taiKhoan}</p>
                        </div>

                        {profile?.maLoaiNguoiDung === "QuanTri" && (
                            <Link to="/admin" className="flex-shrink-0 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                                Trang quản trị
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Email</p>
                            <p className="text-white text-sm break-all">{profile?.email || 'Chưa có email'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Số điện thoại</p>
                            <p className="text-white text-sm">{profile?.soDT || profile?.soDt || 'Chưa có số điện thoại'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Nhóm</p>
                            <p className="text-white text-sm">{profile?.maNhom || 'Chưa có nhóm'}</p>
                        </div>
                    </div>
                </div>

                <section>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-2xl font-bold">Lịch sử đặt vé</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {bookingHistory.length} lần đặt vé
                            </p>
                        </div>
                    </div>

                    {bookingHistory.length === 0 && (
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6 py-12 text-center">
                            <p className="text-white font-bold">Bạn chưa có lịch sử đặt vé</p>
                            <p className="text-gray-400 text-sm mt-2">Các vé đã đặt sẽ được hiển thị tại đây.</p>
                            <Link to="/movie" className="inline-flex mt-5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-xl transition-colors">
                                Khám phá phim
                            </Link>
                        </div>
                    )}

                    <div className="space-y-4">
                        {bookingHistory.map((booking) => {
                            const cinemaInfo = getCinemaInfo(booking)
                            const seats = booking.danhSachGhe || []
                            const seatTotalPrice = seats.reduce((total, seat) => total + (seat.giaVe || 0), 0)
                            const totalPrice = seatTotalPrice || (booking.giaVe || 0) * seats.length

                            return (
                                <article key={booking.maVe} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-yellow-400/30 transition-colors">
                                    <div className="flex flex-col md:flex-row gap-4 p-4">
                                        <img
                                            src={booking.hinhAnh}
                                            alt={booking.tenPhim}
                                            className="w-24 h-32 md:w-24 md:h-36 object-cover rounded-xl flex-shrink-0 bg-gray-800"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <h3 className="text-white font-bold text-xl leading-tight">{booking.tenPhim}</h3>
                                                    <p className="text-gray-500 text-sm mt-1">Mã vé: #{booking.maVe}</p>
                                                </div>
                                                <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">
                                                    {formatMoney(totalPrice)} VND
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm mb-4">
                                                <div className="bg-gray-800/70 rounded-lg px-3 py-2">
                                                    <p className="text-gray-500 text-xs mb-1">Ngày đặt</p>
                                                    <p className="text-gray-200">{formatDateTime(booking.ngayDat)}</p>
                                                </div>
                                                <div className="bg-gray-800/70 rounded-lg px-3 py-2">
                                                    <p className="text-gray-500 text-xs mb-1">Thời lượng</p>
                                                    <p className="text-gray-200">{booking.thoiLuongPhim || 0} phút</p>
                                                </div>
                                                <div className="bg-gray-800/70 rounded-lg px-3 py-2">
                                                    <p className="text-gray-500 text-xs mb-1">Số ghế</p>
                                                    <p className="text-gray-200">{seats.length} ghế</p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-gray-500 text-xs mb-1.5">
                                                    {cinemaInfo.tenHeThongRap} - {cinemaInfo.tenCumRap} - {cinemaInfo.tenRap}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {seats.map((seat) => (
                                                        <span key={seat.maGhe} className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded">
                                                            Ghế {seat.tenGhe}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default ProfilePage
