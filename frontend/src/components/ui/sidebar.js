"use client"

import { Slot } from "@radix-ui/react-slot"; // Import Slot
import { cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
// Assuming Sheet and other components are correctly imported if used by this simplified sidebar version
// For instance, the mobile version in your provided sidebar.js was simplified
// compared to the .tsx version. If Sheet is needed, ensure it's imported.

const SIDEBAR_WIDTH = "2rem"
const SIDEBAR_WIDTH_ICON = "3rem"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

const SidebarProvider = React.forwardRef(
  ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768) // Standard md breakpoint
      }
      checkMobile()
      window.addEventListener("resize", checkMobile)
      return () => {
        window.removeEventListener("resize", checkMobile)
      }
    }, [])

    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        // Consider cookie persistence if needed, like in the more complex version
      },
      [setOpenProp, open],
    )

    const toggleSidebar = React.useCallback(() => {
      setOpen((prev) => !prev)
    }, [setOpen])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, toggleSidebar],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn("group/sidebar-wrapper flex min-h-screen w-full", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { state, isMobile, open, toggleSidebar } = useSidebar() // 'open' and 'toggleSidebar' for mobile

    if (collapsible === "none" && !isMobile) { // Non-collapsible only for desktop
      return (
        <div
          className={cn("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Mobile view: uses a simple toggle, could be enhanced with Sheet from ShadCN if desired
    if (isMobile) {
      return (
        <>
          {/* Overlay for mobile when sidebar is open */}
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={toggleSidebar}
            />
          )}
          <div
            ref={ref}
            className={cn(
              "fixed inset-y-0 z-50 h-screen w-[--sidebar-width] transform bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-300 ease-in-out md:hidden",
              side === "left" ? (state === "collapsed" ? "-translate-x-full" : "translate-x-0") : "", // Basic LTR mobile
              side === "right" ? (state === "collapsed" ? "translate-x-full" : "translate-x-0") : "", // Basic RTL mobile
              className,
            )}
            data-state={state} // Keep state for potential styling
            {...props}
          >
            <div data-sidebar="sidebar" className="flex h-full w-full flex-col">
              {children}
            </div>
          </div>
        </>
      )
    }

    // Desktop view
    return (
      <div
        ref={ref}
        className={cn(
          "group peer hidden md:block text-sidebar-foreground relative transition-[width] duration-300 ease-in-out",
          state === "expanded" ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
          side === "left" ? "border-r" : "border-l", // Add border
          "border-border", // Use your theme's border color
          className
        )}
        data-state={state}
        data-collapsible={collapsible !== "none" ? (state === "collapsed" ? collapsible : "") : ""} // Simplified collapsible data attr
        data-variant={variant}
        data-side={side}
        {...props} // Spread remaining props here
      >
        <div data-sidebar="sidebar" className="flex h-full w-full flex-col bg-sidebar">
          {children}
        </div>
      </div>
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)} // Use your theme's border color
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden",
        state === "collapsed" && "items-center", // Center items when collapsed and icon-only
        className,
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1 px-2", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-ring focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "", // Base styles are already applied
        outline: "bg-background border border-border hover:shadow-sm",
      },
      size: { // Simplified sizes, adjust as needed
        default: "h-9",
        sm: "h-8 text-xs",
        lg: "h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const SidebarMenuButton = React.forwardRef(
  ({ asChild = false, isActive = false, variant, size, className, children, ...props }, ref) => {
    // If asChild is true, use Slot. Otherwise, use "button".
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive ? "true" : undefined} // Ensure data-active is set correctly
        className={cn(sidebarMenuButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-ring", // Use theme's ring color
        className,
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
};

