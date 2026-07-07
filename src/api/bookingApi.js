import axiosInstance from "./axiosInstance"

export const bookingApi = {
    createShowtime: (showtimeData) => {
        return axiosInstance.post('/QuanLyDatVe/TaoLichChieu', showtimeData)
    },
    getTicketRoom: (maLichChieu) => {
        return axiosInstance.get(`/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=${maLichChieu}`)
    },
    bookTickets: (bookingData) => {
        return axiosInstance.post('/QuanLyDatVe/DatVe', bookingData)
    }
}
