import { useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import * as Yup from 'yup'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAdminFeedback } from '../../hooks/useAdminFeedback'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAddMovie, useDeleteMovie, useMovieList, useMovieListPhanTrang, useUpdateMovie } from '../../hooks/useMovies'
import { selectorUser } from '../../store/authSlice'

const movieSchema = Yup.object().shape({
  tenPhim: Yup.string().trim().min(2, 'Tên phim phải có ít nhất 2 ký tự').max(100, 'Tên phim không được quá 100 ký tự').required('Tên phim không được để trống'),
  biDanh: Yup.string().trim().max(120, 'Bí danh không được quá 120 ký tự').matches(/^[a-z0-9-]*$/, 'Bí danh chỉ dùng chữ thường không dấu, số và dấu gạch ngang'),
  trailer: Yup.string().trim().url('Trailer phải là một đường dẫn hợp lệ').matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i, 'Trailer phải là đường dẫn YouTube').required('Trailer không được để trống'),
  moTa: Yup.string().trim().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(2000, 'Mô tả không được quá 2000 ký tự').required('Mô tả không được để trống'),
  ngayKhoiChieu: Yup.date().typeError('Ngày khởi chiếu không hợp lệ').required('Ngày khởi chiếu không được để trống'),
  danhGia: Yup.number().typeError('Đánh giá phải là một số').min(0, 'Đánh giá tối thiểu là 0').max(10, 'Đánh giá tối đa là 10').required('Đánh giá không được để trống'),
  hinhAnhFile: Yup.mixed().nullable().test('file-size', 'Ảnh không được vượt quá 5 MB', (file) => !file || file.size <= 5 * 1024 * 1024).test('file-type', 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP', (file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)),
}).test('image-required', 'Vui lòng chọn hình ảnh phim', function (values) {
  return values?.hinhAnh || values?.hinhAnhFile || this.createError({ path: 'hinhAnhFile', message: 'Vui lòng chọn hình ảnh phim' })
}).test('movie-status', 'Phim không thể vừa đang chiếu vừa sắp chiếu', function (values) {
  return !(values?.dangChieu && values?.sapChieu) || this.createError({ path: 'dangChieu', message: 'Chỉ chọn đang chiếu hoặc sắp chiếu' })
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

const createSlug = (text = '') => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const createUploadFileName = (file, values) => {
  const originalName = file?.name || ''
  const extension = originalName.includes('.')
    ? originalName.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'jpg'
  const safeExtension = extension || 'jpg'
  const baseName = createSlug(`${values.tenPhim || 'movie'}-${values.maPhim || Date.now()}`) || 'movie'

  return `${baseName}-${Date.now()}.${safeExtension}`
}

const normalizeText = (text = '') => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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
  const uploadFileName = values.hinhAnhFile ? createUploadFileName(values.hinhAnhFile, values) : ''
  const uploadFile = values.hinhAnhFile
    ? new File([values.hinhAnhFile], uploadFileName, { type: values.hinhAnhFile.type })
    : null
  const imageName = uploadFile?.name || values.hinhAnh

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

  if (imageName) {
    formData.append('hinhAnh', imageName)
  }

  if (uploadFile) {
    formData.append('File', uploadFile)
  }

  return formData
}

const FilmPage = () => {
  const currentUser = useSelector(selectorUser)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { notify, confirm } = useAdminFeedback()
  const PAGE_SIZE = 10
  const isAdmin = currentUser?.maLoaiNguoiDung === 'QuanTri'

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 2000)
  const searchKeyword = debouncedSearchTerm.trim()
  const isSearchMode = searchKeyword !== ''
  const paginatedMovies = useMovieListPhanTrang(currentPage, PAGE_SIZE)
  const allMovies = useMovieList('GP01')
  const addMovie = useAddMovie()
  const updateMovie = useUpdateMovie()
  const deleteMovie = useDeleteMovie()
  const isSubmitting = addMovie.isPending || updateMovie.isPending
  const searchItems = useMemo(() => {
    const keyword = normalizeText(searchKeyword)
    const movieList = allMovies.data || []

    if (!keyword) {
      return movieList
    }

    return movieList.filter((movie) => (
      normalizeText(movie.tenPhim).includes(keyword) ||
      normalizeText(movie.biDanh).includes(keyword) ||
      movie.maPhim?.toString().includes(keyword)
    ))
  }, [searchKeyword, allMovies.data])
  const movies = useMemo(() => {
    if (!isSearchMode) {
      return paginatedMovies.data?.items || []
    }

    const startIndex = (currentPage - 1) * PAGE_SIZE
    return searchItems.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, isSearchMode, paginatedMovies.data?.items, searchItems])
  const totalCount = isSearchMode ? searchItems.length : paginatedMovies.data?.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = isSearchMode ? allMovies.isLoading : paginatedMovies.isLoading
  const isError = isSearchMode ? allMovies.isError : paginatedMovies.isError
  const error = isSearchMode ? allMovies.error : paginatedMovies.error
  const isSearching = searchTerm !== debouncedSearchTerm

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      const timer = window.setTimeout(() => setCurrentPage(totalPages), 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [currentPage, isLoading, totalPages])

  const formik = useFormik({
    initialValues: initialMovieValues,
    validationSchema: movieSchema,
    onSubmit: async (values, { resetForm, setFieldError }) => {
      if (!isAdmin) {
        notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý phim' })
        return
      }

      try {
        const normalizedMovieName = normalizeText(values.tenPhim.trim())
        const duplicatedMovie = (allMovies.data || []).find((movie) => (
          movie.maPhim !== editingMovie?.maPhim &&
          normalizeText(movie.tenPhim?.trim()) === normalizedMovieName
        ))

        if (duplicatedMovie) {
          const message = `Tên phim đã được sử dụng bởi phim mã ${duplicatedMovie.maPhim}`
          setFieldError('tenPhim', message)
          notify({ type: 'error', title: 'Tên phim đã tồn tại', message })
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
        notify({ type: 'success', title: editingMovie ? 'Cập nhật thành công' : 'Thêm phim thành công', message: values.tenPhim })
      } catch (error) {
        const message = error.response?.data?.content || error.message || 'Lưu phim thất bại'
        if (/tên phim|đã tồn tại|movie name/i.test(message)) setFieldError('tenPhim', message)
        notify({ type: 'error', title: 'Lưu phim thất bại', message })
      }
    }
  })

  const openAddModal = () => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý phim' })
      return
    }

    setEditingMovie(null)
    formik.resetForm({ values: initialMovieValues })
    setIsModalOpen(true)
  }

  const openEditModal = (movie) => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý phim' })
      return
    }

    setEditingMovie(movie)
    formik.resetForm({ values: {
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
    } })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    formik.resetForm()
    setEditingMovie(null)
    setIsModalOpen(false)
  }

  const handleDeleteMovie = async (maPhim, tenPhim) => {
    if (!isAdmin) {
      notify({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền quản lý phim' })
      return
    }

    const isConfirmed = await confirm({
      title: 'Xóa phim',
      message: `Bạn có chắc muốn xóa phim ${tenPhim}?`,
      confirmText: 'Xóa phim',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!isConfirmed) {
      return
    }

    try {
      await deleteMovie.mutateAsync(maPhim)
      if (movies.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      }
      notify({ type: 'success', title: 'Xóa phim thành công', message: tenPhim })
    } catch (error) {
      notify({ type: 'error', title: 'Xóa phim thất bại', message: error.response?.data?.content || 'Xóa phim thất bại' })
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

      <div className="flex flex-col mb-6 gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-white text-2xl font-bold">Danh sách phim</h2>
          <p className="text-gray-400 text-sm mt-1">
            Trang <span className="text-yellow-400 font-medium">{currentPage}</span> / {totalPages} - Hiển thị <span className="text-yellow-400 font-medium">{movies.length}</span> / Tổng <span className="text-yellow-400 font-medium">{totalCount}</span> phim
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setCurrentPage(1)
            }}
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
          className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Thêm phim
        </button>
        </div>
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
                movies.map((movie) => (
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(movie)}
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(movie.maPhim, movie.tenPhim)}
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
          !isLoading && movies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">Không tìm thấy phim phù hợp</p>
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
              className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Tên phim</label>
                    <input
                      type="text"
                      {...formik.getFieldProps('tenPhim')}
                      placeholder="Nhập tên phim"
                      className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {formik.touched.biDanh && formik.errors.biDanh && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.biDanh}</p>
                    )}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      onChange={(event) => formik.setFieldValue('hinhAnhFile', event.currentTarget.files[0] || null)}
                      className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                    {editingMovie && formik.values.hinhAnh && !formik.values.hinhAnhFile && (
                      <img
                        src={formik.values.hinhAnh}
                        alt={formik.values.tenPhim}
                        className="w-16 h-20 object-cover rounded-lg bg-gray-800 border border-gray-700 mt-2"
                      />
                    )}
                    {formik.values.hinhAnhFile && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-1">
                        {formik.values.hinhAnhFile.name}
                      </p>
                    )}
                    {formik.touched.hinhAnhFile && formik.errors.hinhAnhFile && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.hinhAnhFile}</p>
                    )}
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
                {formik.errors.dangChieu && formik.submitCount > 0 && (
                  <p className="text-red-500 text-xs">{formik.errors.dangChieu}</p>
                )}

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
