import { useFormik } from 'formik'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { authApi } from '../api/authApi'
import { useDispatch } from 'react-redux'
import { login } from '../store/authSlice'

const loginSchema = Yup.object().shape({
    taiKhoan: Yup.string().required("Tài khoản không được để trống"),
    matKhau: Yup.string().required("Mật khẩu không được để trống")
})

const LoginPage = () => {
    const [apiError, setApiError] = useState("")

    // dispatch
    const dispatch = useDispatch()

    const navigate = useNavigate()
    const location = useLocation()
    const registeredAccount = location.state?.registeredAccount
    const searchParams = new URLSearchParams(location.search)
    const requestedPath = location.state?.from
        ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
        : searchParams.get('from')

    // hàm xử lý submit form
    const formik = useFormik({
        // giá trị ban đầu của form
        initialValues: {
            taiKhoan: registeredAccount || "adminGiang",
            matKhau: registeredAccount ? "" : "123456"
        },
        // validation schema để validate form
        validationSchema: loginSchema,
        // hàm xử lý khi submit form
        onSubmit: async (values) => {
            setApiError("") // reset lỗi cũ trước khi gọi API
            try {
                const response = await authApi.login(values)

                // dispatch
                dispatch(login(response.data.content))

                navigate(requestedPath || "/", { replace: true })
            } catch (error) {
                setApiError(error.response?.data?.content)
            }
        }
    })

    return (
        <div>
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <a href="/" className="text-3xl font-bold text-yellow-400">🎬 MovieApp</a>
                        <p className="text-gray-400 mt-2">Tài khoản admin demo đã được điền sẵn, chỉ cần nhấn Enter</p>
                    </div>
                    {/* Form Card */}
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
                        <h2 className="text-white text-2xl font-bold mb-6">Đăng nhập</h2>
                        <form onSubmit={formik.handleSubmit}>

                            {(location.state?.registerSuccess || searchParams.get('sessionExpired') === '1') && (
                                <div className="bg-green-500/15 border border-green-500/40 text-green-100 text-sm font-medium px-4 py-3 rounded mb-4">
                                    {location.state?.registerSuccess || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'}
                                </div>
                            )}

                            {
                                apiError && (
                                    <div className="bg-red-500 text-white text-sm font-medium px-4 py-3 rounded mb-4">
                                        {apiError}
                                    </div>
                                )
                            }
                            {/* Tài khoản Field */}
                            <div className="mb-5">
                                <label htmlFor="taiKhoan" className="block text-gray-300 text-sm font-medium mb-2">Tài khoản</label>
                                {/* State: normal */}
                                <input
                                    type="text"
                                    id="taiKhoan"
                                    autoComplete="username"
                                    {...formik.getFieldProps("taiKhoan")}
                                    placeholder="Nhập tài khoản"
                                    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                />
                                {/* State: error — thêm border-red-500, bỏ border-gray-600 */}
                                {/* <input class="w-full bg-gray-700 text-white placeholder-gray-400 border border-red-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400" /> */}
                                {/* Error message — hiện khi có lỗi */}
                                {formik.touched.taiKhoan && formik.errors.taiKhoan && (
                                    <p className="text-red-400 text-sm mt-1">{formik.errors.taiKhoan}</p>
                                )}
                                
                            </div>
                            {/* Password Field */}
                            <div className="mb-6">
                                <label htmlFor="matKhau" className="block text-gray-300 text-sm font-medium mb-2">Mật khẩu</label>
                                <input
                                    type="password"
                                    id="matKhau"
                                    autoComplete="current-password"
                                    {...formik.getFieldProps("matKhau")}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                />
                                {formik.touched.matKhau && formik.errors.matKhau && (
                                    <p className="text-red-400 text-sm mt-1">{formik.errors.matKhau}</p>
                                )}
                                
                            </div>
                            {/* Submit Button: State normal */}
                            <button type="submit" disabled={formik.isSubmitting} className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-yellow-700 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                {formik.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                            {/* Submit Button: State loading */}
                            {/*
    <button disabled class="w-full bg-yellow-700 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
      <div class="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      Đang đăng nhập...
    </button>
    */}
                        </form>
                        <p className="text-center text-gray-400 text-sm mt-6">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-yellow-400 font-bold hover:underline">Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default LoginPage
