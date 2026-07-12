import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { bookingApi } from "../api/bookingApi"

const TICKET_ROOM_STALE_TIME = 20 * 1000

const getTicketRoomQueryOptions = (maLichChieu) => ({
    queryKey: ['ticketRoom', maLichChieu?.toString()],
    queryFn: async () => {
        const response = await bookingApi.getTicketRoom(maLichChieu)
        return response.data.content
    },
    staleTime: TICKET_ROOM_STALE_TIME
})

export const useCreateShowtime = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (showtimeData) => bookingApi.createShowtime(showtimeData),
        onSuccess: async (_, variables) => {
            const movieId = variables.maPhim?.toString()

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['movieList'] }),
                queryClient.invalidateQueries({ queryKey: ['heThongRap'] }),
                queryClient.invalidateQueries({
                    queryKey: ['lichChieuPhim', movieId],
                    refetchType: 'all'
                })
            ])
        }
    })
}

export const useTicketRoom = (maLichChieu) => {
    return useQuery({
        ...getTicketRoomQueryOptions(maLichChieu),
        enabled: maLichChieu !== undefined && maLichChieu !== null && maLichChieu !== "",
        refetchInterval: 5000,
    })
}

export const usePrefetchTicketRoom = () => {
    const queryClient = useQueryClient()

    return useCallback((maLichChieu) => {
        if (maLichChieu === undefined || maLichChieu === null || maLichChieu === "") {
            return Promise.resolve()
        }

        return queryClient.prefetchQuery(getTicketRoomQueryOptions(maLichChieu))
    }, [queryClient])
}

export const useBookTickets = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (bookingData) => bookingApi.bookTickets(bookingData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticketRoom', variables.maLichChieu?.toString()] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
        }
    })
}
