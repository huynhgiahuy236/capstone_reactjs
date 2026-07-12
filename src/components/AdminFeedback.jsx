import { useCallback, useEffect, useRef, useState } from 'react'
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
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const previousFocusRef = useRef(null)

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(({ type = 'info', title = 'Thông báo', message = '' }) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`

    setToasts((current) => [...current, { id, type, title, message }])
    window.setTimeout(() => removeToast(id), 3600)
  }, [removeToast])

  const closeConfirm = useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result)
      confirmResolverRef.current = null
    }
    setConfirmState(defaultConfirm)
  }, [])

  const confirm = useCallback((options) => new Promise((resolve) => {
    previousFocusRef.current = document.activeElement
    confirmResolverRef.current = resolve
    setConfirmState({ ...defaultConfirm, ...options, isOpen: true })
  }), [])

  useEffect(() => {
    if (!confirmState.isOpen) return undefined

    cancelButtonRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeConfirm(false)
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [closeConfirm, confirmState.isOpen])

  return (
    <AdminFeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      <div aria-live="polite" aria-atomic="true" className="fixed right-3 top-3 z-[100] flex w-[calc(100vw-24px)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5 sm:w-full">
        {toasts.map((toast) => (
          <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur ${toastStyles[toast.type] || toastStyles.info}`}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${toastDotStyles[toast.type] || toastDotStyles.info}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.message && <p className="mt-1 text-sm text-gray-200">{toast.message}</p>}
              </div>
              <button type="button" aria-label="Đóng thông báo" onClick={() => removeToast(toast.id)} className="ml-2 text-lg leading-none text-gray-300 hover:text-white">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && closeConfirm(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            aria-describedby="feedback-dialog-description"
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl shadow-black/40"
          >
            <div className="mb-5">
              <h2 id="feedback-dialog-title" className="text-lg font-black text-white">{confirmState.title}</h2>
              <div id="feedback-dialog-description" className="mt-3 text-sm leading-6 text-gray-300">{confirmState.message}</div>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button ref={cancelButtonRef} type="button" onClick={() => closeConfirm(false)} className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-300 hover:border-gray-500 hover:text-white">
                {confirmState.cancelText}
              </button>
              <button type="button" onClick={() => closeConfirm(true)} className={`rounded-xl px-5 py-2.5 text-sm font-black ${confirmState.tone === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-400 text-gray-950 hover:bg-yellow-500'}`}>
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminFeedbackContext.Provider>
  )
}
