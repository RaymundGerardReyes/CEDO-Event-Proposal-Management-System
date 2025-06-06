import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"

const buttonVariants = (options = {}) => {
  const { variant = "default", size = "default", className } = options

  // Enhanced base classes with responsive design
  const baseClasses = "inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:scale-[1.02] active:scale-[0.98] transform-gpu"

  // Enhanced variant-specific classes with responsive design
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  // Enhanced responsive size classes
  const sizeClasses = {
    default: "h-8 px-3 py-2 text-xs sm:h-10 sm:px-4 sm:py-2 sm:text-sm [&_svg]:size-3 sm:[&_svg]:size-4",
    sm: "h-7 px-2 py-1 text-xs sm:h-9 sm:px-3 sm:rounded-md [&_svg]:size-3",
    lg: "h-9 px-4 py-2 text-sm sm:h-11 sm:px-8 sm:rounded-md sm:text-base [&_svg]:size-4 sm:[&_svg]:size-5",
    icon: "h-8 w-8 sm:h-10 sm:w-10 [&_svg]:size-3 sm:[&_svg]:size-4",
  }

  // Combine all classes with mobile-first approach
  return cn(
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.default,
    className
  )
}

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
