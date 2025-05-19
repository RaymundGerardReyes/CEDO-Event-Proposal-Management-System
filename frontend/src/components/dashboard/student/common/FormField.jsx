// student/common/FormField.jsx
import { Label } from "@/components/dashboard/student/ui/label"; // Assuming path is correct
import { cn } from "@/lib/utils"
import React from "react"

const FormField = ({
  id,
  label,
  required = false,
  error,
  helperText,
  className,
  children,
  labelClassName,
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`

  return (
    <div className={cn("space-y-2 mb-4", className)} {...props}>
      {label && (
        <Label
          htmlFor={fieldId}
          className={cn("flex items-center text-base", error ? "text-destructive" : "", labelClassName)}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {React.cloneElement(children, {
        id: fieldId,
        "aria-invalid": !!error,
        "aria-describedby": `${error ? errorId : ""} ${helperText ? helperId : ""}`.trim() || undefined,
      })}

      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField