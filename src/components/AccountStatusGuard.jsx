import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useUser'
import { logout, selectorIsLoggedIn } from '../store/authSlice'

const AccountStatusGuard = () => {
  const isLoggedIn = useSelector(selectorIsLoggedIn)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { error } = useProfile(isLoggedIn, { refetchInterval: 5000 })
  const status = error?.response?.status
  const message = error?.response?.data?.content || error?.response?.data?.message || ''
  const isBlocked = isLoggedIn && ([400, 401, 403, 404].includes(status) || /tài khoản|account|người dùng/i.test(message))

  if (!isBlocked) return null

  const handleExit = () => {
    queryClient.clear()
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/90 px-4 backdrop-blur-md">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-red-500/40 bg-gray-900 p-6 text-center shadow-2xl shadow-red-950/50">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-500/15 text-2xl text-red-400">!</div>
        <h2 className="text-xl font-black text-white">Tài khoản không còn hoạt động</h2>
        <p className="mt-3 text-sm leading-6 text-gray-300">Tài khoản của bạn đã bị khóa hoặc xóa khỏi hệ thống. Vui lòng thoát khỏi phiên đăng nhập hiện tại.</p>
        <button type="button" onClick={handleExit} className="mt-6 w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-500">Thoát</button>
      </div>
    </div>
  )
}

export default AccountStatusGuard
