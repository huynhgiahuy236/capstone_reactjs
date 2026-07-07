import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { userApi } from "../api/userApi"

export const useProfile = (isLoggedIn) => {
    // gọi API lấy thông tin người dùng
    return useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await userApi.getProfile()
            return response.data.content
        },
        enabled: isLoggedIn, // chỉ gọi API khi người dùng đã đăng nhập
        refetchOnMount: 'always', // luôn gọi lại khi component mount
    })
}

export const useUsers = (soTrang = 1, soPhanTuTrenTrang = 10) => {
    return useQuery({
        queryKey: ['users', soTrang, soPhanTuTrenTrang],
        queryFn: async () => {
            const response = await userApi.getUserListPhanTrang('GP01', soTrang, soPhanTuTrenTrang)
            return response.data.content // { currentPage, count, totalPages, totalCount, items }
        }
    })
}

export const useAddUser = () => {
    // dùng queryClient để tương tác với cache của tanstack query
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (userData) => userApi.addUser(userData),
        onSuccess: () => {
            // sau khi thêm user thành công, thông báo tanstack query biết là
            // list data trong cache đã cũ và cần gọi lại API để lấy dữ liệu mới
            queryClient.invalidateQueries({queryKey: ['users']})
        }
    })
}

export const useUpdateUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (userData) => userApi.updateUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (taiKhoan) => userApi.deleteUser(taiKhoan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })
}
