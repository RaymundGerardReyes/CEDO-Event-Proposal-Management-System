"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Enhanced responsive sidebar dimensions
const SIDEBAR_WIDTH = "16rem"     // 256px - Full width
const SIDEBAR_WIDTH_ICON = "4rem" // 64px - Collapsed width  
const SIDEBAR_WIDTH_MOBILE = "18rem" // 288px - Slightly wider on mobile for touch

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
        const [isTablet, setIsTablet] = React.useState(false)

        React.useEffect(() => {
            const checkDeviceType = () => {
                const width = window.innerWidth
                setIsMobile(width < 768)      // Mobile: < 768px
                setIsTablet(width >= 768 && width < 1024) // Tablet: 768px - 1024px
            }

            checkDeviceType()

            // Debounced resize handler for better performance
            let resizeTimer
            const handleResize = () => {
                clearTimeout(resizeTimer)
                resizeTimer = setTimeout(checkDeviceType, 150)
            }

            window.addEventListener("resize", handleResize)
            return () => {
                window.removeEventListener("resize", handleResize)
                clearTimeout(resizeTimer)
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

                // Update CSS custom properties for responsive behavior
                const root = document.documentElement
                if (openState) {
                    root.style.setProperty('--sidebar-width', isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH)
                    root.style.setProperty('--current-sidebar-width', isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH)
                } else {
                    root.style.setProperty('--sidebar-width', SIDEBAR_WIDTH_ICON)
                    root.style.setProperty('--current-sidebar-width', SIDEBAR_WIDTH_ICON)
                }

                // Add/remove body classes for CSS targeting
                if (typeof document !== 'undefined') {
                    document.body.classList.toggle('sidebar-expanded', openState)
                    document.body.classList.toggle('sidebar-collapsed', !openState)
                }
            },
            [setOpenProp, open, isMobile],
        )

        // Update CSS properties on mount and device type change
        React.useEffect(() => {
            // Ensure we're on the client side
            if (typeof window === 'undefined') return

            const root = document.documentElement
            const currentWidth = open ? (isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH) : SIDEBAR_WIDTH_ICON
            root.style.setProperty('--sidebar-width', currentWidth)
            root.style.setProperty('--current-sidebar-width', currentWidth)

            // Set body classes
            document.body.classList.toggle('sidebar-expanded', open)
            document.body.classList.toggle('sidebar-collapsed', !open)
        }, [open, isMobile])

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
                isTablet,
                toggleSidebar,
            }),
            [state, open, setOpen, isMobile, isTablet, toggleSidebar],
        )

        return (
            <SidebarContext.Provider value={contextValue}>
                <div
                    style={{
                        "--sidebar-width": isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH,
                        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                        "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
                        ...style,
                    }}
                    className={cn(
                        "relative", // Ensure proper positioning context only
                        className
                    )}
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
        const { state, isMobile, isTablet, open, toggleSidebar } = useSidebar()

        // Non-collapsible sidebar (desktop only)
        if (collapsible === "none" && !isMobile) {
            return (
                <div
                    className={cn(
                        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
                        "w-[--sidebar-width]",
                        "border-r border-sidebar-border",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </div>
            )
        }

        // Mobile sidebar with overlay
        if (isMobile) {
            return (
                <>
                    {/* Mobile overlay with touch-friendly close */}
                    {open && (
                        <div
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={toggleSidebar}
                            role="button"
                            aria-label="Close sidebar"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape' || e.key === 'Enter') {
                                    toggleSidebar()
                                }
                            }}
                        />
                    )}

                    {/* Mobile sidebar */}
                    <div
                        ref={ref}
                        className={cn(
                            "fixed inset-y-0 z-50 h-screen transform bg-sidebar text-sidebar-foreground",
                            "shadow-2xl backdrop-blur-md border-r border-sidebar-border",
                            "transition-all duration-300 ease-out md:hidden",
                            "w-[--sidebar-width-mobile]",
                            // Responsive positioning
                            side === "left"
                                ? (open ? "translate-x-0" : "-translate-x-full")
                                : side === "right"
                                    ? (open ? "translate-x-0" : "translate-x-full")
                                    : "",
                            // Touch-friendly scrolling
                            "overflow-y-auto scrollbar-thin",
                            className,
                        )}
                        data-state={state}
                        data-side={side}
                        {...props}
                    >
                        <div data-sidebar="sidebar" className="flex h-full w-full flex-col">
                            {children}
                        </div>
                    </div>
                </>
            )
        }

        // Desktop & Tablet sidebar
        return (
            <div
                ref={ref}
                className={cn(
                    "group peer hidden md:block text-sidebar-foreground",
                    "fixed inset-y-0 left-0 z-30", // Fixed positioning for proper layout
                    "transition-all duration-300 ease-out",
                    "border-r border-sidebar-border bg-sidebar",
                    "shadow-lg",
                    // Responsive width based on state
                    state === "expanded"
                        ? "w-[--sidebar-width]"
                        : "w-[--sidebar-width-icon]",
                    // Side positioning
                    side === "left" ? "left-0" : side === "right" ? "right-0" : "",
                    className,
                )}
                data-state={state}
                data-collapsible={collapsible !== "none" ? (state === "collapsed" ? collapsible : "") : ""}
                data-variant={variant}
                data-side={side}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    className={cn(
                        "flex h-full w-full flex-col bg-sidebar",
                        "overflow-hidden", // Prevent content overflow during transitions
                        "scrollbar-thin" // Custom scrollbar styling
                    )}
                >
                    {children}
                </div>
            </div>
        )
    },
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, isMobile } = useSidebar()

    return (
        <Button
            ref={ref}
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn(
                // Responsive sizing
                "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
                // Touch-friendly on mobile
                isMobile && "h-11 w-11 active:scale-95",
                // Focus states
                "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                "transition-all duration-200",
                className
            )}
            onClick={(event) => {
                onClick?.(event)
                toggleSidebar()
            }}
            {...props}
        >
            <PanelLeft className={cn(
                "transition-transform duration-200",
                isMobile ? "h-5 w-5" : "h-4 w-4"
            )} />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
    const { isMobile, state } = useSidebar()

    return (
        <div
            ref={ref}
            data-sidebar="header"
            className={cn(
                "flex flex-col gap-2",
                // Responsive padding
                "p-3 sm:p-4",
                // Collapsed state adjustments
                state === "collapsed" && !isMobile && "items-center px-2",
                className
            )}
            {...props}
        />
    )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
    const { isMobile, state } = useSidebar()

    return (
        <div
            ref={ref}
            data-sidebar="footer"
            className={cn(
                "flex flex-col gap-2 mt-auto",
                // Responsive padding
                "p-3 sm:p-4",
                // Collapsed state adjustments
                state === "collapsed" && !isMobile && "items-center px-2",
                className
            )}
            {...props}
        />
    )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
    const { state, isMobile } = useSidebar()

    return (
        <Separator
            ref={ref}
            data-sidebar="separator"
            className={cn(
                "bg-sidebar-border",
                // Responsive margin
                state === "collapsed" && !isMobile ? "mx-1" : "mx-2 sm:mx-3",
                "w-auto",
                className
            )}
            {...props}
        />
    )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
    const { state, isMobile } = useSidebar()

    return (
        <div
            ref={ref}
            data-sidebar="content"
            className={cn(
                "flex min-h-0 flex-1 flex-col gap-2",
                "overflow-y-auto overflow-x-hidden scrollbar-thin",
                // Responsive padding
                "py-2 sm:py-3",
                // Collapsed state - center items on desktop
                state === "collapsed" && !isMobile && "items-center",
                className,
            )}
            {...props}
        />
    )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => {
    const { state, isMobile } = useSidebar()

    return (
        <ul
            ref={ref}
            data-sidebar="menu"
            className={cn(
                "flex w-full min-w-0 flex-col gap-1",
                // Responsive padding
                state === "collapsed" && !isMobile ? "px-1" : "px-2 sm:px-3",
                className
            )}
            {...props}
        />
    )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
    <li
        ref={ref}
        data-sidebar="menu-item"
        className={cn(
            "group/menu-item relative",
            "transition-all duration-200",
            className
        )}
        {...props}
    />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm outline-none ring-ring transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
    {
        variants: {
            variant: {
                default: "",
                outline: "bg-background border border-sidebar-border hover:shadow-sm",
            },
            size: {
                default: "h-9 px-2 sm:px-3",
                sm: "h-8 px-2 text-xs",
                lg: "h-10 px-3 sm:px-4",
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
        const { state, isMobile } = useSidebar()
        const Comp = asChild ? Slot : "button"

        return (
            <Comp
                ref={ref}
                data-sidebar="menu-button"
                data-active={isActive ? "true" : undefined}
                className={cn(
                    sidebarMenuButtonVariants({ variant, size }),
                    // Responsive adjustments
                    isMobile && "h-11 active:scale-95", // Touch-friendly on mobile
                    state === "collapsed" && !isMobile && "justify-center px-2", // Centered when collapsed
                    className
                )}
                {...props}
            >
                {children}
            </Comp>
        )
    },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
    const { state, isMobile } = useSidebar()

    return (
        <Input
            ref={ref}
            data-sidebar="input"
            className={cn(
                "bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                // Responsive sizing
                isMobile ? "h-10" : "h-8",
                // Hide on collapsed desktop
                state === "collapsed" && !isMobile && "hidden",
                "w-full transition-all duration-200",
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
}

