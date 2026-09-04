import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    if (typeof message !== 'string') {
      if (Array.isArray(message)) {
        message = message
          .map((item) => item?.msg || JSON.stringify(item))
          .join(', ')
      } else if (message?.msg) {
        message = message.msg
      } else {
        message = JSON.stringify(message)
      }
    }

    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 shadow-md bg-white animate-in fade-in slide-in-from-top-2 ${t.type === 'success' ? 'border-brand-300' : t.type === 'error' ? 'border-rose-300' : 'border-slate-300'
              }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-brand-600 shrink-0 mt-0.5" />}
            {t.type === 'error' && <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info size={18} className="text-slate-500 shrink-0 mt-0.5" />}
            <p className="text-sm text-charcoal flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
