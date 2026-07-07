import { useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import * as Yup from 'yup'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAddMovie, useDeleteMovie, useMovieListPhanTrang, useUpdateMovie } from '../../hooks/useMovies'
import { selectorUser } from '../../store/authSlice'

const movieSchema = Yup.object().shape({
  tenPhim: Yup.string().required('Tên phim không được để trống'),
  trailer: Yup.string().required('Trailer không được để trống'),
  moTa: Yup.string().required('Mô tả không được để trống'),
  ngayKhoiChieu: Yup.string().required('Ngày khởi chiếu không được để trống'),
  danhGia: Yup.number().min(0).max(10).required('Đánh giá không được để trống'),
})

const initialMovieValues = {
  maPhim: '',
  tenPhim: '',
  biDanh: '',
  trailer: '',
  moTa: '',
  ngayKhoiChieu: '',
  danhGia: 0,
  hot: false,
  dangChieu: true,
  sapChieu: false,
  hinhAnh: '',
  hinhAnhFile: null,
  maNhom: 'GP01'
}

const createSlug = (text) => {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const formatInputDate = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

const formatApiDate = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const [year, month, day] = dateValue.split('-')
  return `${day}/${month}/${year}`
}

const buildMovieFormData = (values, isEdit) => {
  const formData = new FormData()

  if (isEdit) {
    formData.append('maPhim', values.maPhim)
  }

  formData.append('tenPhim', values.tenPhim)
  formData.append('biDanh', values.biDanh || createSlug(values.tenPhim))
  formData.append('trailer', values.trailer)
  formData.append('moTa', values.moTa)
  formData.append('maNhom', values.maNhom)
  formData.append('ngayKhoiChieu', formatApiDate(values.ngayKhoiChieu))
  formData.append('danhGia', values.danhGia)
  formData.append('hot', values.hot)
  formData.append('dangChieu', values.dangChieu)
  formData.append('sapChieu', values.sapChieu)

  if (values.hinhAnhFile) {
    formData.append('File', values.hinhAnhFile)
  }

  return formData
}

