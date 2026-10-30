import { useCallback, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import ToastContext from './ToastContext'
import cn from '../utils/cn'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback(
    (id) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  )

  const show = useCallback(
    (message, type) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-surface p-3 text-sm text-ink shadow-xl',
              toast.type === 'success' ? 'border-green/50' : 'border-rose/50',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-rose" />
            )}
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="text-faint hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
