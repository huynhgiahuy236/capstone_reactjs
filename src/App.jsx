import { BrowserRouter, Route, Routes } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import HomeLayout from "./Layout/HomeLayout"
import MovieListPage from "./pages/MovieListPage"
import MovieDetailPage from "./pages/MovieDetailPage"
import NotFoundPage from "./pages/NotFoundPage"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider } from "react-redux"
import { store } from "./store/store"
import AdminLayout from "./Layout/AdminLayout"
import UserPage from "./pages/admin/UserPage"
import CinemaPage from "./pages/CinemaPage"
import ProfilePage from "./pages/ProfilePage"
import BookingPage from "./pages/BookingPage"
import ProtectedRoute from "./components/ProtectedRoute"
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"
import FilmPage from "./pages/admin/FilmPage"
import ShowtimePage from "./pages/admin/ShowtimePage"
import ScrollToTop from "./components/ScrollToTop"

// cài đặt query client ở ngoài App để tất cả các component, page
// đều có thể sử dụng được
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // thời gian dữ liệu được xem là "mới" (fresh) sau khi fetch thành công
      // trong khoảng thời gian này, nếu component nào gọi useQuery với cùng queryKey
      // thì sẽ trả về dữ liệu cũ trong cache mà không gọi API nữa
      staleTime: 5 * 60 * 1000, // 5 phút

      retry: 1, // số lần thử lại khi request thất bại (mặc định là 3)
    }
  }
})

function App() {

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomeLayout />}>
              <Route index element={<MovieListPage />} />
              <Route path="movie" element={<MovieListPage />} />
              <Route path="movie/:maPhim" element={<MovieDetailPage />} />
              <Route path="booking/:maPhim" element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } />
              <Route path="cinema" element={<CinemaPage />} />
              <Route path="profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Route>

            {/* admin routes */}
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }>
              <Route index element={<UserPage />} />
              <Route path="users" element={<UserPage />} />
              <Route path="films" element={<FilmPage />} />
              <Route path="showtimes" element={<ShowtimePage />} />
              <Route path="showtimes/:maPhim" element={<ShowtimePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
