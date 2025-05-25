import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef(function PaginationContent({ className, ...props }, ref) {
  return <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
})
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef(function PaginationItem({ className, ...props }, ref) {
  return <li ref={ref} className={cn("", className)} {...props} />
})
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef(function PaginationLink({ className, isActive, size = "icon", ...props }, ref) {
  return (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  )
})
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef(function PaginationPrevious({ className, ...props }, ref) {
  return (
    <PaginationLink ref={ref} aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  )
})
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef(function PaginationNext({ className, ...props }, ref) {
  return (
    <PaginationLink ref={ref} aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
})
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef(function PaginationEllipsis({ className, ...props }, ref) {
  return (
    <span ref={ref} aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
})
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
}

