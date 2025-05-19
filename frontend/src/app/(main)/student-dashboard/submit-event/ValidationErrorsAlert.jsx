import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const ValidationErrorsAlert = ({ errors }) => {
  if (!errors || Object.keys(errors).length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {Object.entries(errors).map(([field, message]) => (
            <li key={field} className="text-sm">
              {message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
