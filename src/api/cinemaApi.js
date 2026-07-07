import axiosInstance from "./axiosInstance"

export const cinemaApi = {
    getHeThongRap: () => {
        return axiosInstance.get('/QuanLyRap/LayThongTinHeThongRap')
    },
    getCumRapTheoHeThong: (maHeThongRap) => {
        return axiosInstance.get(`/QuanLyRap/LayThongTinCumRapTheoHeThong?maHeThongRap=${maHeThongRap}`)
    },
    getLichChieuPhim: (maPhim) => {
        return axiosInstance.get(`/QuanLyRap/LayThongTinLichChieuPhim?MaPhim=${maPhim}`)
    }
}
