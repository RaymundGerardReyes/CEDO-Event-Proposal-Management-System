"use client"

import { cn } from "@/lib/utils"

export function ResponsiveForm({ children, className, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4 sm:space-y-6 md:space-y-8 w-full max-w-full", className)}>
      {children}
    </form>
  )
}

export function FormSection({ children, title, description, className }) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium text-cedo-blue">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function FormRow({ children, className }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4", className)}>{children}</div>
}

export function FormField({
  children,
  className,
  label,
  htmlFor,
  error,
  hint,
  required,
  layout = "vertical", // vertical or horizontal
}) {
  return (
    <div className={cn(layout === "horizontal" ? "sm:flex sm:items-start sm:gap-4" : "space-y-2", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "block text-sm font-medium",
            layout === "horizontal" && "sm:w-1/3 sm:pt-2 sm:text-right",
            error ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className={cn(layout === "horizontal" && "sm:w-2/3", "space-y-2")}>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

export function FormActions({ children, className, align = "right" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 pt-2",
        {
          "justify-end": align === "right",
          "justify-start": align === "left",
          "justify-center": align === "center",
          "justify-between": align === "between",
        },
        className,
      )}
    >
      {children}
    </div>
  )
}
