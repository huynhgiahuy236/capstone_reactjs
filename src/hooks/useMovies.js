import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { movieApi } from "../api/movieApi"

export const useMovieList = (maNhom = 'GP01') => {
    return useQuery({
        queryKey: ['movieList', maNhom],
        queryFn: async () => {
            const response = await movieApi.getMovieList(maNhom)
            return response.data.content
        }
    })
}

export const useMovieListPhanTrang = (soTrang = 1, soPhanTuTrenTrang = 10) => {
    return useQuery({
        queryKey: ['movieListPhanTrang', soTrang, soPhanTuTrenTrang],
        queryFn: async () => {
            const response = await movieApi.getMovieListPhanTrang('GP01', soTrang, soPhanTuTrenTrang)
            return response.data.content
        }
    })
}

export const useMovieDetail = (maPhim) => {
    return useQuery({
        queryKey: ['movieDetail', maPhim],
        queryFn: async () => {
            const response = await movieApi.getMovieDetail(maPhim)
            return response.data.content
        },
        enabled: maPhim !== undefined && maPhim !== null && maPhim !== ""
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
