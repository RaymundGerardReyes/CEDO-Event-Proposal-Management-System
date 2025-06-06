"use client"

import { cn } from "@/lib/utils"

export function PageHeader({ title, subtitle, className, children, ...props }) {
  return (
    <div className={cn("mb-4 sm:mb-6", className)} {...props}>
      <div className="space-y-1">
        {title && (
          <h1 className="text-xl font-bold tracking-tight text-cedo-blue sm:text-2xl md:text-3xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
