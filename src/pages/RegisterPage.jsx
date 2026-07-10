import { useFormik } from 'formik'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { authApi } from '../api/authApi'

const registerSchema = Yup.object().shape({
  taiKhoan: Yup.string()
    .trim()
    .min(4, 'Tài khoản phải có 4-20 ký tự')
    .max(20, 'Tài khoản phải có 4-20 ký tự')
    .matches(/^[A-Za-z0-9_]+$/, 'Chỉ dùng chữ không dấu, số và dấu gạch dưới')
    .required('Tài khoản không được để trống'),
  matKhau: Yup.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(64, 'Mật khẩu không được quá 64 ký tự')
    .matches(/[a-z]/, 'Mật khẩu cần ít nhất 1 chữ thường')
    .matches(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
    .matches(/[0-9]/, 'Mật khẩu cần ít nhất 1 chữ số')
    .matches(/[^A-Za-z0-9]/, 'Mật khẩu cần ít nhất 1 ký tự đặc biệt')
    .matches(/^\S+$/, 'Mật khẩu không được chứa khoảng trắng')
    .required('Mật khẩu không được để trống'),
  xacNhanMatKhau: Yup.string()
    .max(64, 'Mật khẩu xác nhận không hợp lệ')
    .oneOf([Yup.ref('matKhau')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  hoTen: Yup.string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .matches(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Họ tên chỉ được chứa chữ cái')
    .required('Họ tên không được để trống'),
  email: Yup.string()
    .trim()
    .max(254, 'Email không được quá 254 ký tự')
    .email('Email không hợp lệ')
    .required('Email không được để trống'),
  soDt: Yup.string()
    .transform((value) => value?.replace(/[\s.-]/g, ''))
    .matches(/^(?:\+84|0)[35789][0-9]{8}$/, 'Số điện thoại Việt Nam không hợp lệ')
    .required('Số điện thoại không được để trống'),
})

const fields = [
  { name: 'taiKhoan', label: 'Tài khoản', autoComplete: 'new-username', maxLength: 20, placeholder: 'VD: nguyenvana' },
  { name: 'hoTen', label: 'Họ và tên', autoComplete: 'name', maxLength: 50, placeholder: 'VD: Nguyễn Văn A' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'off', maxLength: 254, placeholder: 'VD: nguyenvana@gmail.com' },
  { name: 'soDt', label: 'Số điện thoại', type: 'tel', autoComplete: 'tel', maxLength: 15, inputMode: 'tel', placeholder: 'VD: 0901234567' },
  { name: 'matKhau', label: 'Mật khẩu', type: 'password', autoComplete: 'new-password', maxLength: 64, placeholder: 'VD: Movie@2026' },
  { name: 'xacNhanMatKhau', label: 'Xác nhận mật khẩu', type: 'password', autoComplete: 'new-password', maxLength: 64, placeholder: 'VD: Movie@2026' },
]

const RegisterPage = () => {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')

  const formik = useFormik({
    initialValues: {
      taiKhoan: '',
      matKhau: '',
      xacNhanMatKhau: '',
      hoTen: '',
      email: '',
      soDt: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setApiError('')

      try {
        await authApi.register({
          taiKhoan: values.taiKhoan.trim(),
          matKhau: values.matKhau,
          email: values.email.trim().toLowerCase(),
          soDt: values.soDt.replace(/[\s.-]/g, ''),
          maNhom: 'GP01',
          hoTen: values.hoTen.trim(),
        })

        navigate('/login', {
          replace: true,
          state: {
            registeredAccount: values.taiKhoan.trim(),
            registerSuccess: `Tạo tài khoản ${values.taiKhoan} thành công. Bạn có thể đăng nhập.`,
          },
        })
      } catch (error) {
        setApiError(error.response?.data?.content || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    },
  })

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-bold text-yellow-400">🎬 MovieApp</Link>
          <p className="mt-2 text-gray-400">Tạo tài khoản để chọn ghế và đặt vé</p>
        </div>

        <div className="rounded-2xl bg-gray-800 p-6 shadow-2xl sm:p-8">
          <h1 className="mb-6 text-2xl font-bold">Đăng ký</h1>

          {apiError && (
            <div className="mb-5 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white">
              {apiError}
            </div>
          )}

          <form autoComplete="off" onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map((field) => {
              const hasError = formik.touched[field.name] && formik.errors[field.name]

              return (
                <div key={field.name}>
                  <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-gray-300">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    autoComplete={field.autoComplete}
                    maxLength={field.maxLength}
                    inputMode={field.inputMode}
                    placeholder={field.placeholder}
                    value={formik.values[field.name]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full rounded-lg border bg-gray-700 px-4 py-3 text-white outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 ${hasError ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {hasError && <p className="mt-1 text-sm text-red-400">{formik.errors[field.name]}</p>}
                </div>
              )
            })}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full cursor-pointer rounded-lg bg-yellow-400 py-3 font-bold text-gray-950 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-yellow-700"
              >
                {formik.isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-yellow-400 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
