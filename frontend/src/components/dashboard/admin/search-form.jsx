"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

export function SearchForm({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
  className,
  buttonText,
  expandable = false,
  size = "default", // default, sm, lg
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isExpanded, setIsExpanded] = useState(!expandable)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchTerm)
  }

  const handleClear = () => {
    setSearchTerm("")
    if (onSearch) onSearch("")
  }

  const toggleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded)
      if (!isExpanded) {
        // Focus the input when expanded
        setTimeout(() => {
          document.getElementById("search-input")?.focus()
        }, 100)
      }
    }
  }

  const sizeClasses = {
    sm: "h-8",
    default: "h-10",
    lg: "h-12",
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", expandable && !isExpanded ? "w-auto" : "w-full", className)}
    >
      {expandable && !isExpanded ? (
        <Button type="button" variant="ghost" size="icon" onClick={toggleExpand} className={cn(sizeClasses[size])}>
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      ) : (
        <>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              type="search"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("pl-8 pr-8", sizeClasses[size])}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>
          {buttonText && (
            <Button type="submit" className={cn("bg-cedo-blue hover:bg-cedo-blue/90", sizeClasses[size])}>
              {buttonText}
            </Button>
          )}
          {expandable && (
            <Button type="button" variant="ghost" size="icon" onClick={toggleExpand} className="md:hidden">
              <X className="h-4 w-4" />
              <span className="sr-only">Close search</span>
            </Button>
          )}
        </>
      )}
    </form>
  )
}
