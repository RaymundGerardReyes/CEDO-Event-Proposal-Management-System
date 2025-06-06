"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Form = ({ children, ...props }) => {
  return <form {...props}>{children}</form>
}

const FormField = React.forwardRef(({ name, control, render, ...props }, ref) => {
  const field = { name, value: control?.defaultValues?.[name] || "" }
  return render({ field, fieldState: { error: null, invalid: false }, formState: { errors: {} } })
})
FormField.displayName = "FormField"

const FormItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
))
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ ...props }, ref) => <div ref={ref} className="mt-2" {...props} />)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm font-medium text-destructive", className)} {...props}>
    {children}
  </p>
))
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }
