import axios from 'axios'
import { clearStoredUser, getStoredUser } from '../utils/authStorage'

const axiosInstance = axios.create({
  baseURL: 'https://movienew.cybersoft.edu.vn/api',
  headers: {
    TokenCybersoft: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5Mb3AiOiJCb290Y2FtcCA5NSIsIkhldEhhblN0cmluZyI6IjA2LzEyLzIwMjYiLCJIZXRIYW5UaW1lIjoiMTc5NjUxNTIwMDAwMCIsIm5iZiI6MTc2ODQ5NjQwMCwiZXhwIjoxNzk2NjYyODAwfQ.GBx8YXuQEqPaUXMDOr0_pUGzusJf-6qUINIgi5L8LPw',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const user = getStoredUser()

  if (user?.accessToken) {
    config.headers.Authorization = `Bearer ${user.accessToken}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = /DangNhap|DangKy/.test(error.config?.url || '')
    const hadSession = Boolean(getStoredUser()?.accessToken)

    if (error.response?.status === 401 && hadSession && !isAuthRequest) {
      clearStoredUser()

      if (window.location.pathname !== '/login') {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
        window.location.assign(`/login?sessionExpired=1&from=${encodeURIComponent(returnTo)}`)
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
