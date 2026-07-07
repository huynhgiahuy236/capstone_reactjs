import { Link, useParams } from 'react-router-dom'
import { useMovieDetail } from '../hooks/useMovies'
import LoadingSpinner from '../components/LoadingSpinner'

const getYoutubeId = (trailerUrl = '') => {
    if (!trailerUrl) return ''

    if (trailerUrl.includes('v=')) {
        return trailerUrl.split('v=')[1]?.split('&')[0] || ''
    }

    return trailerUrl.split('/').pop() || ''
}

const formatDate = (dateValue) => {
    if (!dateValue) return 'Chưa có ngày'

    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return dateValue

    return date.toLocaleDateString('vi-VN')
}

const MovieDetailPage = () => {
    const { maPhim } = useParams()
    const { data: movie, isLoading, isError, error } = useMovieDetail(maPhim)
    const youtubeId = getYoutubeId(movie?.trailer)
    const rating = Number(movie?.danhGia || 0)

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">Không tìm thấy phim</p>
                    <p className="text-gray-500 mb-4">{error?.message}</p>
                    <Link to="/movie" className="text-yellow-400 hover:underline">Quay lại danh sách</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-7xl mx-auto px-4 pt-6">
                <Link to="/movie" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors mb-6">
                    Quay lại danh sách
                </Link>
            </div>

            <div className="relative">
                <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url("${movie?.hinhAnh}")` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-shrink-0">
                            <img
                                src={movie?.hinhAnh}
                                alt={movie?.tenPhim}
                                className="w-64 mx-auto md:mx-0 rounded-2xl shadow-2xl shadow-yellow-400/10"
                            />
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">{movie?.tenPhim}</h1>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {movie?.hot && <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">HOT</span>}
                                {movie?.dangChieu && <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">Đang chiếu</span>}
                                {movie?.sapChieu && <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">Sắp chiếu</span>}
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex gap-1">
                                    {Array.from({ length: 10 }, (_, index) => (
                                        <span key={index} className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                                            *
                                        </span>
                                    ))}
                                </div>
                                <span className="text-yellow-400 font-bold text-xl">{rating}/10</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1">Ngày khởi chiếu</p>
                                    <p className="text-white font-medium">{formatDate(movie?.ngayKhoiChieu)}</p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1">Mã phim</p>
                                    <p className="text-white font-medium">#{movie?.maPhim}</p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1">Nhóm</p>
                                    <p className="text-white font-medium">{movie?.maNhom}</p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1">Bí danh</p>
                                    <p className="text-white font-medium">{movie?.biDanh}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-gray-300 font-semibold mb-2">Mô tả</h3>
                                <p className="text-gray-400 leading-relaxed">{movie?.moTa || 'Chưa có mô tả phim.'}</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {movie?.trailer && (
                                    <a
                                        href={movie.trailer}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                                    >
                                        Xem Trailer
                                    </a>
                                )}
                                {movie?.dangChieu && (
                                    <Link
                                        to={`/booking/${movie.maPhim}`}
                                        className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors"
                                    >
                                        Đặt vé
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {youtubeId && (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h2 className="text-2xl font-bold mb-6">Trailer</h2>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="Movie Trailer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default MovieDetailPage
