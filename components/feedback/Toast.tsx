'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import type { ToastMessage } from '@/lib/store'

interface ActiveToast extends ToastMessage {
  id: string
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  useEffect(() => {
    const handleToast = (e: Event) => {
      const ce = e as CustomEvent<ActiveToast>
      const newToast = ce.detail
      setToasts((prev) => [...prev.slice(-4), newToast])

      if (newToast.durationMs && newToast.durationMs > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
        }, newToast.durationMs)
      }
    }

    window.addEventListener('veyra-toast', handleToast)
    return () => window.removeEventListener('veyra-toast', handleToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2.5 sm:bottom-6 sm:right-6 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const isInfo = toast.type === 'info'

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0A0D14]/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10"
            style={{
              boxShadow: isSuccess
                ? '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(229,9,20,0.2)'
                : '0 10px 30px rgba(0,0,0,0.8)',
            }}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle size={17} className="text-primary" />}
              {isError && <AlertCircle size={17} className="text-rose-500" />}
              {isWarning && <AlertTriangle size={17} className="text-amber-400" />}
              {isInfo && <Info size={17} className="text-cyan" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] text-white/70 leading-snug">{toast.description}</p>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick()
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }}
                  className="mt-2 text-[11px] font-bold text-primary underline underline-offset-2 hover:text-white"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              aria-label="Dismiss toast"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
