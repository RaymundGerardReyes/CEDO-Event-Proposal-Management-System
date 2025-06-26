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
        console.log("AppSidebar: State changed", { collapsed, isMobile, isOpen, showToggle })
    }, [collapsed, isMobile, isOpen, showToggle])

    // Dispatch sidebar state changes for layout components
    useEffect(() => {
        if (!isMobile) {
            console.log("AppSidebar: Dispatching sidebar-toggle event", { collapsed, isMobile: false })
            window.dispatchEvent(
                new CustomEvent("sidebar-toggle", {
                    detail: {
                        collapsed,
                        isMobile: false,
                        width: collapsed ? 80 : 288
                    },
                }),
            )
            console.log("AppSidebar: Event dispatched successfully")
        }
    }, [collapsed, isMobile])

    const toggleDesktopCollapse = () => {
        const newCollapsedState = !collapsed
        console.log("AppSidebar: Toggle button clicked, changing from", collapsed, "to", newCollapsedState)
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
                    aria-label="Main sidebar"
                >
                    <div className="flex flex-col h-full backdrop-blur-sm">
                        {/* Enhanced Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg">
                                    <span className="font-bold text-cedo-blue text-lg sm:text-xl">C</span>
                                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                                </div>
                                <div>
                                    <div className="font-bold text-xl sm:text-2xl text-cedo-gold">CEDO</div>
                                    <div className="text-xs text-white/70">Admin Portal</div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Close sidebar"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6 text-cedo-gold" />
                            </button>
                        </div>

                        {/* Enhanced Navigation */}
                        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        isActive={pathname === item.href || (item.href !== "/admin-dashboard" && pathname.startsWith(item.href))}
                                        icon={item.icon}
                                        collapsed={false}
                                        onClick={handleNavItemClickMobile}
                                        badge={item.badge}
                                    >
                                        {item.label}
                                    </NavItem>
                                ))}
                            </div>
                        </nav>

                        {/* Enhanced Footer */}
                        <div className="p-3 sm:p-4 border-t border-cedo-gold/20 bg-gradient-to-r from-cedo-blue/50 to-transparent">
                            <div className="text-center text-xs text-white/60">
                                © 2024 CEDO Admin Portal
                            </div>
                        </div>
                    </div>
                </aside>
            </>
        )
    }

    // Enhanced Desktop sidebar with better responsive design
    return (
        <>
            {/* Hover/Touch Detection Zone - positioned at sidebar edge */}
            <div
                className="fixed top-0 left-0 h-full w-6 z-30 bg-transparent"
                style={{
                    left: collapsed ? '0' : '0',
                    width: collapsed ? '6rem' : '17rem', // Slightly wider than sidebar for better detection
                    transition: 'width 500ms ease-out',
                }}
                onMouseEnter={handleShowToggle}
                onMouseLeave={handleHideToggle}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-hidden="true"
            />

            {/* Enhanced Collapsible button - appears on hover/touch */}
            {showToggle && (
                <button
                    onClick={toggleDesktopCollapse}
                    className={`fixed z-50 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold shadow-2xl hover:shadow-cedo-gold/25 hover:scale-110 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-cedo-gold border border-cedo-gold/20 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center animate-in fade-in slide-in-from-left-2 duration-300`}
                    style={{
                        top: '0.75rem',
                        left: collapsed ? 'calc(4rem + 0.5rem)' : 'calc(16rem + 0.5rem)',
                        transition: 'left 500ms ease-out, transform 300ms ease-out, opacity 300ms ease-out',
                        opacity: 1, // Override the opacity-0 class
                    }}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onMouseEnter={handleShowToggle}
                    onMouseLeave={handleHideToggle}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
            )}

            {/* Enhanced Sidebar container */}
            <div
                className="relative"
                style={{ width: collapsed ? '4rem' : '16rem' }}
                onMouseEnter={handleShowToggle}
                onMouseLeave={handleHideToggle}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >

                <Sidebar
                    className={`fixed top-0 left-0 h-screen !bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white transition-all duration-500 ease-out shadow-2xl border-r border-cedo-gold/20 z-40 ${collapsed ? "w-16" : "w-64"
                        }`}
                    style={{
                        width: collapsed ? '4rem' : '16rem', // Fallback inline styles
                        transition: 'width 500ms ease-out',
                        backgroundColor: 'transparent' // Ensure no white background bleeds through
                    }}
                >
                    {/* Enhanced Header */}
                    <SidebarHeader className="py-4 sm:py-6 px-3 sm:px-4 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80" style={{ backgroundColor: 'transparent' }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="font-bold text-cedo-blue text-lg sm:text-xl">C</span>
                                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                                </div>
                                {!collapsed && (
                                    <div className="transition-all duration-300 min-w-0">
                                        <div className="font-bold text-lg sm:text-2xl text-cedo-gold truncate">CEDO</div>
                                        <div className="text-xs text-white/70 truncate">Admin Portal</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarHeader>

                    {/* Enhanced Content */}
                    <SidebarContent className="px-3 sm:px-4 py-4 sm:py-6 flex flex-col h-full" style={{ backgroundColor: 'transparent' }}>
                        {/* Enhanced Main Navigation */}
                        <SidebarMenu className="space-y-1 sm:space-y-2 flex-1">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <NavItem
                                            href={item.href}
                                            isActive={pathname === item.href || (item.href !== "/admin-dashboard" && pathname.startsWith(item.href))}
                                            icon={item.icon}
                                            collapsed={collapsed}
                                            badge={item.badge}
                                        >
                                            {item.label}
                                        </NavItem>
                                    </SidebarMenuItem>
                                ))}
                            </div>
                        </SidebarMenu>

                        {/* Enhanced Footer */}
                        {!collapsed && (
                            <div className="mt-4 pt-4 border-t border-cedo-gold/20">
                                <div className="text-center text-xs text-white/60 bg-gradient-to-r from-transparent via-white/5 to-transparent py-2 rounded-lg">
                                    © 2024 CEDO Admin Portal
                                </div>
                            </div>
                        )}
                    </SidebarContent>
                </Sidebar>
            </div>
        </>
    )
}
