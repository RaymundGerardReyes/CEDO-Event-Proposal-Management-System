"use client"

import { cn } from "@/lib/utils"
import React from "react"

// Enhanced Responsive Container Component
export const ResponsiveContainer = React.forwardRef(({
  size = "default",
  padding = "default",
  animate = false,
  className,
  children,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "max-w-3xl",
    default: "max-w-7xl",
    lg: "max-w-full",
    full: "w-full max-w-none"
  }

  const paddingClasses = {
    none: "",
    minimal: "px-2 sm:px-3 md:px-4",
    compact: "px-3 sm:px-4 md:px-5 lg:px-6",
    sm: "px-2 sm:px-3 md:px-4",
    default: "px-3 sm:px-4 md:px-6 lg:px-8",
    lg: "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
  }

  // Only apply centering for non-full sizes
  const shouldCenter = size !== "full"

  return (
    <div
      ref={ref}
      className={cn(
        "w-full",
        shouldCenter && "mx-auto",
        sizeClasses[size],
        paddingClasses[padding],
        animate && "animate-fade-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveContainer.displayName = "ResponsiveContainer"

// Enhanced Responsive Grid Component
export const ResponsiveGrid = React.forwardRef(({
  columns = 1,
  gap = "default",
  className,
  children,
  ...props
}, ref) => {
  const getColumnClasses = (cols) => {
    if (typeof cols === "object") {
      const { default: defaultCols = 1, sm, md, lg, xl } = cols
      return cn(
        `grid-cols-${defaultCols}`,
        sm && `sm:grid-cols-${sm}`,
        md && `md:grid-cols-${md}`,
        lg && `lg:grid-cols-${lg}`,
        xl && `xl:grid-cols-${xl}`
      )
    }

    // Auto-responsive based on number
    switch (cols) {
      case 1: return "grid-cols-1"
      case 2: return "grid-cols-1 sm:grid-cols-2"
      case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      case 4: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      default: return "grid-cols-1"
    }
  }

  const gapClasses = {
    none: "gap-0",
    sm: "gap-2 sm:gap-3",
    default: "gap-3 sm:gap-4 md:gap-6",
    lg: "gap-4 sm:gap-6 md:gap-8 lg:gap-12"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid",
        getColumnClasses(columns),
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveGrid.displayName = "ResponsiveGrid"

// Enhanced Responsive Flex Component
export const ResponsiveFlex = React.forwardRef(({
  direction = "row",
  justify = "start",
  align = "start",
  gap = "default",
  wrap = true,
  className,
  children,
  ...props
}, ref) => {
  const directionClasses = {
    row: "flex-col sm:flex-row",
    "row-reverse": "flex-col-reverse sm:flex-row-reverse",
    col: "flex-col",
    "col-reverse": "flex-col-reverse",
    responsive: "flex-col sm:flex-row"
  }

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline"
  }

  const gapClasses = {
    none: "gap-0",
    xs: "gap-1 sm:gap-2",
    sm: "gap-2 sm:gap-3",
    default: "gap-2 sm:gap-3 md:gap-4",
    lg: "gap-3 sm:gap-4 md:gap-6",
    xl: "gap-4 sm:gap-6 md:gap-8"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        directionClasses[direction],
        justifyClasses[justify],
        alignClasses[align],
        gapClasses[gap],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveFlex.displayName = "ResponsiveFlex"

// Enhanced Responsive Table Component  
export const ResponsiveTable = React.forwardRef(({
  data = [],
  columns = [],
  loading = false,
  emptyState = null,
  onRowClick = null,
  mobileCardRenderer = null,
  className,
  ...props
}, ref) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return emptyState || (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className={cn(
                  "border-b hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "p-2 sm:p-3 md:p-4 text-xs sm:text-sm",
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row, index)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {data.map((row, index) => (
          mobileCardRenderer
            ? mobileCardRenderer(row, index)
            : (
              <div
                key={row.id || index}
                className={cn(
                  "p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.slice(0, 3).map((column) => (
                  <div key={column.key} className="flex justify-between items-center py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {column.label}:
                    </span>
                    <span className="text-xs">
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : row[column.key]
                      }
                    </span>
                  </div>
                ))}
              </div>
            )
        ))}
      </div>
    </div>
  )
})
ResponsiveTable.displayName = "ResponsiveTable"
