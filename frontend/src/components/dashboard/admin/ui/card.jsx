import { cn } from "@/lib/utils"
import React from "react"

const Card = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...rest}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1 sm:space-y-1.5 p-3 sm:p-4 md:p-6",
        className
      )}
      {...rest}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight sm:text-xl md:text-2xl",
        className
      )}
      {...rest}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "text-xs text-muted-foreground sm:text-sm md:text-base",
        className
      )}
      {...rest}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0",
        className
      )}
      {...rest}
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef((props = {}, ref) => {
  const { className, ...rest } = props
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 p-3 pt-0 sm:flex-row sm:items-center sm:p-4 sm:pt-0 md:p-6 md:pt-0",
        className
      )}
      {...rest}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

