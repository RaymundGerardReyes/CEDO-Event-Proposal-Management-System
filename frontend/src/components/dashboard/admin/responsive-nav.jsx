"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

// Enhanced responsive navigation component with mobile-first approach
export const ResponsiveNav = ({
  items = [],
  className,
  orientation = "horizontal", // horizontal, vertical
  variant = "default", // default, pills, underline, sidebar
  size = "default", // sm, default, lg
  showIcons = true,
  showBadges = true,
  collapsible = false,
  mobileBreakpoint = "md",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const pathname = usePathname()

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const isActive = (item) => {
    if (item.href === pathname) return true
    if (item.children) {
      return item.children.some(child => child.href === pathname)
    }
    return false
  }

  const getVariantClasses = () => {
    const variants = {
      default: "border-b border-border bg-background",
      pills: "bg-muted/30 rounded-lg p-1",
      underline: "border-b border-border",
      sidebar: "bg-card border-r border-border"
    }
    return variants[variant] || variants.default
  }

  const getItemClasses = (item, isChild = false) => {
    const baseClasses = "relative flex items-center gap-2 transition-all duration-200"
    const sizeClasses = {
      sm: "px-2 py-1 text-sm",
      default: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base"
    }

    const variantClasses = {
      default: isActive(item)
        ? "text-cedo-blue bg-cedo-blue/10 border-b-2 border-cedo-blue"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      pills: isActive(item)
        ? "text-cedo-blue bg-white shadow-sm rounded-md"
        : "text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-md",
      underline: isActive(item)
        ? "text-cedo-blue border-b-2 border-cedo-blue"
        : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-muted",
      sidebar: isActive(item)
        ? "text-cedo-blue bg-cedo-blue/10 border-r-2 border-cedo-blue"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }

    const childClasses = isChild ? "ml-6 text-xs" : ""

    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      childClasses,
      item.disabled && "opacity-50 cursor-not-allowed"
    )
  }

  // Enhanced navigation item component
  const NavItem = ({ item, isChild = false }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const itemActive = isActive(item)

    const ItemContent = () => (
      <>
        {showIcons && item.icon && (
          <item.icon className={cn(
            "flex-shrink-0",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
        )}
        <span className="flex-1 truncate">{item.label}</span>
        {showBadges && item.badge && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {item.badge}
          </Badge>
        )}
        {hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          </motion.div>
        )}
      </>
    )

    if (hasChildren) {
      return (
        <div className="w-full">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(getItemClasses(item, isChild), "w-full justify-start")}
            disabled={item.disabled}
          >
            <ItemContent />
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-1">
                  {item.children.map((child) => (
                    <NavItem key={child.id} item={child} isChild />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    if (item.href) {
      return (
        <Link
          href={item.href}
          className={getItemClasses(item, isChild)}
          onClick={() => setIsOpen(false)}
        >
          <ItemContent />
        </Link>
      )
    }

    return (
      <button
        onClick={item.onClick}
        className={cn(getItemClasses(item, isChild), "w-full justify-start")}
        disabled={item.disabled}
      >
        <ItemContent />
      </button>
    )
  }

  // Enhanced desktop navigation
  const DesktopNav = () => (
    <nav className={cn(getVariantClasses(), className)} {...props}>
      <div className="responsive-container">
        <div className={cn(
          "flex",
          orientation === "vertical" ? "flex-col space-y-1" : "items-center space-x-1"
        )}>
          {items.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )

  // Enhanced mobile navigation
  const MobileNav = () => (
    <div className={cn("flex items-center justify-between p-4", getVariantClasses())}>
      <div className="flex items-center gap-2">
        {/* Logo or brand can go here */}
        <h2 className="cedo-heading-4">Navigation</h2>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="cedo-heading-4">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {items.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <div className={cn("hidden", `${mobileBreakpoint}:block`)}>
        <DesktopNav />
      </div>

      {/* Mobile Navigation */}
      <div className={cn("block", `${mobileBreakpoint}:hidden`)}>
        <MobileNav />
      </div>
    </>
  )
}

// Enhanced responsive breadcrumb component
export const ResponsiveBreadcrumb = ({
  items = [],
  separator = "/",
  maxItems = 3,
  className,
  ...props
}) => {
  const [showAll, setShowAll] = useState(false)

  const displayItems = showAll ? items : items.length > maxItems
    ? [items[0], { label: "...", isEllipsis: true }, ...items.slice(-2)]
    : items

  return (
    <nav className={cn("responsive-flex items-center responsive-gap-sm", className)} {...props}>
      {displayItems.map((item, index) => (
        <div key={index} className="responsive-flex items-center responsive-gap-sm">
          {item.isEllipsis ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Button>
          ) : item.href ? (
            <Link
              href={item.href}
              className={cn(
                "cedo-body-sm transition-colors hover:text-cedo-blue",
                index === displayItems.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "cedo-body-sm",
              index === displayItems.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          )}

          {index < displayItems.length - 1 && (
            <span className="text-muted-foreground cedo-body-sm">
              {separator}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Enhanced responsive tab navigation
export const ResponsiveTabs = ({
  items = [],
  value,
  onValueChange,
  variant = "default", // default, pills, underline
  size = "default",
  orientation = "horizontal",
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(value || items[0]?.value)

  const handleTabChange = (newValue) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  const getTabClasses = (item) => {
    const baseClasses = "relative flex items-center gap-2 transition-all duration-200 cursor-pointer"
    const sizeClasses = {
      sm: "px-2 py-1 text-sm",
      default: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base"
    }

    const variantClasses = {
      default: activeTab === item.value
        ? "text-cedo-blue bg-cedo-blue/10 border-b-2 border-cedo-blue"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      pills: activeTab === item.value
        ? "text-cedo-blue bg-white shadow-sm rounded-md"
        : "text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-md",
      underline: activeTab === item.value
        ? "text-cedo-blue border-b-2 border-cedo-blue"
        : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-muted"
    }

    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      item.disabled && "opacity-50 cursor-not-allowed"
    )
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Mobile dropdown for tabs */}
      <div className="block sm:hidden">
        <Card className="cedo-card-compact">
          <CardContent className="p-2">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full cedo-form-input"
            >
              {items.map((item) => (
                <option key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:block">
        <div className={cn(
          "flex border-b border-border",
          orientation === "vertical" && "flex-col border-b-0 border-r"
        )}>
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => !item.disabled && handleTabChange(item.value)}
              className={getTabClasses(item)}
              disabled={item.disabled}
            >
              {item.icon && (
                <item.icon className={cn(
                  "flex-shrink-0",
                  size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
                )} />
              )}
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.value}
            className={cn(
              "transition-all duration-200",
              activeTab === item.value ? "block" : "hidden"
            )}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResponsiveNav
