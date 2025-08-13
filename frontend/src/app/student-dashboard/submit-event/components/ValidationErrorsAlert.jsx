import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const ValidationErrorsAlert = ({ errors = {} }) => {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return null

  return (
    <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800 animate-fade-in">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <AlertTitle className="font-semibold text-red-700">Please fix the following errors</AlertTitle>
      <AlertDescription className="mt-2">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {Object.entries(errors).map(([field, message]) => (
            <li key={field} className="text-red-700">
              {message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
