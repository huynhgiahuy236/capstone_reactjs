import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-yellow-400">
              MovieApp
            </Link>
            <p className="mt-4 text-sm leading-6 max-w-sm">
              Nền tảng xem thông tin phim, lịch chiếu và đặt vé nhanh với giao diện hiện đại, dễ sử dụng.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Điều hướng</h3>
            <div className="space-y-3 text-sm">
              <Link to="/" className="block hover:text-yellow-400 transition-colors">Trang chủ</Link>
              <Link to="/movie" className="block hover:text-yellow-400 transition-colors">Danh sách phim</Link>
              <Link to="/cinema" className="block hover:text-yellow-400 transition-colors">Hệ thống rạp</Link>
              <Link to="/profile" className="block hover:text-yellow-400 transition-colors">Tài khoản</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Hỗ trợ</h3>
            <div className="space-y-3 text-sm">
              <p>Hướng dẫn đặt vé</p>
              <p>Câu hỏi thường gặp</p>
              <p>Chính sách bảo mật</p>
              <p>Điều khoản sử dụng</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Liên hệ</h3>
            <div className="space-y-3 text-sm">
              <p>
                Email: <span className="text-gray-300">support@movieapp.vn</span>
              </p>
              <p>
                Hotline: <span className="text-gray-300">1900 1234</span>
              </p>
              <p>
                Thời gian: <span className="text-gray-300">08:00 - 22:00</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
