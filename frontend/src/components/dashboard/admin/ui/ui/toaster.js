"use client"

import { useState } from "react"
import { createContext, useContext } from "react"

const ToastContext = createContext({
  toast: () => {},
  dismissToast: () => {},
})

export function Toaster() {
  const { toasts, dismissToast } = useToasts()

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 transform ${
            toast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <h4 className="font-medium">{toast.title}</h4>}
              {toast.description && <p className="text-sm text-gray-500">{toast.description}</p>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="ml-4 text-gray-400 hover:text-gray-500">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant, visible: false }

    setToasts((prev) => [...prev, newToast])

    // Make toast visible after a small delay (for animation)
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)))
    }, 10)

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)

    return id
  }

  const dismissToast = (id) => {
    // First make it invisible (for animation)
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)))

    // Then remove it after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const dismissToast = (id) => {
    // First make it invisible (for animation)
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)))

    // Then remove it after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }

  return { toasts, dismissToast }
}
