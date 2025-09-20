"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/dashboard/admin/ui/sidebar"
import { ROLES } from "@/contexts/auth-context"
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    LayoutDashboard,
    Menu,
    PlusCircle,
    X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

// ✅ ENHANCED: Conditional console logging for development/production
// Custom logging function that respects environment settings
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom logging functions for AppSidebar
const customLog = {
    log: function (...args) {
        if (isDevelopment) {
            console.log('[APP-SIDEBAR]', ...args);
        }
    },
    warn: function (...args) {
        if (isDevelopment) {
            console.warn('[APP-SIDEBAR WARNING]', ...args);
        }
    },
    error: function (...args) {
        // Always log errors, even in production for debugging
        console.error('[APP-SIDEBAR ERROR]', ...args);
    },
    debug: function (...args) {
        if (isDevelopment) {
            console.log('[APP-SIDEBAR DEBUG]', ...args);
        }
    }
};

// Override console methods for production security
if (isProduction) {
    // Suppress console.log and console.warn in production
    console.log = function () { };
    console.warn = function () { };
    // Keep console.error for critical error logging
} else {
    // Development environment - keep all console methods active
    console.log = console.log;
    console.warn = console.warn;
    console.error = console.error;
}

const MOBILE_BREAKPOINT = 768

function NavItem({ href, isActive, icon, children, collapsed, onClick, badge = null }) {
    return (
        <div className="relative group">
            <SidebarMenuButton
                asChild
                isActive={isActive}
                className={`group relative w-full flex items-center transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-cedo-gold focus:ring-offset-2 focus:ring-offset-cedo-blue ${isActive
                    ? "bg-gradient-to-r from-cedo-gold to-cedo-gold-dark text-cedo-blue shadow-lg transform scale-[1.02]"
                    : "text-white/90 hover:bg-white/10 hover:text-cedo-gold"
                    } ${collapsed
                        ? "justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl"
                        : "gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl"
                    } hover:scale-[1.02] hover:shadow-lg`}
            >
                <Link href={href} onClick={onClick} className="flex items-center gap-2 sm:gap-3 w-full min-h-[44px] sm:min-h-[48px]">
                    <span className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {icon}
                    </span>
                    {!collapsed && (
                        <>
                            <span className="font-medium truncate transition-all duration-300 text-sm sm:text-base">{children}</span>
                            {badge && (
                                <span className="ml-auto bg-cedo-gold text-cedo-blue text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center flex-shrink-0">
                                    {badge}
                                </span>
                            )}
                        </>
                    )}
                    {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cedo-gold/20 to-cedo-gold-dark/20 rounded-lg sm:rounded-xl animate-pulse"></div>
                    )}
                </Link>
            </SidebarMenuButton>

            {collapsed && (
                <div
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 sm:ml-4 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm rounded-lg sm:rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 pointer-events-none border border-cedo-gold/20"
                    role="tooltip"
                >
                    <div className="flex items-center gap-2">
                        {children}
                        {badge && (
                            <span className="bg-cedo-gold text-cedo-blue text-xs font-bold px-2 py-1 rounded-full">
                                {badge}
                            </span>
                        )}
                    </div>
                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-gray-900 to-gray-800 rotate-45 border-l border-t border-cedo-gold/20"></div>
                </div>
            )}
        </div>
    )
}

