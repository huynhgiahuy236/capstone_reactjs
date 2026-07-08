import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { bookingApi } from "../api/bookingApi"

export const useCreateShowtime = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (showtimeData) => bookingApi.createShowtime(showtimeData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['heThongRap'] })
            queryClient.invalidateQueries({ queryKey: ['lichChieuPhim', variables.maPhim?.toString()] })
        }
    })
}

export const useDeleteShowtime = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ maLichChieu }) => bookingApi.deleteShowtime(maLichChieu),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['movieList'] })
            queryClient.invalidateQueries({ queryKey: ['lichChieuPhim', variables.maPhim?.toString()] })
        }
    })
}

export const useTicketRoom = (maLichChieu) => {
    return useQuery({
        queryKey: ['ticketRoom', maLichChieu],
        queryFn: async () => {
            const response = await bookingApi.getTicketRoom(maLichChieu)
            return response.data.content
        },
        enabled: maLichChieu !== undefined && maLichChieu !== null && maLichChieu !== ""
    })
}

export const useBookTickets = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (bookingData) => bookingApi.bookTickets(bookingData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticketRoom', variables.maLichChieu?.toString()] })
        }
    })
}
