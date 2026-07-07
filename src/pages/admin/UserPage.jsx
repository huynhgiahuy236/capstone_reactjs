import { useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as Yup from 'yup'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAdminFeedback } from '../../hooks/useAdminFeedback'
import { useAddUser, useDeleteUser, useUpdateUser, useUsers } from '../../hooks/useUser'
import { login, selectorUser } from '../../store/authSlice'

const userSchema = Yup.object().shape({
  taiKhoan: Yup.string().required('Tài khoản không được để trống'),
  matKhau: Yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu không được để trống'),
  email: Yup.string().email('Email không hợp lệ').required('Email không được để trống'),
  soDt: Yup.string().required('Số điện thoại không được để trống'),
  hoTen: Yup.string().required('Họ tên không được để trống'),
  maLoaiNguoiDung: Yup.string().required('Loại người dùng không được để trống'),
})

const initialUserValues = {
  taiKhoan: '',
  matKhau: '',
  email: '',
  soDt: '',
  hoTen: '',
  maLoaiNguoiDung: 'KhachHang',
  maNhom: 'GP01'
}

const UserPage = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectorUser)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { notify, confirm } = useAdminFeedback()
  const PAGE_SIZE = 10
  const isAdmin = currentUser?.maLoaiNguoiDung === 'QuanTri'

  const { data, isLoading } = useUsers(currentPage, PAGE_SIZE)
  const addUser = useAddUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const users = useMemo(() => data?.items || [], [data?.items])
  const totalPages = data?.totalPages || 1
  const totalCount = data?.totalCount || 0
  const isSubmitting = addUser.isPending || updateUser.isPending
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 2000)
  const isSearching = searchTerm !== debouncedSearchTerm

  const filteredUsers = useMemo(() => {
    const keyword = debouncedSearchTerm.trim().toLowerCase()

    if (!keyword) {
      return users
    }

    return users.filter((user) => {
      return (
        user.taiKhoan?.toLowerCase().includes(keyword) ||
        user.hoTen?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.soDT?.toLowerCase().includes(keyword) ||
        user.soDt?.toLowerCase().includes(keyword) ||
        user.maLoaiNguoiDung?.toLowerCase().includes(keyword)
      )
    })
  }, [users, debouncedSearchTerm])

  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!isAdmin) {
        notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý người dùng' })
        return
      }

      const userData = {
        ...values,
        maNhom: values.maNhom || 'GP01'
      }

      try {
        if (editingUser) {
          await updateUser.mutateAsync(userData)

          if (currentUser?.taiKhoan === userData.taiKhoan) {
            const safeUserData = { ...userData }
            delete safeUserData.matKhau

            dispatch(login({
              ...currentUser,
              ...safeUserData,
              soDT: userData.soDt
            }))
          }
        } else {
          await addUser.mutateAsync(userData)
        }

        resetForm()
        setEditingUser(null)
        setIsModalOpen(false)
        notify({ type: 'success', title: editingUser ? 'Cập nhật thành công' : 'Thêm người dùng thành công', message: userData.taiKhoan })
      } catch (error) {
        console.log(error)
        notify({ type: 'error', title: 'Lưu người dùng thất bại', message: error.response?.data?.content || 'Lưu người dùng thất bại' })
      }
    }
  })

  const openAddModal = () => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý người dùng' })
      return
    }

    setEditingUser(null)
    formik.setValues(initialUserValues)
    setIsModalOpen(true)
  }

  const openEditModal = (user) => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý người dùng' })
      return
    }

    setEditingUser(user)
    formik.setValues({
      taiKhoan: user.taiKhoan || '',
      matKhau: user.matKhau || '',
      email: user.email || '',
      soDt: user.soDT || user.soDt || '',
      hoTen: user.hoTen || '',
      maLoaiNguoiDung: user.maLoaiNguoiDung || 'KhachHang',
      maNhom: user.maNhom || 'GP01'
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    formik.resetForm()
    setEditingUser(null)
    setIsModalOpen(false)
  }

  const handleDeleteUser = async (taiKhoan) => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý người dùng' })
      return
    }

    const isConfirmed = await confirm({
      title: 'Xóa người dùng',
      message: `Bạn có chắc muốn xóa user ${taiKhoan}?`,
      confirmText: 'Xóa user',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!isConfirmed) {
      return
    }

    try {
      await deleteUser.mutateAsync(taiKhoan)
      notify({ type: 'success', title: 'Xóa người dùng thành công', message: taiKhoan })
    } catch (error) {
      console.log(error)
      notify({ type: 'error', title: 'Xóa người dùng thất bại', message: error.response?.data?.content || 'Xóa người dùng thất bại' })
    }
  }

  return (
    <div>
      {
        (isLoading || deleteUser.isPending) && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
            <LoadingSpinner />
          </div>
        )
      }

      <div className="flex flex-col mb-6 gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-white text-2xl font-bold">Danh sách người dùng</h2>
          <p className="text-gray-400 text-sm mt-1">
            Trang <span className="text-yellow-400 font-medium">{currentPage}</span> / {totalPages} - Tổng <span className="text-yellow-400 font-medium">{totalCount}</span> người dùng
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên, tài khoản, email..."
            className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-2">
            {isSearching ? (
              <span className="w-3 h-3 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </span>
        </div>

        <button
          onClick={openAddModal}
          className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Thêm người dùng
        </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">#</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Tài khoản</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Họ tên</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Email</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Số điện thoại</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Loại tài khoản</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {
                filteredUsers.map((user, index) => (
                  <tr key={user.taiKhoan} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <span className="text-white font-medium">{user.taiKhoan}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold text-xs shrink-0">
                          {user.hoTen?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white">{user.hoTen}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-300">{user.email}</td>
                    <td className="px-5 py-4 text-gray-300">{user.soDT}</td>
                    <td className="px-5 py-4">
                      {
                        user.maLoaiNguoiDung === 'KhachHang' ? (
                          <span className="bg-gray-800/50 text-gray-400 border border-gray-700/30 text-xs font-medium px-2.5 py-1 rounded-full">
                            Khách hàng
                          </span>
                        ) : (
                          <span className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 text-xs font-medium px-2.5 py-1 rounded-full">
                            Quản trị
                          </span>
                        )
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(user)}
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.taiKhoan)}
                          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {
          !isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">Không tìm thấy người dùng phù hợp</p>
            </div>
          )
        }
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(page => page - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(page => page + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Sau
        </button>
      </div>

      {
        isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={closeModal}
          >
            <div
              className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <h3 className="text-white text-lg font-bold">
                  {editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
                >
                  x
                </button>
              </div>

              <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Tài khoản</label>
                    <input
                      type="text"
                      {...formik.getFieldProps('taiKhoan')}
                      disabled={!!editingUser}
                      placeholder="Nhập tài khoản"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {formik.touched.taiKhoan && formik.errors.taiKhoan && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.taiKhoan}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Mật khẩu</label>
                    <input
                      type="password"
                      {...formik.getFieldProps('matKhau')}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.matKhau && formik.errors.matKhau && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.matKhau}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Họ tên</label>
                  <input
                    type="text"
                    {...formik.getFieldProps('hoTen')}
                    placeholder="Nhập họ tên"
                    className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.hoTen && formik.errors.hoTen && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.hoTen}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    {...formik.getFieldProps('email')}
                    placeholder="example@email.com"
                    className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      {...formik.getFieldProps('soDt')}
                      placeholder="0901234567"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.soDt && formik.errors.soDt && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.soDt}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Loại tài khoản</label>
                    <select
                      {...formik.getFieldProps('maLoaiNguoiDung')}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    >
                      <option value="KhachHang">Khách hàng</option>
                      <option value="QuanTri">Quản trị</option>
                    </select>
                    {formik.touched.maLoaiNguoiDung && formik.errors.maLoaiNguoiDung && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.maLoaiNguoiDung}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!formik.isValid || isSubmitting}
                    className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-700 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    {editingUser ? 'Cập nhật' : 'Thêm người dùng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default UserPage
