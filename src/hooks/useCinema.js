import { useQuery } from "@tanstack/react-query"
import { cinemaApi } from "../api/cinemaApi"

export const useHeThongRap = () => {
    return useQuery({
        queryKey: ['heThongRap'],
        queryFn: async () => {
            const response = await cinemaApi.getHeThongRap()
            return response.data.content
        }
    })
}

export const useCumRapTheoHeThong = (maHeThongRap) => {
    return useQuery({
        queryKey: ['cumRapTheoHeThong', maHeThongRap],
        queryFn: async () => {
            const response = await cinemaApi.getCumRapTheoHeThong(maHeThongRap)
            return response.data.content
        },
        // chỉ gọi API khi maHeThongRap có giá trị hợp lệ
        enabled: maHeThongRap !== undefined && maHeThongRap !== null && maHeThongRap !== ""
    })
}

export const useLichChieuPhim = (maPhim) => {
    return useQuery({
        queryKey: ['lichChieuPhim', maPhim],
        queryFn: async () => {
            const response = await cinemaApi.getLichChieuPhim(maPhim)
            return response.data.content
        },
        enabled: maPhim !== undefined && maPhim !== null && maPhim !== "",
        staleTime: 0
    })
}
