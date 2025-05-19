// student/ui/pagination.jsx
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
// Removed: import { type ButtonProps, buttonVariants } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"; // Keep buttonVariants as it's used at runtime

const Pagination = ({ className, ...props }) => ( // Removed type annotation React.ComponentProps<"nav">
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef( // Removed generic types HTMLUListElement, React.ComponentProps<"ul">
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef( // Removed generic types HTMLLIElement, React.ComponentProps<"li">
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
  ))
PaginationItem.displayName = "PaginationItem"

// Removed: type PaginationLinkProps = { ... } & Pick<ButtonProps, "size"> & React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, size = "icon", ...props }) => ( // Removed type annotation PaginationLinkProps
  <a
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
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }) => ( // Removed type annotation React.ComponentProps<typeof PaginationLink>
  <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }) => ( // Removed type annotation React.ComponentProps<typeof PaginationLink>
  <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }) => ( // Removed type annotation React.ComponentProps<"span">
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
};

