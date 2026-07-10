import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-gray-950 px-4 text-center text-white">
      <div>
        <p className="text-7xl font-black text-yellow-400">404</p>
        <h1 className="mt-4 text-2xl font-bold">Không tìm thấy trang</h1>
        <p className="mt-2 text-gray-400">Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 hover:bg-yellow-300">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
