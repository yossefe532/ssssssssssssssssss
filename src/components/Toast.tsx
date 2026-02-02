import React, { useState, useEffect, ReactNode } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
const listeners: Array<(toast: Toast) => void> = []

export function showToast(message: string, type: ToastType = 'info') {
  const toast: Toast = { id: ++toastId, message, type }
  listeners.forEach((listener) => listener(toast))
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    }
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])
  
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }
  
  const classes = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  }
  
  return (
    <>
      {children}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${classes[toast.type]} flex items-center gap-2 pointer-events-auto`}>
            {icons[toast.type]}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}
