"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

export function FormValidationMessage({
  message,
  type = "error", // error, success, warning, info
  className,
  icon = true,
  dismissible = false,
  onDismiss,
  timeout,
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (timeout && visible) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onDismiss) onDismiss()
      }, timeout)

      return () => clearTimeout(timer)
    }
  }, [timeout, visible, onDismiss])

  if (!visible) return null

  const typeStyles = {
    error: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  }

  const iconMap = {
    error: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <AlertCircle className="h-4 w-4" />,
  }

  const handleDismiss = () => {
    setVisible(false)
    if (onDismiss) onDismiss()
  }

  return (
    <div
      className={cn(
        "text-sm px-3 py-2 rounded-md border flex items-start gap-2 animate-in fade-in-50",
        typeStyles[type],
        className,
      )}
    >
      {icon && <span className="mt-0.5">{iconMap[type]}</span>}
      <div className="flex-1">{message}</div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="text-current opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  )
}

export function FormValidationSummary({ errors, className }) {
  if (!errors || Object.keys(errors).length === 0) return null

  return (
    <div className={cn("bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4", className)}>
      <h3 className="text-sm font-medium mb-2">Please fix the following errors:</h3>
      <ul className="list-disc pl-5 space-y-1">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field} className="text-sm">
            {message}
          </li>
        ))}
      </ul>
    </div>
  )
}