const FilmPage = () => {
  const currentUser = useSelector(selectorUser)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const isAdmin = currentUser?.maLoaiNguoiDung === 'QuanTri'

  const { data, isLoading, isError, error } = useMovieListPhanTrang(currentPage, PAGE_SIZE)
  const addMovie = useAddMovie()
  const updateMovie = useUpdateMovie()
  const deleteMovie = useDeleteMovie()
  const isSubmitting = addMovie.isPending || updateMovie.isPending
  const movies = useMemo(() => data?.items || [], [data?.items])
  const totalPages = data?.totalPages || 1
  const totalCount = data?.totalCount || 0
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 2000)
  const isSearching = searchTerm !== debouncedSearchTerm

  const filteredMovies = useMemo(() => {
    const keyword = debouncedSearchTerm.trim().toLowerCase()

    if (!keyword) {
      return movies
    }

    return movies.filter((movie) => {
      return (
        movie.tenPhim?.toLowerCase().includes(keyword) ||
        movie.biDanh?.toLowerCase().includes(keyword) ||
        movie.maPhim?.toString().includes(keyword)
      )
    })
  }, [movies, debouncedSearchTerm])

  const formik = useFormik({
    initialValues: initialMovieValues,
    validationSchema: movieSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!isAdmin) {
        alert('Ban khong co quyen quan ly phim')
        return
      }

      try {
        if (editingMovie && !values.hinhAnhFile) {
          alert('API cap nhat phim yeu cau file anh. Vui long chon file anh khi cap nhat phim.')
          return
        }

        const formData = buildMovieFormData(values, !!editingMovie)

        if (editingMovie) {
          await updateMovie.mutateAsync(formData)
        } else {
          await addMovie.mutateAsync(formData)
        }

        resetForm()
        setEditingMovie(null)
        setIsModalOpen(false)
      } catch (error) {
        console.log(error)
        alert(error.response?.data?.content || error.message || 'Lưu phim thất bại')
      }
    }
  })

  const openAddModal = () => {
    if (!isAdmin) {
      alert('Ban khong co quyen quan ly phim')
      return
    }

    setEditingMovie(null)
    formik.setValues(initialMovieValues)
    setIsModalOpen(true)
  }

  const openEditModal = (movie) => {
    if (!isAdmin) {
      alert('Ban khong co quyen quan ly phim')
      return
    }

    setEditingMovie(movie)
    formik.setValues({
      maPhim: movie.maPhim || '',
      tenPhim: movie.tenPhim || '',
      biDanh: movie.biDanh || '',
      trailer: movie.trailer || '',
      moTa: movie.moTa || '',
      ngayKhoiChieu: formatInputDate(movie.ngayKhoiChieu),
      danhGia: movie.danhGia || 0,
      hot: !!movie.hot,
      dangChieu: !!movie.dangChieu,
      sapChieu: !!movie.sapChieu,
      hinhAnh: movie.hinhAnh || '',
      hinhAnhFile: null,
      maNhom: movie.maNhom || 'GP01'
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    formik.resetForm()
    setEditingMovie(null)
    setIsModalOpen(false)
  }

  const handleDeleteMovie = async (maPhim, tenPhim) => {
    if (!isAdmin) {
      alert('Ban khong co quyen quan ly phim')
      return
    }

    const isConfirmed = window.confirm(`Bạn có chắc muốn xóa phim ${tenPhim}?`)

    if (!isConfirmed) {
      return
    }

    try {
      await deleteMovie.mutateAsync(maPhim)
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.content || 'Xóa phim thất bại')
    }
  }

  return (
    <div>
      {
        (isLoading || deleteMovie.isPending) && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
            <LoadingSpinner />
          </div>
        )
      }

      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-white text-2xl font-bold">Danh sách phim</h2>
          <p className="text-gray-400 text-sm mt-1">
            Trang <span className="text-yellow-400 font-medium">{currentPage}</span> / {totalPages} - Hiển thị <span className="text-yellow-400 font-medium">{filteredMovies.length}</span> / Tổng <span className="text-yellow-400 font-medium">{totalCount}</span> phim
          </p>
        </div>

        <div className="relative w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên phim, bí danh, mã phim..."
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
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Thêm phim
        </button>
      </div>

      {
        isError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
            <p className="font-medium">Không thể tải danh sách phim</p>
            <p className="text-sm text-red-300 mt-1">{error?.message}</p>
          </div>
        )
      }

      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Mã phim</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Hình ảnh</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Tên phim</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Ngày khởi chiếu</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Đánh giá</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="text-left text-gray-400 font-medium px-5 py-4 whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {
                filteredMovies.map((movie) => (
                  <tr key={movie.maPhim} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-5 py-4 text-gray-400">#{movie.maPhim}</td>
                    <td className="px-5 py-4">
                      <img
                        src={movie.hinhAnh}
                        alt={movie.tenPhim}
                        className="w-14 h-20 object-cover rounded-lg bg-gray-800"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-white font-medium line-clamp-1">{movie.tenPhim}</p>
                        <p className="text-gray-500 text-xs mt-1">{movie.biDanh}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                      {movie.ngayKhoiChieu}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-yellow-400 font-medium">{movie.danhGia}/10</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {
                          movie.hot && (
                            <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                              Hot
                            </span>
                          )
                        }
                        {
                          movie.dangChieu && (
                            <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                              Đang chiếu
                            </span>
                          )
                        }
                        {
                          movie.sapChieu && (
                            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                              Sắp chiếu
                            </span>
                          )
                        }
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(movie)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(movie.maPhim, movie.tenPhim)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
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
          !isLoading && filteredMovies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">Không tìm thấy phim phù hợp</p>
            </div>
          )
        }
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <h3 className="text-white text-lg font-bold">
                  {editingMovie ? 'Cập nhật phim' : 'Thêm phim mới'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
                >
                  x
                </button>
              </div>

              <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Tên phim</label>
                    <input
                      type="text"
                      {...formik.getFieldProps('tenPhim')}
                      placeholder="Nhập tên phim"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.tenPhim && formik.errors.tenPhim && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.tenPhim}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Bí danh</label>
                    <input
                      type="text"
                      {...formik.getFieldProps('biDanh')}
                      placeholder="Tự động tạo nếu bỏ trống"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Trailer</label>
                  <input
                    type="text"
                    {...formik.getFieldProps('trailer')}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.trailer && formik.errors.trailer && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.trailer}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Mô tả</label>
                  <textarea
                    {...formik.getFieldProps('moTa')}
                    rows={4}
                    placeholder="Nhập mô tả phim"
                    className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm resize-none"
                  />
                  {formik.touched.moTa && formik.errors.moTa && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.moTa}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Ngày khởi chiếu</label>
                    <input
                      type="date"
                      {...formik.getFieldProps('ngayKhoiChieu')}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.ngayKhoiChieu && formik.errors.ngayKhoiChieu && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.ngayKhoiChieu}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Đánh giá</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      {...formik.getFieldProps('danhGia')}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.danhGia && formik.errors.danhGia && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.danhGia}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Hình ảnh</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => formik.setFieldValue('hinhAnhFile', event.currentTarget.files[0])}
                      className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={formik.values.hot}
                      onChange={(event) => formik.setFieldValue('hot', event.target.checked)}
                    />
                    Hot
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={formik.values.dangChieu}
                      onChange={(event) => formik.setFieldValue('dangChieu', event.target.checked)}
                    />
                    Đang chiếu
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={formik.values.sapChieu}
                      onChange={(event) => formik.setFieldValue('sapChieu', event.target.checked)}
                    />
                    Sắp chiếu
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
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
                    {editingMovie ? 'Cập nhật' : 'Thêm phim'}
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

export default FilmPage
