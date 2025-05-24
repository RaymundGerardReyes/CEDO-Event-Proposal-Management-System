"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, X } from "lucide-react"

/**
 * FormValidationMessage component for displaying form validation messages
 * @param {Object} props - Component props
 * @param {string} props.message - The validation message to display
 * @param {string} props.type - The type of message (success, error, warning, info)
 * @param {boolean} props.dismissible - Whether the message can be dismissed
 * @param {Function} props.onDismiss - Function to call when the message is dismissed
 * @param {string} props.className - Additional CSS classes
 */
export function FormValidationMessage({ message, type = "error", dismissible = false, onDismiss, className }) {
    if (!message) return null

    const typeStyles = {
        error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
        success:
            "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900",
        warning:
            "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-900",
        info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
    }

    const icons = {
        error: <AlertCircle className="h-4 w-4" />,
        success: <CheckCircle className="h-4 w-4" />,
        warning: <AlertCircle className="h-4 w-4" />,
        info: <AlertCircle className="h-4 w-4" />,
    }

    return (
        <Alert className={cn("relative", typeStyles[type], className)}>
            <div className="flex">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                {dismissible && (
                    <button
                        type="button"
                        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-900 focus:ring-2 focus:ring-gray-300"
                        onClick={onDismiss}
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </Alert>
    )
}

/**
 * FormValidationSummary component for displaying multiple validation errors
 * @param {Object} props - Component props
 * @param {Object} props.errors - Object containing validation errors
 * @param {string} props.title - Title for the validation summary
 * @param {string} props.className - Additional CSS classes
 */
export function FormValidationSummary({ errors = {}, title = "Please fix the following errors:", className }) {
    const errorMessages = Object.values(errors).filter(Boolean)

    if (errorMessages.length === 0) return null

    return (
        <Alert
            variant="destructive"
            className={cn("bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-900", className)}
        >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-800 dark:text-red-300 font-medium">{title}</AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-300">
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {errorMessages.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    )
}
