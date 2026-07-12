import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useProfile } from '../hooks/useUser'
import { useMovieList } from '../hooks/useMovies'
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

const SEAT_COLUMN_COUNT = 16

const getSeatRowLabel = (rowIndex) => {
    let label = ''
    let index = rowIndex

    do {
        label = String.fromCharCode(65 + (index % 26)) + label
        index = Math.floor(index / 26) - 1
    } while (index >= 0)

    return label
}

const formatSeatName = (seatName) => {
    const seatNumber = Number.parseInt(seatName, 10)

    if (!Number.isFinite(seatNumber) || seatNumber < 1) {
        return seatName || 'Chưa rõ'
    }

    const seatIndex = seatNumber - 1
    const rowLabel = getSeatRowLabel(Math.floor(seatIndex / SEAT_COLUMN_COUNT))
    const columnNumber = (seatIndex % SEAT_COLUMN_COUNT) + 1

    return `${rowLabel}${columnNumber}`
}

const getBookingPrice = (booking) => {
    const seats = booking.danhSachGhe || []
    const seatTotalPrice = seats.reduce((total, seat) => total + (seat.giaVe || 0), 0)

    return seatTotalPrice || (booking.giaVe || 0) * seats.length
}

const getCinemaInfo = (booking) => {
    const firstSeat = booking.danhSachGhe?.[0]

    return {
        tenHeThongRap: firstSeat?.tenHeThongRap || 'Chưa có hệ thống rạp',
        tenCumRap: firstSeat?.tenCumRap || 'Chưa có cụm rạp',
        tenRap: firstSeat?.tenRap || 'Chưa có rạp'
    }
}

const groupBookingsByMovie = (bookings) => {
    const groupMap = new Map()

    bookings.forEach((booking) => {
        const movieName = booking.tenPhim || 'Phim chưa có tên'

        if (!groupMap.has(movieName)) {
            groupMap.set(movieName, {
                tenPhim: movieName,
                hinhAnh: booking.hinhAnh,
                bookings: []
            })
        }

        groupMap.get(movieName).bookings.push(booking)
    })

    return Array.from(groupMap.values())
}

const BookingHistoryItem = ({ booking }) => {
    const cinemaInfo = getCinemaInfo(booking)
    const seats = booking.danhSachGhe || []
    const totalPrice = getBookingPrice(booking)

    return (
        <article className="border border-gray-700 bg-gray-950/80 rounded-xl p-5 hover:border-yellow-400/50 transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <p className="text-gray-400 text-base">
                        Mã vé: <span className="text-yellow-400 font-black">#{booking.maVe}</span>
                        {booking.maPhim && (
                            <>
                                <span className="text-gray-600"> · </span>
                                Mã phim: <span className="text-yellow-400 font-black">#{booking.maPhim}</span>
                            </>
                        )}
                    </p>
                </div>
                <span className="text-yellow-400 font-black text-base whitespace-nowrap">
                    {formatMoney(totalPrice)} VND
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm mb-5">
                <div className="bg-gray-800/80 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">Ngày đặt</p>
                    <p className="text-gray-100 font-semibold">{formatDateTime(booking.ngayDat)}</p>
                </div>
                <div className="bg-gray-800/80 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">Thời lượng</p>
                    <p className="text-gray-100 font-semibold">{booking.thoiLuongPhim || 0} phút</p>
                </div>
                <div className="bg-gray-800/80 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">Số ghế</p>
                    <p className="text-gray-100 font-semibold">{seats.length} ghế</p>
                </div>
            </div>

            <div>
                <p className="text-gray-400 text-sm mb-2">
                    {cinemaInfo.tenHeThongRap} - {cinemaInfo.tenCumRap} - {cinemaInfo.tenRap}
                </p>
                <div className="flex flex-wrap gap-2">
                    {seats.map((seat) => (
                        <span key={seat.maGhe} className="bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded">
                            Ghế {formatSeatName(seat.tenGhe)}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    )
}

const normalizeMovieName = (movieName) => movieName
    ?.normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('vi-VN') || ''

const MovieBookingGroup = ({ group, isUnavailable }) => {
    const firstBooking = group.bookings[0]

    return (
        <article className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
            <div
                className="absolute left-0 top-0 h-full w-full md:w-72 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url("${group.hinhAnh}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/55 via-gray-950/90 to-gray-950" />
            <div className="absolute inset-0 bg-gray-950/45" />

            <div className="relative p-5">
                <div className="flex flex-col md:flex-row gap-5">
                    <img
                        src={group.hinhAnh}
                        alt={group.tenPhim}
                        className="w-28 h-40 md:w-32 md:h-44 object-cover rounded-xl flex-shrink-0 bg-gray-800 shadow-xl shadow-black/30"
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-white font-black text-2xl leading-tight">{group.tenPhim}</h3>
                                    {isUnavailable && (
                                        <span className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                                            Phim không còn khả dụng
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm mt-2">
                                    {group.bookings.length} lần đặt
                                    {firstBooking?.maPhim && (
                                        <>
                                            <span className="text-gray-600"> · </span>
                                            Mã phim: <span className="text-yellow-400 font-extrabold">#{firstBooking.maPhim}</span>
                                        </>
                                    )}
                                </p>
                                {isUnavailable && (
                                    <div className="mt-4 max-w-2xl rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                                        <p className="font-bold text-amber-300">Phim và lịch chiếu không còn trên hệ thống.</p>
                                        <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                                            Vé của bạn vẫn được lưu trong lịch sử. Yêu cầu hoàn tiền sẽ được xử lý theo chính sách của rạp; vui lòng liên hệ bộ phận hỗ trợ nếu chưa nhận được phản hồi.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {group.bookings.map((booking) => (
                                <BookingHistoryItem key={booking.maVe} booking={booking} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

const ProfilePage = () => {
    const isLoggedIn = useSelector(selectorIsLoggedIn)
    const { data: profile, isLoading, isError, error } = useProfile(isLoggedIn)
    const { data: currentMovies = [], isSuccess: hasLoadedMovies } = useMovieList('GP01', '', isLoggedIn)
    const avatar = profile?.hoTen?.charAt(0)?.toUpperCase() || 'U'
    const bookingHistory = useMemo(() => profile?.thongTinDatVe || [], [profile?.thongTinDatVe])
    const bookingGroups = useMemo(() => groupBookingsByMovie(bookingHistory), [bookingHistory])
    const currentMovieNames = useMemo(
        () => new Set(currentMovies.map((movie) => normalizeMovieName(movie.tenPhim))),
        [currentMovies]
    )
    const currentMovieIds = useMemo(
        () => new Set(currentMovies.map((movie) => movie.maPhim?.toString()).filter(Boolean)),
        [currentMovies]
    )

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
                                {bookingHistory.length} lần đặt vé · {bookingGroups.length} phim
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

                    <div className="space-y-5">
                        {bookingGroups.map((group) => {
                            const movieId = group.bookings[0]?.maPhim?.toString()
                            const isCurrentMovie = (
                                (movieId && currentMovieIds.has(movieId)) ||
                                currentMovieNames.has(normalizeMovieName(group.tenPhim))
                            )

                            return (
                                <MovieBookingGroup
                                    key={movieId || group.tenPhim}
                                    group={group}
                                    isUnavailable={hasLoadedMovies && !isCurrentMovie}
                                />
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default ProfilePage
