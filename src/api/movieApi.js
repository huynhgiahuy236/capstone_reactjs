import axiosInstance from "./axiosInstance"

export const movieApi = {
    getMovieList: (maNhom = 'GP01', tenPhim = '') => {
        const params = { maNhom }

        if (tenPhim) {
            params.tenPhim = tenPhim
        }

        return axiosInstance.get('/QuanLyPhim/LayDanhSachPhim', { params })
    },
    getMovieListPhanTrang: (maNhom = 'GP01', soTrang = 1, soPhanTuTrenTrang = 10, tenPhim = '') => {
        const params = {
            maNhom,
            soTrang,
            soPhanTuTrenTrang
        }

        if (tenPhim) {
            params.tenPhim = tenPhim
        }

        return axiosInstance.get('/QuanLyPhim/LayDanhSachPhimPhanTrang', { params })
    },
    getMovieDetail: (maPhim) => {
        return axiosInstance.get(`/QuanLyPhim/LayThongTinPhim?maPhim=${maPhim}`)
    },
    getBanners: () => {
        return axiosInstance.get('/QuanLyPhim/LayDanhSachBanner')
    },
    addMovie: (formData) => {
        return axiosInstance.post('/QuanLyPhim/ThemPhimUploadHinh', formData)
    },
    updateMovie: (formData) => {
        return axiosInstance.post('/QuanLyPhim/CapNhatPhimUpload', formData)
    },
    deleteMovie: (maPhim) => {
        return axiosInstance.delete(`/QuanLyPhim/XoaPhim?MaPhim=${maPhim}`)
    }
}
