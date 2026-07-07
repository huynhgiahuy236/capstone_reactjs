import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBookTickets, useTicketRoom } from '../hooks/useBooking'
import { useLichChieuPhim } from '../hooks/useCinema'
import { useMovieDetail } from '../hooks/useMovies'

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

const BookingPage = () => {
    const { maPhim } = useParams()
    const [selectedShowtimeId, setSelectedShowtimeId] = useState('')
    const [selectedSeats, setSelectedSeats] = useState([])

    const { data: movie, isLoading: isMovieLoading } = useMovieDetail(maPhim)
    const { data: showtimeDetail, isLoading: isShowtimeLoading, isError: isShowtimeError, error: showtimeError } = useLichChieuPhim(maPhim)
    const { data: ticketRoom, isLoading: isTicketRoomLoading, isError: isTicketRoomError, error: ticketRoomError } = useTicketRoom(selectedShowtimeId)
    const bookTickets = useBookTickets()

    const showtimes = useMemo(() => {
        const systems = showtimeDetail?.heThongRapChieu || []

        return systems.flatMap((system) => (
            system.cumRapChieu?.flatMap((cluster) => (
                cluster.lichChieuPhim?.map((showtime) => ({
                    ...showtime,
                    tenHeThongRap: system.tenHeThongRap,
                    logo: system.logo,
                    tenCumRap: cluster.tenCumRap,
                    diaChi: cluster.diaChi
                })) || []
            )) || []
        ))
    }, [showtimeDetail])

    const selectedShowtime = showtimes.find((showtime) => showtime.maLichChieu?.toString() === selectedShowtimeId)
    const seats = ticketRoom?.danhSachGhe || []
    const movieInfo = ticketRoom?.thongTinPhim
    const totalPrice = selectedSeats.reduce((total, seat) => total + seat.giaVe, 0)
    const isLoading = isMovieLoading || isShowtimeLoading || isTicketRoomLoading || bookTickets.isPending

    const handleSelectShowtime = (maLichChieu) => {
        setSelectedShowtimeId(maLichChieu?.toString())
        setSelectedSeats([])
    }

    const handleToggleSeat = (seat) => {
        if (seat.daDat) return

        const isSelected = selectedSeats.some((item) => item.maGhe === seat.maGhe)
        if (isSelected) {
            setSelectedSeats(selectedSeats.filter((item) => item.maGhe !== seat.maGhe))
            return
        }

        setSelectedSeats([...selectedSeats, seat])
    }

    const handleBookTickets = async () => {
        if (!selectedShowtimeId) {
            alert('Bạn chưa chọn suất chiếu')
            return
        }

        if (selectedSeats.length === 0) {
            alert('Bạn chưa chọn ghế')
            return
        }

        try {
            await bookTickets.mutateAsync({
                maLichChieu: Number(selectedShowtimeId),
                danhSachVe: selectedSeats.map((seat) => ({
                    maGhe: seat.maGhe,
                    giaVe: seat.giaVe
                }))
            })

            alert('Đặt vé thành công')
            setSelectedSeats([])
        } catch (error) {
            console.log(error)
            alert(error.response?.data?.content || 'Đặt vé thất bại')
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
                    <LoadingSpinner />
                </div>
            )}

            <div className="bg-cover bg-center" style={{ backgroundImage: `url(${movie?.hinhAnh || movieInfo?.hinhAnh || ''})` }}>
                <div className="bg-gray-950/85">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        <Link to={`/movie/${maPhim}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors mb-6">
                            Quay lại chi tiết phim
                        </Link>

                        <div className="flex flex-col md:flex-row gap-5">
                            <img
                                src={movie?.hinhAnh || movieInfo?.hinhAnh}
                                alt={movie?.tenPhim || movieInfo?.tenPhim}
                                className="w-32 h-44 object-cover rounded-xl bg-gray-800 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold">{movie?.tenPhim || movieInfo?.tenPhim}</h1>
                                <p className="text-gray-400 mt-3 max-w-3xl line-clamp-3">{movie?.moTa || 'Chọn suất chiếu và ghế để đặt vé.'}</p>

                                {movieInfo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                                        <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                                            <p className="text-gray-500 text-xs mb-1">Cụm rạp</p>
                                            <p className="text-white text-sm">{movieInfo.tenCumRap}</p>
                                        </div>
                                        <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                                            <p className="text-gray-500 text-xs mb-1">Rap</p>
                                            <p className="text-white text-sm">{movieInfo.tenRap}</p>
                                        </div>
                                        <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                                            <p className="text-gray-500 text-xs mb-1">Ngày giờ chiếu</p>
                                            <p className="text-yellow-400 text-sm font-bold">{movieInfo.ngayChieu} {movieInfo.gioChieu}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {isShowtimeError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
                        <p className="font-medium">Không thể tải lịch chiếu</p>
                        <p className="text-sm text-red-300 mt-1">{showtimeError?.response?.data?.content || showtimeError?.message}</p>
                    </div>
                )}

                <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
                    <div className="mb-4">
                        <h2 className="text-white text-xl font-bold">Chọn suất chiếu</h2>
                        <p className="text-gray-500 text-sm mt-1">{showtimes.length} suất chiếu đang có</p>
                    </div>

                    {showtimes.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400">Phim này chưa có lịch chiếu để đặt vé.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {showtimes.map((showtime) => {
                                const isActive = selectedShowtimeId === showtime.maLichChieu?.toString()

                                return (
                                    <button
                                        key={showtime.maLichChieu}
                                        type="button"
                                        onClick={() => handleSelectShowtime(showtime.maLichChieu)}
                                        className={`text-left border rounded-xl px-4 py-3 transition-colors ${isActive ? 'bg-yellow-400/10 border-yellow-400' : 'bg-gray-800/70 border-gray-700 hover:border-yellow-400/60'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={showtime.logo} alt={showtime.tenHeThongRap} className="w-9 h-9 object-contain bg-white rounded p-1 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-white font-semibold line-clamp-1">{showtime.tenCumRap}</p>
                                                <p className="text-gray-500 text-xs mt-1">{showtime.tenRap}</p>
                                            </div>
                                        </div>
                                        <p className="text-yellow-400 font-bold text-sm mt-3">{formatDateTime(showtime.ngayChieuGioChieu)}</p>
                                        <p className="text-gray-400 text-xs mt-1">{formatMoney(showtime.giaVe)} VND</p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8">
                    <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 overflow-x-auto">
                        <div className="text-center mb-8">
                            <div
                                className="w-4/5 mx-auto flex items-end justify-center text-white font-bold text-sm pb-2"
                                style={{
                                    borderBottom: '50px solid rgb(255, 159, 95)',
                                    borderLeft: '50px solid transparent',
                                    borderRight: '50px solid transparent',
                                    filter: 'drop-shadow(4px 20px 15px rgba(255,255,255,0.25))'
                                }}
                            >
                                Màn hình
                            </div>
                        </div>

                        {!selectedShowtimeId && (
                            <div className="text-center py-16">
                                <p className="text-gray-400">Chọn suất chiếu để hiển thị phòng vé.</p>
                            </div>
                        )}

                        {selectedShowtimeId && isTicketRoomError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
                                <p className="font-medium">Không thể tải phòng vé</p>
                                <p className="text-sm text-red-300 mt-1">{ticketRoomError?.response?.data?.content || ticketRoomError?.message}</p>
                            </div>
                        )}

                        {selectedShowtimeId && !isTicketRoomError && seats.length > 0 && (
                            <div className="min-w-max">
                                <div className="grid gap-2 justify-center" style={{ gridTemplateColumns: 'repeat(16, 40px)' }}>
                                    {seats.map((seat) => {
                                        const isSelected = selectedSeats.some((item) => item.maGhe === seat.maGhe)
                                        let seatClass = 'border-orange-500 text-white hover:bg-orange-500/20'

                                        if (seat.daDat) {
                                            seatClass = 'bg-orange-500 border-orange-500 text-gray-900 cursor-not-allowed'
                                        } else if (isSelected) {
                                            seatClass = 'bg-green-400 border-green-400 text-gray-900'
                                        }

                                        return (
                                            <button
                                                key={seat.maGhe}
                                                type="button"
                                                disabled={seat.daDat}
                                                onClick={() => handleToggleSeat(seat)}
                                                className={`w-10 h-8 rounded border-2 text-[11px] font-bold transition-all ${seatClass}`}
                                            >
                                                {seat.tenGhe}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="bg-gray-900 border border-yellow-700 rounded-xl p-5 h-fit xl:sticky xl:top-4">
                        <h2 className="text-yellow-400 text-lg font-extrabold text-center uppercase mb-5">Ghế đã chọn</h2>

                        <div className="flex flex-col gap-2 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-5 rounded bg-orange-500 flex-shrink-0" />
                                <span className="text-yellow-200 text-sm">Ghế đã đặt</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-5 rounded bg-green-400 flex-shrink-0" />
                                <span className="text-yellow-200 text-sm">Ghế đang chọn</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-5 rounded border-2 border-orange-500 flex-shrink-0" />
                                <span className="text-yellow-200 text-sm">Ghế chưa đặt</span>
                            </div>
                        </div>

                        <div className="border border-yellow-700 rounded-xl overflow-hidden mb-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-yellow-700 bg-black/30">
                                        <th className="text-yellow-400 py-2 px-3 text-left font-bold">Ghế</th>
                                        <th className="text-yellow-400 py-2 px-3 text-left font-bold">Giá</th>
                                        <th className="text-yellow-400 py-2 px-3 text-center font-bold">Hủy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSeats.map((seat) => (
                                        <tr key={seat.maGhe} className="border-b border-yellow-900/50">
                                            <td className="text-orange-400 py-2 px-3 font-bold">{seat.tenGhe}</td>
                                            <td className="text-orange-400 py-2 px-3">{formatMoney(seat.giaVe)}</td>
                                            <td className="py-2 px-3 text-center">
                                                <button type="button" onClick={() => handleToggleSeat(seat)} className="text-red-500 font-bold text-base leading-none">
                                                    x
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {selectedSeats.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-yellow-200 py-4 italic">
                                                Chưa chọn ghế
                                            </td>
                                        </tr>
                                    )}

                                    <tr>
                                        <td className="text-yellow-300 py-2 px-3 font-bold">Tổng tiền</td>
                                        <td className="text-orange-400 py-2 px-3 font-extrabold">{formatMoney(totalPrice)}</td>
                                        <td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={handleBookTickets}
                            disabled={!selectedShowtimeId || selectedSeats.length === 0 || bookTickets.isPending}
                            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-900 disabled:text-gray-400 text-black font-extrabold py-3 rounded-xl uppercase text-sm transition-colors"
                        >
                            Đặt vé
                        </button>

                        {selectedShowtime && (
                            <p className="text-gray-500 text-xs mt-4 text-center">
                                {selectedShowtime.tenCumRap} - {selectedShowtime.tenRap}
                            </p>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    )
}

export default BookingPage
