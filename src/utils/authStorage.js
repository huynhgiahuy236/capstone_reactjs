const AUTH_STORAGE_KEY = 'user'

export const clearStoredUser = () => localStorage.removeItem(AUTH_STORAGE_KEY)

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedUser) return null

  try {
    const user = JSON.parse(storedUser)
    if (!user || typeof user !== 'object' || !user.accessToken) {
      clearStoredUser()
      return null
    }
    return user
  } catch {
    clearStoredUser()
    return null
  }
}

export const setStoredUser = (user) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}
