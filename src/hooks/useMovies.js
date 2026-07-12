import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { movieApi } from "../api/movieApi"

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
        mutationFn: (maPhim) => movieApi.deleteMovie(maPhim),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['movieListPhanTrang'] })
        }
    })
}
