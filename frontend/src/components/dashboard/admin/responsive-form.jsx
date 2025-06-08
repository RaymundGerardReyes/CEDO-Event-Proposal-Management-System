"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { forwardRef, useState } from "react"

// Enhanced responsive form container
export const ResponsiveForm = forwardRef(({
  children,
  className,
  layout = "default", // default, inline, grid, stacked
  spacing = "default", // sm, default, lg
  maxWidth = "default", // sm, default, lg, xl, full
  onSubmit,
  animate = false,
  ...props
}, ref) => {
  const getLayoutClasses = () => {
    const layouts = {
      default: "space-y-4 sm:space-y-6",
      inline: "flex flex-wrap gap-3 sm:gap-4 items-end",
      grid: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
      stacked: "space-y-2 sm:space-y-3"
    }
    return layouts[layout] || layouts.default
  }

  const getSpacingClasses = () => {
    const spacings = {
      sm: "space-y-2 sm:space-y-3",
      default: "space-y-4 sm:space-y-6",
      lg: "space-y-6 sm:space-y-8"
    }
    return spacings[spacing] || spacings.default
  }

  const getMaxWidthClasses = () => {
    const maxWidths = {
      sm: "max-w-sm",
      default: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-full"
    }
    return maxWidths[maxWidth] || maxWidths.default
  }

  const formClasses = cn(
    "w-full mx-auto",
    getMaxWidthClasses(),
    layout !== "inline" && getSpacingClasses(),
    layout === "inline" && "flex flex-wrap gap-3 sm:gap-4 items-end",
    layout === "grid" && "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
    className
  )

  const Component = animate ? motion.form : "form"

  return (
    <Component
      ref={ref}
      className={formClasses}
      onSubmit={onSubmit}
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      })}
      {...props}
    >
      {children}
    </Component>
  )
})

ResponsiveForm.displayName = "ResponsiveForm"

