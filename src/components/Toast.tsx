import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { TOAST_DURATION } from '@constants/index'

interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = TOAST_DURATION.NORMAL,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const typeClasses = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-blue-500'
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div
      className={`${typeClasses[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-slide-up max-w-sm`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">{typeIcons[type]}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Hook para usar o Toast
 */
export function useToast() {
  const [toasts, setToasts] = useState<
    Array<{
      id: string
      message: string
      type: 'success' | 'error' | 'warning' | 'info'
      duration?: number
    }>
  >([])

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number) => addToast(message, 'success', duration)
  const error = (message: string, duration?: number) => addToast(message, 'error', duration)
  const warning = (message: string, duration?: number) => addToast(message, 'warning', duration)
  const info = (message: string, duration?: number) => addToast(message, 'info', duration)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
