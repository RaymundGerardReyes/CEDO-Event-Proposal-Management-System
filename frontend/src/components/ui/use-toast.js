"use client"

import { createContext, useContext, useState } from "react"

// Toast context
const ToastContext = createContext({
  toast: () => { },
  dismiss: () => { },
  toasts: [],
})

// Provider component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = (options) => {
    // Implementation details
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, ...options }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)

    return id
  }

  const dismiss = (toastId) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId))
  }

  return <ToastContext.Provider value={{ toast, dismiss, toasts }}>{children}</ToastContext.Provider>
}

// Hook to use the toast functionality
export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Toaster component to display toasts
export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-white border rounded-lg shadow-lg p-4 ${toast.variant === "destructive" ? "border-red-500" : "border-gray-200"
            }`}
        >
          {toast.title && <h4 className="font-medium">{toast.title}</h4>}
          {toast.description && <p className="text-sm text-gray-500">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}
