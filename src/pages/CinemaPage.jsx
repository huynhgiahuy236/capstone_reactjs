import React, { useState } from 'react'
import { useCumRapTheoHeThong, useHeThongRap } from '../hooks/useCinema'
import LoadingSpinner from '../components/LoadingSpinner'

const CinemaPage = () => {
    // state để click vào chuỗi rạp nào thì sẽ hiển thị thông tin cụm rạp đó
    const [selectedCinema, setSelectedCinema] = useState("BHDStar")
    const {
        data: listHeThongRap,
        isLoading: isLoadingHeThongRap,
        isError: isErrorHeThongRap,
    } = useHeThongRap() // custom hook để gọi API lấy thông tin hệ thống rạp

    const {
        data: listCumRapTheoHeThong,
        isLoading: isLoadingCumRapTheoHeThong,
        isError: isErrorCumRapTheoHeThong,
    } = useCumRapTheoHeThong(selectedCinema)

    const handleSelectCinema = (maHeThongRap) => {
        setSelectedCinema(maHeThongRap)
    }

    // hàm để hiển thị logo và số lượng cụm rạp của chuỗi rạp được chọn
    const renderSelectedCinema = listHeThongRap?.find((heThongRap) => heThongRap.maHeThongRap === selectedCinema)

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 py-12 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                    Hệ thống <span className="text-yellow-400">Rạp chiếu</span>
                </h1>
                <p className="text-gray-400 text-lg">Chọn chuỗi rạp để xem danh sách địa điểm</p>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* loading spinner */}
                {
                    isLoadingHeThongRap && (<LoadingSpinner />)
                }

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-72 flex-shrink-0">
                        <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4 font-medium">Chuỗi rạp</h2>
                        <div className="space-y-2">
                            {
                                listHeThongRap?.map((heThongRap) => (
                                    <button
                                        key={heThongRap.maHeThongRap}
                                        onClick={() => handleSelectCinema(heThongRap.maHeThongRap)}
                                        className={
                                            `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                                            ${selectedCinema === heThongRap.maHeThongRap
                                                ? "bg-yellow-400/10 border border-yellow-400 text-yellow-400"
                                                : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                                            }
                                            `
                                        }
                                    >
                                        <img src={heThongRap.logo} alt={heThongRap.tenHeThongRap} className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
                                        <span className="font-medium text-sm text-left">{heThongRap.tenHeThongRap}</span>
                                    </button>
                                ))
                            }

                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <img src={renderSelectedCinema?.logo} alt="Lotte Cinema" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
                            <h2 className="text-2xl font-bold text-yellow-400">{renderSelectedCinema?.tenHeThongRap}</h2>
                        </div>
                        <div className="space-y-4">
                            {
                                listCumRapTheoHeThong?.map((cumRap) => (
                                    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-yellow-400/40 transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-white font-semibold text-lg">{cumRap.tenCumRap}</h3>
                                                <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                                                    <span>📍</span>
                                                    {cumRap.diaChi}
                                                </p>
                                            </div>
                                            <span className="text-yellow-400 text-xs font-medium bg-yellow-400/10 px-3 py-1 rounded-full whitespace-nowrap">
                                                {cumRap.danhSachRap.length} phòng
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {
                                                cumRap.danhSachRap.map((rap) => (
                                                    <span key={rap.maRap} className="bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors">{rap.tenRap}</span>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))
                            }

                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default CinemaPage