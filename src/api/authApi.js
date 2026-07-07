import axiosInstance from "./axiosInstance"

export const authApi = {
    // data: { taiKhoan: "string", matKhau: "string" }
    login: (data) => {
        return axiosInstance.post("/QuanLyNguoiDung/DangNhap", data, {
            headers: {
                "Content-Type": "application/json-patch+json"
            }
        })
    }
}