import { Link } from 'react-router-dom'

const MovieCard = ({ movie }) => {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-yellow-400/20 hover:scale-105 transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img src={movie.hinhAnh} alt={movie.tenPhim} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" />

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {movie.hot && (<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">HOT</span>)}
          {movie.dangChieu && (<span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">Đang chiếu</span>)}
          {movie.sapChieu && (<span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">Sắp chiếu</span>)}
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-lg">
          <span className="text-yellow-400 text-sm">*</span>
          <span className="text-white text-sm font-medium">{movie.danhGia}/10</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 truncate">{movie.tenPhim}</h3>
        <p className="text-gray-400 text-sm mb-3">{movie.ngayKhoiChieu}</p>
        <Link to={`/movie/${movie.maPhim}`} className="block text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2 rounded-lg transition-colors">
          Xem chi tiết
        </Link>
      </div>
    </div>
  )
}

export default MovieCard
