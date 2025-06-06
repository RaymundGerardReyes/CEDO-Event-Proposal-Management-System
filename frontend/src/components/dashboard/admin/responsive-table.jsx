"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { useState } from "react"

// Enhanced responsive table component with mobile-first approach
export const ResponsiveTable = ({
  data = [],
  columns = [],
  loading = false,
  onRowClick,
  onSort,
  sortBy,
  sortOrder,
  className,
  emptyState,
  mobileCardRenderer,
  ...props
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  // Enhanced mobile card view
  const MobileCard = ({ row, index }) => {
    const isExpanded = expandedRows.has(row.id)

    if (mobileCardRenderer) {
      return mobileCardRenderer(row, index)
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group"
      >
        <Card className="cedo-card-compact cedo-hover-lift responsive-rounded overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            {/* Primary information - always visible */}
            <div className="responsive-flex-between responsive-gap-sm mb-3">
              <div className="min-w-0 flex-1">
                {columns.slice(0, 2).map((column, colIndex) => (
                  <div key={column.key} className={colIndex === 0 ? "mb-1" : ""}>
                    {colIndex === 0 ? (
                      <h3 className="cedo-body font-semibold text-cedo-blue truncate">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </h3>
                    ) : (
                      <p className="cedo-body-sm text-muted-foreground truncate">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {columns.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRowExpansion(row.id)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Secondary information - expandable */}
            <AnimatePresence>
              {(isExpanded || columns.length <= 2) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {columns.slice(2).map((column) => (
                      <div key={column.key} className="responsive-flex-between responsive-gap-sm">
                        <span className="cedo-body-sm text-muted-foreground font-medium">
                          {column.label}:
                        </span>
                        <span className="cedo-body-sm text-right">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Enhanced desktop table view
  const DesktopTable = () => (
    <div className="responsive-rounded border border-border overflow-hidden">
      <Table className="cedo-table">
        <TableHeader>
          <TableRow className="bg-gray-50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "font-semibold text-cedo-blue cedo-body",
                  column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                  column.className
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="responsive-flex items-center responsive-gap-sm">
                  {column.label}
                  {column.sortable && sortBy === column.key && (
                    <div className="text-cedo-blue">
                      {sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length > 0 ? (
            data.map((row, index) => (
              <TableRow
                key={row.id || index}
                className={cn(
                  "cedo-table-row group",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn("cedo-body", column.className)}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 sm:py-12">
                {emptyState || (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                      <MoreVertical className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="cedo-heading-4 mb-2">No data available</h3>
                      <p className="cedo-body text-muted-foreground">
                        There are no items to display at this time.
                      </p>
                    </div>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Mobile view - cards */}
      <div className="block md:hidden">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="cedo-skeleton h-32 responsive-rounded" />
            ))}
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            {data.map((row, index) => (
              <MobileCard key={row.id || index} row={row} index={index} />
            ))}
          </div>
        ) : (
          <Card className="cedo-card">
            <CardContent className="responsive-padding text-center py-12">
              {emptyState || (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MoreVertical className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="cedo-heading-4 mb-2">No data available</h3>
                    <p className="cedo-body text-muted-foreground">
                      There are no items to display at this time.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop view - table */}
      <div className="hidden md:block">
        <DesktopTable />
      </div>
    </div>
  )
}

// Enhanced responsive data grid component
export const ResponsiveDataGrid = ({
  data = [],
  columns = [],
  loading = false,
  gridClassName = "cedo-grid-responsive",
  cardRenderer,
  emptyState,
  ...props
}) => {
  const DefaultCard = ({ item, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="cedo-card-compact cedo-hover-lift">
        <CardContent className="responsive-padding">
          {columns.map((column, colIndex) => (
            <div key={column.key} className={colIndex > 0 ? "mt-2" : ""}>
              {colIndex === 0 ? (
                <h3 className="cedo-body font-semibold text-cedo-blue">
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </h3>
              ) : (
                <div className="responsive-flex-between responsive-gap-sm">
                  <span className="cedo-body-sm text-muted-foreground">
                    {column.label}:
                  </span>
                  <span className="cedo-body-sm">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <div className={gridClassName}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="cedo-skeleton h-32 responsive-rounded" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="cedo-card">
        <CardContent className="responsive-padding text-center py-12">
          {emptyState || (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                <MoreVertical className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="cedo-heading-4 mb-2">No data available</h3>
                <p className="cedo-body text-muted-foreground">
                  There are no items to display at this time.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      initial="hidden"
      animate="visible"
      className={gridClassName}
      {...props}
    >
      {data.map((item, index) => (
        <div key={item.id || index}>
          {cardRenderer ? cardRenderer(item, index) : <DefaultCard item={item} index={index} />}
        </div>
      ))}
    </motion.div>
  )
}

export default ResponsiveTable
