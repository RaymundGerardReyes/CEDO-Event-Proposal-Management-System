"use client"

import { FormActions } from "@/components/dashboard/admin/responsive-form"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/dashboard/admin/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"
import { useState } from "react"

export function FilterForm({
  children,
  onFilter,
  onReset,
  title = "Filters",
  className,
  collapsible = true,
  defaultCollapsed = true,
  mobileSheet = true,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onFilter) {
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      onFilter(data)
    }
    if (isMobile && mobileSheet) {
      setIsOpen(false)
    }
  }

  const handleReset = () => {
    if (onReset) onReset()
    if (isMobile && mobileSheet) {
      setIsOpen(false)
    }
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const filterContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">{children}</div>

      <FormActions>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" className="bg-cedo-blue hover:bg-cedo-blue/90">
          Apply Filters
        </Button>
      </FormActions>
    </form>
  )

  // For mobile, use a sheet
  if (isMobile && mobileSheet) {
    return (
      <div className={className}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {title}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="py-4">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // For desktop
  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {title}
        </h3>
        {collapsible && (
          <Button type="button" variant="ghost" size="sm" onClick={toggleCollapse} className="h-8 w-8 p-0">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            <span className="sr-only">{isCollapsed ? "Expand filters" : "Collapse filters"}</span>
          </Button>
        )}
      </div>

      {!isCollapsed && <div className="p-4">{filterContent}</div>}
    </div>
  )
}
