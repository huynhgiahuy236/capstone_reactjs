import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { movieApi } from "../api/movieApi"
import { cinemaApi } from "../api/cinemaApi"
import { bookingApi } from "../api/bookingApi"

export const useMovieList = (maNhom = 'GP01', tenPhim = '', enabled = true) => {
    return useQuery({
        queryKey: ['movieList', maNhom, tenPhim],
        queryFn: async () => {
            const response = await movieApi.getMovieList(maNhom, tenPhim)
            return response.data.content
        },
        enabled
    })
}

export const useMovieListPhanTrang = (soTrang = 1, soPhanTuTrenTrang = 10, tenPhim = '') => {
    return useQuery({
        queryKey: ['movieListPhanTrang', soTrang, soPhanTuTrenTrang, tenPhim],
        queryFn: async () => {
            const response = await movieApi.getMovieListPhanTrang('GP01', soTrang, soPhanTuTrenTrang, tenPhim)
            return response.data.content
        }
    })
}

export const useMovieDetail = (maPhim, options = {}) => {
    return useQuery({
        queryKey: ['movieDetail', maPhim],
        queryFn: async () => {
            const response = await movieApi.getMovieDetail(maPhim)
            return response.data.content
        },
        enabled: maPhim !== undefined && maPhim !== null && maPhim !== "",
        retry: false,
        ...options,
    })
}

export const useBanners = () => {
    return useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const response = await movieApi.getBanners()
            return response.data.content
        }
    })
}

export const useAddMovie = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (formData) => movieApi.addMovie(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['movieListPhanTrang'] })
        }
    })
}

export const useUpdateMovie = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (formData) => movieApi.updateMovie(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['movieListPhanTrang'] })
        }
    })
}

export const useDeleteMovie = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (maPhim) => {
            const scheduleResponse = await cinemaApi.getLichChieuPhim(maPhim)
            const cinemaSystems = scheduleResponse.data.content?.heThongRapChieu || []
            const showtimeIds = cinemaSystems.flatMap((cinemaSystem) =>
                (cinemaSystem.cumRapChieu || []).flatMap((cinemaCluster) =>
                    (cinemaCluster.lichChieuPhim || []).map((showtime) => showtime.maLichChieu)
                )
            )

            await Promise.all(showtimeIds.map((maLichChieu) => bookingApi.deleteShowtime(maLichChieu)))
            return movieApi.deleteMovie(maPhim)
        },
        onSuccess: (_, maPhim) => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['movieListPhanTrang'] })
            queryClient.removeQueries({ queryKey: ['lichChieuPhim', maPhim] })
            queryClient.removeQueries({ queryKey: ['movieDetail', maPhim] })
        }
    })
}
