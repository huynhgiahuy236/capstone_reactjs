import axiosInstance from "./axiosInstance"

export const movieApi = {
    getMovieList: (maNhom = 'GP01') => {
        return axiosInstance.get(`/QuanLyPhim/LayDanhSachPhim?maNhom=${maNhom}`)
    },
    getMovieListPhanTrang: (maNhom = 'GP01', soTrang = 1, soPhanTuTrenTrang = 10) => {
        return axiosInstance.get(`/QuanLyPhim/LayDanhSachPhimPhanTrang?maNhom=${maNhom}&soTrang=${soTrang}&soPhanTuTrenTrang=${soPhanTuTrenTrang}`)
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