export function AppSidebar() {
    const pathname = usePathname()
    const { isMobile, isOpen, onOpen, onClose } = useSidebar()
    const [collapsed, setCollapsed] = useState(false)
    const [showToggle, setShowToggle] = useState(false)

    // Debug logging for state changes
    useEffect(() => {
        customLog.debug("State changed", { collapsed, isMobile, isOpen, showToggle })
    }, [collapsed, isMobile, isOpen, showToggle])

    // Dispatch sidebar state changes for layout components
    useEffect(() => {
        if (!isMobile) {
            customLog.debug("Dispatching sidebar-toggle event", { collapsed, isMobile: false })
            window.dispatchEvent(
                new CustomEvent("sidebar-toggle", {
                    detail: {
                        collapsed,
                        isMobile: false,
                        width: collapsed ? 80 : 288
                    },
                }),
            )
            customLog.debug("Event dispatched successfully")
        }
    }, [collapsed, isMobile])

    const toggleDesktopCollapse = () => {
        const newCollapsedState = !collapsed
        customLog.log("Toggle button clicked, changing from", collapsed, "to", newCollapsedState)
        setCollapsed(newCollapsedState)
    }

    const handleNavItemClickMobile = () => {
        if (isMobile) {
            onClose()
        }
    }

    // Handle hover/touch detection for toggle button
    const handleShowToggle = () => setShowToggle(true)
    const handleHideToggle = () => setShowToggle(false)

    // Handle touch events for mobile-like interactions
    const handleTouchStart = () => setShowToggle(true)
    const handleTouchEnd = () => {
        // Delay hiding to allow for button interaction
        setTimeout(() => setShowToggle(false), 2000)
    }

    const navItems = [
        {
            href: "/admin-dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />,
            badge: null
        },
        {
            href: "/admin-dashboard/proposals",
            label: "Proposals",
            icon: <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />,
            badge: "23"
        },
        {
            href: "/admin-dashboard/review",
            label: "Review Center",
            icon: <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
            badge: null
        },
        {
            href: "/admin-dashboard/events",
            label: "Events",
            icon: <Calendar className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
            badge: "24",
            roles: [ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.PARTNER, ROLES.REVIEWER]
        },
        {
            href: "/admin-dashboard/reports",
            label: "Reports",
            icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />,
            badge: "12"
        },

    ]

    // Enhanced Mobile version with better responsive design
    if (isMobile) {
        return (
            <>
                <button
                    onClick={onOpen}
                    className="fixed top-4 left-4 z-[60] lg:hidden p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold shadow-2xl hover:shadow-cedo-gold/25 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold border border-cedo-gold/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden transition-all duration-300"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}

                <aside
                    className={`fixed top-0 left-0 w-[280px] sm:w-80 h-full bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white z-[60] transform transition-all duration-500 ease-out lg:hidden shadow-2xl border-r border-cedo-gold/20 ${isOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                    style={{
                        borderRadius: '0 2rem 2rem 0',
                        borderTopLeftRadius: '0',
                        borderBottomLeftRadius: '0',
                        borderTopRightRadius: '2rem',
                        borderBottomRightRadius: '2rem',
                        overflow: 'hidden'
                    }}
                    aria-label="Main sidebar"
                >
                    {/* Mobile sidebar background grid pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="w-full h-full" style={{
                            backgroundImage: `
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '20px 20px'
                        }} />
                    </div>

                    <div className="flex flex-col h-full backdrop-blur-sm relative z-10">
                        {/* Enhanced Header with responsive grid layout and curved design */}
                        <div
                            className="relative p-4 sm:p-6 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80 overflow-hidden"
                            style={{
                                borderRadius: '0 2rem 0 0',
                                borderTopLeftRadius: '0',
                                borderTopRightRadius: '2rem'
                            }}
                        >
                            {/* Header background grid pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="w-full h-full" style={{
                                    backgroundImage: `
                                        linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '15px 15px'
                                }} />
                            </div>

                            <div className="relative z-10 grid grid-cols-12 gap-3 items-center">
                                {/* Logo section */}
                                <div className="col-span-9 flex items-center gap-3 sm:gap-4">
                                    <div
                                        className="relative h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg group"
                                        style={{
                                            borderRadius: '1rem',
                                            transition: 'border-radius 500ms ease-out'
                                        }}
                                    >
                                        <span className="font-bold text-cedo-blue text-lg sm:text-xl transition-transform duration-300 group-hover:scale-110">C</span>
                                        <div
                                            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                                            style={{
                                                borderRadius: '1rem'
                                            }}
                                        ></div>
                                        <div
                                            className="absolute inset-0 bg-gradient-to-br from-cedo-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                borderRadius: '1rem'
                                            }}
                                        ></div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-xl sm:text-2xl text-cedo-gold">CEDO</div>
                                        <div className="text-xs text-white/70">Admin Portal</div>
                                    </div>
                                </div>

                                {/* Close button */}
                                <div className="col-span-3 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="group p-2 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold min-h-[44px] min-w-[44px] flex items-center justify-center"
                                        aria-label="Close sidebar"
                                    >
                                        <X className="h-5 w-5 sm:h-6 sm:w-6 text-cedo-gold transition-transform duration-300 group-hover:scale-110" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Navigation with responsive grid layout */}
                        <nav className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto relative">
                            {/* Navigation background grid pattern */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none">
                                <div className="w-full h-full" style={{
                                    backgroundImage: `
                                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '25px 25px'
                                }} />
                            </div>

                            <div className="relative z-10 grid grid-cols-1 gap-2 sm:gap-3">
                                {navItems.map((item, index) => (
                                    <div key={item.href} className="relative">
                                        {/* Navigation item background grid effect with curved design */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-cedo-gold/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                borderRadius: '1rem',
                                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                                            }}
                                        />

                                        <NavItem
                                            href={item.href}
                                            isActive={pathname === item.href || (item.href !== "/admin-dashboard" && pathname.startsWith(item.href))}
                                            icon={item.icon}
                                            collapsed={false}
                                            onClick={handleNavItemClickMobile}
                                            badge={item.badge}
                                        >
                                            {item.label}
                                        </NavItem>

                                        {/* Navigation item grid overlay with curved design */}
                                        <div
                                            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            style={{
                                                borderRadius: '1rem',
                                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                                            }}
                                        >
                                            <div className="w-full h-full" style={{
                                                backgroundImage: `
                                                    linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                                    linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                                                `,
                                                backgroundSize: '10px 10px',
                                                borderRadius: '1rem'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </nav>

                        {/* Enhanced Footer with responsive grid layout and curved design */}
                        <div
                            className="relative p-3 sm:p-4 border-t border-cedo-gold/20 bg-gradient-to-r from-cedo-blue/50 to-transparent"
                            style={{
                                borderRadius: '0 0 2rem 0',
                                borderBottomLeftRadius: '0',
                                borderBottomRightRadius: '2rem'
                            }}
                        >
                            {/* Footer background grid pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="w-full h-full" style={{
                                    backgroundImage: `
                                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '20px 20px',
                                    borderRadius: '0 0 2rem 0'
                                }} />
                            </div>

                            <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                                {/* Copyright section */}
                                <div className="col-span-8 text-center">
                                    <div
                                        className="text-xs text-white/60 bg-white/5 px-3 py-2"
                                        style={{
                                            borderRadius: '0.75rem',
                                            transition: 'border-radius 500ms ease-out'
                                        }}
                                    >
                                        © 2024 CEDO Admin Portal
                                    </div>
                                </div>

                                {/* Version indicator */}
                                <div className="col-span-4 flex justify-end">
                                    <div
                                        className="text-xs text-white/40 bg-white/5 px-2 py-1"
                                        style={{
                                            borderRadius: '1rem',
                                            transition: 'border-radius 500ms ease-out'
                                        }}
                                    >
                                        v2.1.0
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </>
        )
    }

    // Enhanced Desktop sidebar with advanced responsive grid design
    return (
        <>
            {/* Enhanced Hover/Touch Detection Zone with responsive grid */}
            <div
                className="fixed top-0 left-0 h-full z-30 bg-transparent"
                style={{
                    left: collapsed ? '0' : '0',
                    width: collapsed ? '6rem' : '17rem',
                    transition: 'width 500ms ease-out',
                }}
                onMouseEnter={handleShowToggle}
                onMouseLeave={handleHideToggle}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-hidden="true"
            >
                {/* Detection grid overlay for better interaction */}
                <div className="absolute inset-0 grid grid-cols-1 grid-rows-12 gap-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-cedo-blue/5 hover:bg-cedo-blue/10 transition-colors duration-200" />
                    ))}
                </div>
            </div>

            {/* Enhanced Collapsible button with responsive grid positioning */}
            {showToggle && (
                <div className="fixed z-50" style={{
                    top: '0.75rem',
                    left: collapsed ? 'calc(4rem + 0.5rem)' : 'calc(16rem + 0.5rem)',
                    transition: 'left 500ms ease-out',
                }}>
                    <button
                        onClick={toggleDesktopCollapse}
                        className="group relative p-2 sm:p-3 bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold shadow-2xl hover:shadow-cedo-gold/25 hover:scale-110 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-cedo-gold border border-cedo-gold/20 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center animate-in fade-in slide-in-from-left-2 duration-300"
                        style={{
                            borderRadius: '1rem',
                            transition: 'border-radius 500ms ease-out, transform 300ms ease-out, box-shadow 300ms ease-out'
                        }}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        onMouseEnter={handleShowToggle}
                        onMouseLeave={handleHideToggle}
                    >
                        {/* Button background grid effect with curved design */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-cedo-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                borderRadius: '1rem',
                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                            }}
                        />

                        {/* Icon with enhanced styling */}
                        <div className="relative z-10 flex items-center justify-center">
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110" />
                            )}
                        </div>

                        {/* Tooltip for better UX with curved design */}
                        <div
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
                            style={{
                                borderRadius: '0.75rem',
                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                            }}
                        >
                            {collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            <div
                                className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-gray-900 rotate-45"
                                style={{
                                    borderRadius: '0.25rem'
                                }}
                            ></div>
                        </div>
                    </button>
                </div>
            )}

            {/* Enhanced Sidebar container with responsive grid system */}
            <div
                className="relative"
                style={{ width: collapsed ? '4rem' : '16rem' }}
                onMouseEnter={handleShowToggle}
                onMouseLeave={handleHideToggle}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Background grid pattern overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="w-full h-full" style={{
                        backgroundImage: `
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                <Sidebar
                    className={`fixed top-0 left-0 h-screen !bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white transition-all duration-500 ease-out shadow-2xl border-r border-cedo-gold/20 z-40 ${collapsed ? "w-16" : "w-64"
                        }`}
                    style={{
                        width: collapsed ? '4rem' : '16rem',
                        transition: 'width 500ms ease-out, border-radius 500ms ease-out',
                        backgroundColor: 'transparent',
                        borderRadius: collapsed ? '0 1.5rem 1.5rem 0' : '0 2rem 2rem 0',
                        overflow: 'hidden'
                    }}
                >
                    {/* Enhanced Header with responsive grid layout and curved design */}
                    <SidebarHeader
                        className="py-4 sm:py-6 px-3 sm:px-4 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80 relative overflow-hidden"
                        style={{
                            backgroundColor: 'transparent',
                            borderRadius: collapsed ? '0 1.5rem 0 0' : '0 2rem 0 0',
                            borderTopLeftRadius: '0',
                            borderTopRightRadius: collapsed ? '1.5rem' : '2rem'
                        }}
                    >
                        {/* Header background grid pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="w-full h-full" style={{
                                backgroundImage: `
                                    linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '15px 15px'
                            }} />
                        </div>

                        <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                            {/* Logo section - responsive grid columns */}
                            <div className={`${collapsed ? 'col-span-12 flex justify-center' : 'col-span-10'} flex items-center gap-2 sm:gap-3 min-w-0`}>
                                <div
                                    className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg flex-shrink-0 group"
                                    style={{
                                        borderRadius: collapsed ? '0.75rem' : '1rem',
                                        transition: 'border-radius 500ms ease-out'
                                    }}
                                >
                                    <span className="font-bold text-cedo-blue text-lg sm:text-xl transition-transform duration-300 group-hover:scale-110">C</span>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                                        style={{
                                            borderRadius: collapsed ? '0.75rem' : '1rem'
                                        }}
                                    ></div>
                                    {/* Logo glow effect */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-cedo-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{
                                            borderRadius: collapsed ? '0.75rem' : '1rem'
                                        }}
                                    ></div>
                                </div>
                                {!collapsed && (
                                    <div className="transition-all duration-300 min-w-0">
                                        <div className="font-bold text-lg sm:text-2xl text-cedo-gold truncate">CEDO</div>
                                        <div className="text-xs text-white/70 truncate">Admin Portal</div>
                                    </div>
                                )}
                            </div>

                            {/* Status indicator - only visible when expanded */}
                            {!collapsed && (
                                <div className="col-span-2 flex justify-end">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="System Online"></div>
                                </div>
                            )}
                        </div>
                    </SidebarHeader>

                    {/* Enhanced Content with responsive grid navigation */}
                    <SidebarContent className="px-3 sm:px-4 py-4 sm:py-6 flex flex-col h-full relative" style={{ backgroundColor: 'transparent' }}>
                        {/* Navigation background grid pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <div className="w-full h-full" style={{
                                backgroundImage: `
                                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '25px 25px'
                            }} />
                        </div>

                        {/* Enhanced Main Navigation with grid layout */}
                        <SidebarMenu className="space-y-2 sm:space-y-3 flex-1 relative z-10">
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {navItems.map((item, index) => (
                                    <SidebarMenuItem key={item.href} className="relative">
                                        {/* Navigation item background grid effect with curved design */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-cedo-gold/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                borderRadius: collapsed ? '0.75rem' : '1rem',
                                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                                            }}
                                        />

                                        <NavItem
                                            href={item.href}
                                            isActive={pathname === item.href || (item.href !== "/admin-dashboard" && pathname.startsWith(item.href))}
                                            icon={item.icon}
                                            collapsed={collapsed}
                                            badge={item.badge}
                                        >
                                            {item.label}
                                        </NavItem>

                                        {/* Navigation item grid overlay with curved design */}
                                        <div
                                            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            style={{
                                                borderRadius: collapsed ? '0.75rem' : '1rem',
                                                transition: 'border-radius 500ms ease-out, opacity 300ms ease-out'
                                            }}
                                        >
                                            <div className="w-full h-full" style={{
                                                backgroundImage: `
                                                    linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                                    linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                                                `,
                                                backgroundSize: '10px 10px',
                                                borderRadius: collapsed ? '0.75rem' : '1rem'
                                            }} />
                                        </div>
                                    </SidebarMenuItem>
                                ))}
                            </div>
                        </SidebarMenu>

                        {/* Enhanced Footer with responsive grid layout and curved design */}
                        {!collapsed && (
                            <div
                                className="mt-4 pt-4 border-t border-cedo-gold/20 relative"
                                style={{
                                    borderRadius: '0 0 2rem 0',
                                    borderBottomLeftRadius: '0',
                                    borderBottomRightRadius: '2rem'
                                }}
                            >
                                {/* Footer background grid pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="w-full h-full" style={{
                                        backgroundImage: `
                                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '20px 20px',
                                        borderRadius: '0 0 2rem 0'
                                    }} />
                                </div>

                                <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                                    {/* Copyright section */}
                                    <div className="col-span-8 text-center">
                                        <div
                                            className="text-xs text-white/60 bg-gradient-to-r from-transparent via-white/5 to-transparent py-2 px-3"
                                            style={{
                                                borderRadius: '0.75rem',
                                                transition: 'border-radius 500ms ease-out'
                                            }}
                                        >
                                            © 2024 CEDO Admin Portal
                                        </div>
                                    </div>

                                    {/* Version indicator */}
                                    <div className="col-span-4 flex justify-end">
                                        <div
                                            className="text-xs text-white/40 bg-white/5 px-2 py-1"
                                            style={{
                                                borderRadius: '1rem',
                                                transition: 'border-radius 500ms ease-out'
                                            }}
                                        >
                                            v2.1.0
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collapsed footer - minimal version with curved design */}
                        {collapsed && (
                            <div
                                className="mt-4 pt-4 border-t border-cedo-gold/20 flex justify-center"
                                style={{
                                    borderRadius: '0 0 1.5rem 0',
                                    borderBottomLeftRadius: '0',
                                    borderBottomRightRadius: '1.5rem'
                                }}
                            >
                                <div
                                    className="w-8 h-8 bg-gradient-to-br from-cedo-gold/20 to-transparent flex items-center justify-center"
                                    style={{
                                        borderRadius: '1rem',
                                        transition: 'border-radius 500ms ease-out'
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 bg-cedo-gold"
                                        style={{
                                            borderRadius: '50%'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </SidebarContent>
                </Sidebar>
            </div>
        </>
    )
}