// Enhanced responsive form field wrapper
export const ResponsiveFormField = forwardRef(({
  children,
  label,
  description,
  error,
  required = false,
  className,
  layout = "default", // default, horizontal, inline
  size = "default", // sm, default, lg
  animate = false,
  ...props
}, ref) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: "space-y-1",
      default: "space-y-2",
      lg: "space-y-3"
    }
    return sizes[size] || sizes.default
  }

  const getLayoutClasses = () => {
    const layouts = {
      default: "space-y-2",
      horizontal: "sm:flex sm:items-start sm:space-y-0 sm:space-x-4",
      inline: "flex items-center space-x-2"
    }
    return layouts[layout] || layouts.default
  }

  const fieldClasses = cn(
    "w-full",
    getSizeClasses(),
    getLayoutClasses(),
    className
  )

  const Component = animate ? motion.div : "div"

  return (
    <Component
      ref={ref}
      className={fieldClasses}
      {...(animate && {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3 }
      })}
      {...props}
    >
      {label && (
        <div className={cn(
          layout === "horizontal" && "sm:w-1/3 sm:pt-2",
          layout === "inline" && "flex-shrink-0"
        )}>
          <Label className={cn(
            "cedo-body font-medium",
            error && "text-destructive",
            size === "sm" && "text-xs",
            size === "lg" && "text-base"
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      <div className={cn(
        layout === "horizontal" && "sm:w-2/3",
        layout === "inline" && "flex-1"
      )}>
        {children}

        {description && !error && (
          <p className={cn(
            "text-muted-foreground mt-1",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {description}
          </p>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 mt-1"
            >
              <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
              <p className={cn(
                "text-destructive",
                size === "sm" ? "text-xs" : "text-sm"
              )}>
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Component>
  )
})

ResponsiveFormField.displayName = "ResponsiveFormField"

// Enhanced responsive input component
export const ResponsiveInput = forwardRef(({
  className,
  type = "text",
  size = "default", // sm, default, lg
  variant = "default", // default, filled, underline
  icon,
  iconPosition = "left", // left, right
  clearable = false,
  loading = false,
  error = false,
  success = false,
  onClear,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [value, setValue] = useState(props.value || props.defaultValue || "")

  const getSizeClasses = () => {
    const sizes = {
      sm: "h-8 px-2 text-sm",
      default: "h-10 px-3 text-sm sm:text-base",
      lg: "h-12 px-4 text-base"
    }
    return sizes[size] || sizes.default
  }

  const getVariantClasses = () => {
    const variants = {
      default: "border border-input bg-background rounded-md",
      filled: "border-0 bg-muted rounded-md",
      underline: "border-0 border-b-2 border-input bg-transparent rounded-none"
    }
    return variants[variant] || variants.default
  }

  const getStateClasses = () => {
    if (error) return "border-destructive focus:border-destructive focus:ring-destructive/20"
    if (success) return "border-green-500 focus:border-green-500 focus:ring-green-500/20"
    return "focus:border-cedo-blue focus:ring-cedo-blue/20"
  }

  const inputClasses = cn(
    "w-full transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    getSizeClasses(),
    getVariantClasses(),
    getStateClasses(),
    icon && iconPosition === "left" && "pl-8 sm:pl-9",
    icon && iconPosition === "right" && "pr-8 sm:pr-9",
    (clearable || type === "password") && "pr-8 sm:pr-9",
    loading && "pr-8 sm:pr-9",
    className
  )

  const handleClear = () => {
    setValue("")
    onClear?.()
  }

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="relative w-full">
      {icon && iconPosition === "left" && (
        <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <icon className={cn(
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
        </div>
      )}

      <Input
        ref={ref}
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        className={inputClasses}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          props.onChange?.(e)
        }}
        {...props}
      />

      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {loading && (
          <Loader2 className={cn(
            "animate-spin text-muted-foreground",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
        )}

        {success && !loading && (
          <Check className={cn(
            "text-green-500",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
        )}

        {type === "password" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={togglePassword}
          >
            {showPassword ? (
              <EyeOff className={cn(
                "text-muted-foreground",
                size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
              )} />
            ) : (
              <Eye className={cn(
                "text-muted-foreground",
                size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
              )} />
            )}
          </Button>
        )}

        {clearable && value && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <AlertCircle className={cn(
              "text-muted-foreground",
              size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
        )}
      </div>

      {icon && iconPosition === "right" && !clearable && !loading && type !== "password" && (
        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <icon className={cn(
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
        </div>
      )}
    </div>
  )
})

ResponsiveInput.displayName = "ResponsiveInput"

// Enhanced responsive select component
export const ResponsiveSelect = forwardRef(({
  className,
  size = "default",
  variant = "default",
  placeholder = "Select an option...",
  options = [],
  value,
  onValueChange,
  error = false,
  success = false,
  loading = false,
  searchable = false,
  multiple = false,
  ...props
}, ref) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: "h-8 text-sm",
      default: "h-10 text-sm sm:text-base",
      lg: "h-12 text-base"
    }
    return sizes[size] || sizes.default
  }

  const getVariantClasses = () => {
    const variants = {
      default: "border border-input bg-background rounded-md",
      filled: "border-0 bg-muted rounded-md",
      underline: "border-0 border-b-2 border-input bg-transparent rounded-none"
    }
    return variants[variant] || variants.default
  }

  const getStateClasses = () => {
    if (error) return "border-destructive focus:border-destructive"
    if (success) return "border-green-500 focus:border-green-500"
    return "focus:border-cedo-blue"
  }

  const selectClasses = cn(
    "w-full",
    getSizeClasses(),
    getVariantClasses(),
    getStateClasses(),
    className
  )

  return (
    <Select value={value} onValueChange={onValueChange} {...props}>
      <SelectTrigger ref={ref} className={selectClasses}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

ResponsiveSelect.displayName = "ResponsiveSelect"

// Enhanced responsive textarea component
export const ResponsiveTextarea = forwardRef(({
  className,
  size = "default",
  variant = "default",
  resize = "vertical", // none, vertical, horizontal, both
  autoResize = false,
  error = false,
  success = false,
  ...props
}, ref) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: "min-h-[60px] px-2 py-1 text-sm",
      default: "min-h-[80px] px-3 py-2 text-sm sm:text-base",
      lg: "min-h-[100px] px-4 py-3 text-base"
    }
    return sizes[size] || sizes.default
  }

  const getVariantClasses = () => {
    const variants = {
      default: "border border-input bg-background rounded-md",
      filled: "border-0 bg-muted rounded-md",
      underline: "border-0 border-b-2 border-input bg-transparent rounded-none"
    }
    return variants[variant] || variants.default
  }

  const getResizeClasses = () => {
    const resizes = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize"
    }
    return resizes[resize] || resizes.vertical
  }

  const getStateClasses = () => {
    if (error) return "border-destructive focus:border-destructive focus:ring-destructive/20"
    if (success) return "border-green-500 focus:border-green-500 focus:ring-green-500/20"
    return "focus:border-cedo-blue focus:ring-cedo-blue/20"
  }

  const textareaClasses = cn(
    "w-full transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    getSizeClasses(),
    getVariantClasses(),
    getResizeClasses(),
    getStateClasses(),
    className
  )

  return (
    <Textarea
      ref={ref}
      className={textareaClasses}
      {...props}
    />
  )
})

ResponsiveTextarea.displayName = "ResponsiveTextarea"

// Enhanced responsive form card wrapper
export const ResponsiveFormCard = forwardRef(({
  children,
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  size = "default",
  variant = "default",
  animate = false,
  ...props
}, ref) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: "p-4",
      default: "p-6 sm:p-8",
      lg: "p-8 sm:p-10 md:p-12"
    }
    return sizes[size] || sizes.default
  }

  const Component = animate ? motion.div : Card

  return (
    <Component
      ref={ref}
      className={cn("cedo-card", className)}
      {...(animate && {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3 }
      })}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("pb-4 sm:pb-6", headerClassName)}>
          {title && (
            <CardTitle className="cedo-heading-3">
              {title}
            </CardTitle>
          )}
          {description && (
            <p className="cedo-body text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </CardHeader>
      )}

      <CardContent className={cn(getSizeClasses(), contentClassName)}>
        {children}
      </CardContent>
    </Component>
  )
})

ResponsiveFormCard.displayName = "ResponsiveFormCard"

// FormSection component for organizing form content
export const FormSection = forwardRef(({
  children,
  title,
  description,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    >
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-medium leading-none tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
})

FormSection.displayName = "FormSection"

// FormActions component for form buttons
export const FormActions = forwardRef(({
  children,
  className,
  align = "right", // left, center, right, between
  variant = "default", // default, inline, stacked
  ...props
}, ref) => {
  const getAlignClasses = () => {
    const alignments = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
      between: "justify-between"
    }
    return alignments[align] || alignments.right
  }

  const getVariantClasses = () => {
    const variants = {
      default: "flex gap-3",
      inline: "flex gap-2",
      stacked: "flex flex-col gap-2"
    }
    return variants[variant] || variants.default
  }

  return (
    <div
      ref={ref}
      className={cn(
        "pt-4 mt-6 border-t border-border",
        getVariantClasses(),
        getAlignClasses(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

FormActions.displayName = "FormActions"

// FormField component (alias for ResponsiveFormField for compatibility)
export const FormField = ResponsiveFormField

export default ResponsiveForm
