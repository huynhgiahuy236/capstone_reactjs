import axiosInstance from "./axiosInstance"

export const bookingApi = {
    createShowtime: (showtimeData) => {
        return axiosInstance.post('/QuanLyDatVe/TaoLichChieu', showtimeData, {
            headers: {
                'Content-Type': 'application/json-patch+json'
            }
        })
    },
    deleteShowtime: (maLichChieu) => {
        return axiosInstance.delete(`/QuanLyDatVe/XoaLichChieu?MaLichChieu=${maLichChieu}`)
    },
    getTicketRoom: (maLichChieu) => {
        return axiosInstance.get(`/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=${maLichChieu}`)
    },
    bookTickets: (bookingData) => {
        return axiosInstance.post('/QuanLyDatVe/DatVe', bookingData)
    }
}
