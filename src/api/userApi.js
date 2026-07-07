import axiosInstance from "./axiosInstance"

export const userApi = {
    getUserListPhanTrang: (maNhom = 'GP01', soTrang = 1, soPhanTuTrenTrang = 10) => {
        return axiosInstance.get(`/QuanLyNguoiDung/LayDanhSachNguoiDungPhanTrang?MaNhom=${maNhom}&soTrang=${soTrang}&soPhanTuTrenTrang=${soPhanTuTrenTrang}`)
    },
    getProfile: () => {
        return axiosInstance.post('/QuanLyNguoiDung/ThongTinTaiKhoan')
    },
    addUser: (userData) => {
        return axiosInstance.post('/QuanLyNguoiDung/ThemNguoiDung', userData)
    },
    updateUser: (userData) => {
        return axiosInstance.post('/QuanLyNguoiDung/CapNhatThongTinNguoiDung', userData)
    },
    deleteUser: (taiKhoan) => {
        return axiosInstance.delete(`/QuanLyNguoiDung/XoaNguoiDung?TaiKhoan=${taiKhoan}`)
    },
}
