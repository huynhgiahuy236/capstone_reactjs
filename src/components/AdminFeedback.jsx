import { useCallback, useRef, useState } from 'react'
import { AdminFeedbackContext } from '../contexts/AdminFeedbackContext'

const toastStyles = {
  success: 'border-green-500/40 bg-green-500/15 text-green-100',
  error: 'border-red-500/40 bg-red-500/15 text-red-100',
  warning: 'border-yellow-400/40 bg-yellow-400/15 text-yellow-100',
  info: 'border-blue-400/40 bg-blue-400/15 text-blue-100',
}

const toastDotStyles = {
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-300',
  info: 'bg-blue-300',
}

const defaultConfirm = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  tone: 'danger',
}

export const AdminFeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(defaultConfirm)
  const confirmResolverRef = useRef(null)

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    )
  }, [])

  const notify = useCallback(
    ({ type = 'info', title = 'Thong bao', message = '' }) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`

      setToasts((currentToasts) => [
        ...currentToasts,
        { id, type, title, message },
      ])

      window.setTimeout(() => removeToast(id), 3600)
    },
    [removeToast],
  )

  const closeConfirm = useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result)
      confirmResolverRef.current = null
    }

    setConfirmState(defaultConfirm)
  }, [])

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmState({
        ...defaultConfirm,
        ...options,
        isOpen: true,
      })
    })
  }, [])

  return (
    <AdminFeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      <div className="fixed right-3 top-3 z-[100] flex w-[calc(100vw-24px)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5 sm:w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur transition-all duration-300 ${toastStyles[toast.type] || toastStyles.info}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${toastDotStyles[toast.type] || toastDotStyles.info}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 text-sm text-gray-200">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-2 cursor-pointer text-lg leading-none text-gray-300 transition-colors hover:text-white"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmState.isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5">
              <p className="text-lg font-black text-white">
                {confirmState.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {confirmState.message}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="cursor-pointer rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-black text-white transition-colors ${
                  confirmState.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-400 text-gray-950 hover:bg-yellow-500'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminFeedbackContext.Provider>
  )
}
