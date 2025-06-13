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
import { ROLES, useAuth } from "@/contexts/auth-context"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutDashboard,
  Menu,
  PlusCircle,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// Responsive breakpoints following mobile-first approach
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

function NavItem({ href, isActive, icon, children, collapsed, onClick, badge = null }) {
  return (
    <div className="relative group">
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={`
          group relative w-full flex items-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-cedo-gold focus:ring-offset-2 focus:ring-offset-cedo-blue
          cursor-pointer
          ${isActive
            ? "bg-gradient-to-r from-cedo-gold to-cedo-gold-dark text-cedo-blue shadow-lg transform scale-[1.02]"
            : "text-white/90 hover:bg-white/10 hover:text-cedo-gold"
          } 
          ${collapsed
            ? "justify-center p-2 md:p-3 rounded-lg md:rounded-xl"
            : "gap-2 md:gap-3 p-3 md:p-4 rounded-lg md:rounded-xl"
          } 
          hover:scale-[1.02] hover:shadow-lg
          min-h-[48px] md:min-h-[52px] lg:min-h-[56px]
        `}
      >
        <Link
          href={href}
          onClick={onClick}
          className="flex items-center gap-2 md:gap-3 w-full min-h-[44px] md:min-h-[48px] lg:min-h-[52px]"
        >
          <span className={`
            flex-shrink-0 transition-transform duration-300 
            ${isActive ? 'scale-110' : 'group-hover:scale-110'}
          `}>
            {icon}
          </span>
          {!collapsed && (
            <>
              <span className="font-medium truncate transition-all duration-300 text-sm md:text-base lg:text-lg">
                {children}
              </span>
              {badge && (
                <span className="
                  ml-auto bg-cedo-gold text-cedo-blue 
                  text-xs font-bold px-2 py-1 rounded-full 
                  min-w-[20px] text-center flex-shrink-0
                  transition-all duration-200
                ">
                  {badge}
                </span>
              )}
            </>
          )}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-cedo-gold/20 to-cedo-gold-dark/20 rounded-lg md:rounded-xl animate-pulse"></div>
          )}
        </Link>
      </SidebarMenuButton>

      {/* Enhanced tooltip for collapsed state */}
      {collapsed && (
        <div
          className="
            absolute left-full top-1/2 -translate-y-1/2 
            ml-2 md:ml-4 px-3 md:px-4 py-2 md:py-3 
            bg-gradient-to-r from-gray-900 to-gray-800 text-white 
            text-sm md:text-base rounded-lg md:rounded-xl shadow-2xl 
            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
            transition-all duration-300 whitespace-nowrap z-50 pointer-events-none 
            border border-cedo-gold/20
          "
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

// Portal-based toggle button that appears on hover zone activation
function ToggleButton({ collapsed, onClick, isVisible }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const button = (
    <button
      onClick={(e) => {
        e.stopPropagation() // Prevent event bubbling to sidebar
        onClick()
      }}
      className={`
        fixed cursor-pointer relative overflow-hidden group/button
        p-3 md:p-6 lg:p-5 rounded-xl md:rounded-2xl 
        bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold 
        shadow-2xl hover:shadow-cedo-gold/70 hover:shadow-[0_0_30px_rgba(255,215,0,0.8)] 
        hover:scale-[1.35] hover:rotate-6 hover:-translate-y-2
        hover:bg-gradient-to-br hover:from-cedo-gold hover:via-yellow-400 hover:to-amber-500 hover:text-cedo-blue
        transition-all duration-[1200ms] cubic-bezier(0.23, 1, 0.32, 1)
        focus:outline-none focus:ring-4 focus:ring-cedo-gold/70 focus:ring-offset-2 focus:ring-offset-transparent
        border-2 border-cedo-gold/30 hover:border-cedo-gold hover:border-4
        min-h-[48px] min-w-[48px] md:min-h-[56px] md:min-w-[56px] lg:min-h-[64px] lg:min-w-[64px]
        flex items-center justify-center backdrop-blur-sm
        active:scale-[1.15] active:rotate-12 active:brightness-110
        hover:brightness-110 hover:saturate-150
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-[1500ms] before:ease-out
        after:absolute after:inset-0 after:rounded-xl after:md:rounded-2xl 
        after:bg-gradient-conic after:from-cedo-gold/0 after:via-yellow-400/40 after:to-cedo-gold/0
        after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-[800ms]
        after:animate-pulse hover:after:animate-spin hover:after:duration-[3000ms]
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
      `}
      style={{
        position: 'fixed',
        zIndex: 99999,
        top: '4.5rem',
        left: collapsed ? 'calc(6rem + 0.75rem)' : 'calc(18rem + 0.75rem)',
        transition: 'left 500ms ease-out, transform 1200ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 800ms ease-out, opacity 200ms ease-out, background 1000ms ease-out, border 800ms ease-out',
        isolation: 'isolate',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity, background, box-shadow, border',
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
      }}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {/* Enhanced ripple effect with button-specific hover */}
      <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-cedo-gold/10 to-transparent opacity-0 group-hover:opacity-100 group-hover/button:opacity-100 group-hover:animate-ping group-hover/button:animate-pulse transition-opacity duration-[1000ms]"></div>

      {/* Enhanced glowing orb with explosive effect on button hover */}
      <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-radial from-cedo-gold/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-hover/button:opacity-100 transition-all duration-[1200ms] group-hover:scale-150 group-hover/button:scale-[2.5] group-hover/button:animate-bounce"></div>

      {/* Button-specific explosive ring effect */}
      <div className="absolute inset-0 rounded-xl md:rounded-2xl border-4 border-transparent group-hover/button:border-yellow-400 group-hover/button:animate-ping opacity-0 group-hover/button:opacity-100 transition-all duration-[600ms] group-hover/button:scale-150"></div>

      {/* Rotating border effect */}
      <div className="absolute inset-[-4px] rounded-xl md:rounded-2xl bg-gradient-conic from-yellow-400 via-cedo-gold to-amber-500 opacity-0 group-hover/button:opacity-100 group-hover/button:animate-spin transition-opacity duration-[800ms] -z-10"></div>

      {/* Icon with enhanced animations */}
      <div className="relative z-10 flex items-center justify-center">
        {collapsed ? (
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 
            group-hover:scale-110 group-hover:translate-x-1 
            group-hover/button:scale-[1.4] group-hover/button:translate-x-2 group-hover/button:rotate-12 group-hover/button:animate-bounce
            transition-all duration-[800ms] drop-shadow-lg filter 
            group-hover:drop-shadow-xl group-hover/button:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]
            group-hover/button:text-white" />
        ) : (
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 
            group-hover:scale-110 group-hover:-translate-x-1 
            group-hover/button:scale-[1.4] group-hover/button:-translate-x-2 group-hover/button:-rotate-12 group-hover/button:animate-bounce
            transition-all duration-[800ms] drop-shadow-lg filter 
            group-hover:drop-shadow-xl group-hover/button:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]
            group-hover/button:text-white" />
        )}
      </div>

      {/* Enhanced shimmer effect with button-specific magic */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] group-hover/button:translate-x-[200%] transition-transform duration-[2000ms] group-hover/button:duration-[1000ms] ease-out rounded-xl md:rounded-2xl"></div>

      {/* Button-specific magical particle effect */}
      <div className="absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity duration-[600ms]">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-300 rounded-full group-hover/button:animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-amber-400 rounded-full group-hover/button:animate-ping animation-delay-150"></div>
        <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-gold-500 rounded-full group-hover/button:animate-ping animation-delay-300"></div>
        <div className="absolute top-1/2 right-1/2 w-0.5 h-0.5 bg-yellow-200 rounded-full group-hover/button:animate-pulse animation-delay-75"></div>
      </div>
    </button>
  )

  return createPortal(button, document.body)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, isOpen, onOpen, onClose } = useSidebar()
  const [collapsed, setCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState(null)

  // Authentication context for role-based access control
  const { user, isLoading: authLoading } = useAuth()

  // Enhanced debug logging for responsive behavior
  useEffect(() => {
    console.log("AppSidebar: Responsive state changed", {
      collapsed,
      isMobile,
      isOpen,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'SSR'
    })
  }, [collapsed, isMobile, isOpen])

  // Enhanced sidebar state management with responsive considerations
  useEffect(() => {
    if (!isMobile) {
      console.log("AppSidebar: Dispatching responsive sidebar-toggle event", {
        collapsed,
        isMobile: false,
        width: collapsed ? 80 : 288,
        breakpoint: typeof window !== 'undefined' ?
          (window.innerWidth >= BREAKPOINTS.xl ? 'xl' :
            window.innerWidth >= BREAKPOINTS.lg ? 'lg' :
              window.innerWidth >= BREAKPOINTS.md ? 'md' : 'sm') : 'unknown'
      })
      window.dispatchEvent(
        new CustomEvent("sidebar-toggle", {
          detail: {
            collapsed,
            isMobile: false,
            width: collapsed ? 96 : 320,
            responsive: true
          },
        }),
      )
    }
  }, [collapsed, isMobile])

  // Enhanced collapsible functionality with responsive feedback
  const toggleDesktopCollapse = () => {
    const newCollapsedState = !collapsed
    console.log("AppSidebar: Responsive toggle", {
      from: collapsed,
      to: newCollapsedState,
      screenSize: typeof window !== 'undefined' ? window.innerWidth : 'unknown'
    })
    setCollapsed(newCollapsedState)

    // Enhanced event dispatch for responsive layouts
    window.dispatchEvent(
      new CustomEvent("sidebar-collapse-changed", {
        detail: {
          collapsed: newCollapsedState,
          width: newCollapsedState ? 96 : 320,
          timestamp: Date.now(),
          responsive: true
        }
      })
    )
  }

  const handleNavItemClickMobile = () => {
    if (isMobile) {
      onClose()
    }
  }

  // Enhanced hover handlers with precise hover zone control
  const handleSidebarMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setIsHovered(true)
  }

  const handleSidebarMouseLeave = () => {
    // Immediate hide when leaving sidebar area
    setIsHovered(false)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }



  // Handler for sidebar clicks/taps - immediately hide button
  const handleSidebarClick = () => {
    setIsHovered(false)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  /**
   * Role-based access control for navigation items
   * Determines which navigation items are visible based on user role
   */
  const hasAccessToReports = () => {
    if (!user || authLoading) return false
    return user.role === ROLES.HEAD_ADMIN
  }

  // Enhanced navigation items with responsive icons and role-based filtering
  const getAllNavItems = () => [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
      badge: null,
      roles: [ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.PARTNER, ROLES.REVIEWER] // Available to all admin roles
    },
    {
      href: "/admin-dashboard/proposals",
      label: "Proposals",
      icon: <Calendar className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
      badge: "3",
      roles: [ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.PARTNER, ROLES.REVIEWER]
    },
    {
      href: "/admin-dashboard/review",
      label: "Review Proposals",
      icon: <PlusCircle className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
      badge: null,
      roles: [ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.REVIEWER] // Partners can't review
    },
    {
      href: "/admin-dashboard/events",
      label: "Event Tracking",
      icon: <Calendar className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
      badge: "24",
      roles: [ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.PARTNER, ROLES.REVIEWER]
    },
    {
      href: "/admin-dashboard/reports",
      label: "Reports",
      icon: <Clock className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />,
      badge: "2",
      roles: [ROLES.HEAD_ADMIN] // RESTRICTED: Only HEAD_ADMIN can access reports
    },
  ]

  // Filter navigation items based on user role
  const getFilteredNavItems = () => {
    const allItems = getAllNavItems()

    // Debug logging for role-based access control
    if (process.env.NODE_ENV === 'development') {
      console.log("AppSidebar: Role-based filtering", {
        userRole: user?.role,
        authLoading,
        totalItems: allItems.length,
        user: user ? { id: user.id, role: user.role, name: user.name } : null
      })
    }

    // If user is not loaded or authenticated, show limited items
    if (!user || authLoading) {
      const limitedItems = allItems.filter(item =>
        item.href === "/admin-dashboard" ||
        item.href === "/admin-dashboard/proposals"
      )

      if (process.env.NODE_ENV === 'development') {
        console.log("AppSidebar: Showing limited items (no auth)", {
          itemCount: limitedItems.length,
          items: limitedItems.map(item => item.label)
        })
      }

      return limitedItems
    }

    // Filter items based on user role
    const filteredItems = allItems.filter(item => {
      if (!item.roles) return true // Show items without role restrictions
      const hasAccess = item.roles.includes(user.role)

      if (process.env.NODE_ENV === 'development' && !hasAccess) {
        console.log(`AppSidebar: Access denied for "${item.label}" - Role "${user.role}" not in allowed roles:`, item.roles)
      }

      return hasAccess
    })

    if (process.env.NODE_ENV === 'development') {
      console.log("AppSidebar: Filtered navigation items", {
        userRole: user.role,
        totalItems: allItems.length,
        filteredItems: filteredItems.length,
        visibleItems: filteredItems.map(item => item.label),
        hiddenItems: allItems.filter(item => !filteredItems.includes(item)).map(item => item.label)
      })
    }

    return filteredItems
  }

  const navItems = getFilteredNavItems()

  // Enhanced Mobile version with responsive design patterns
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger button with enhanced touch targets */}
        <button
          onClick={onOpen}
          className="
            fixed top-3 left-3 z-[70] 
            lg:hidden p-3 rounded-xl 
            bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold 
            shadow-2xl hover:shadow-cedo-gold/25 hover:scale-110 
            transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold 
            border border-cedo-gold/20 
            min-h-[48px] min-w-[48px] 
            flex items-center justify-center
            active:scale-95
          "
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Enhanced mobile overlay */}
        {isOpen && (
          <div
            className="
              fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden 
              transition-all duration-300 ease-out
              animate-in fade-in
            "
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Enhanced mobile sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-[65] lg:hidden
            w-[280px] sm:w-80
            bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white 
            transform transition-all duration-500 ease-out 
            shadow-2xl border-r border-cedo-gold/20
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          aria-label="Main sidebar"
          onClick={handleSidebarClick}
        >
          <div className="flex flex-col h-full backdrop-blur-sm">
            {/* Enhanced mobile header */}
            <div className="
              flex items-center justify-between 
              p-4 md:p-6 border-b border-cedo-gold/20 
              bg-gradient-to-r from-cedo-blue to-cedo-blue/80
            ">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="
                  relative h-10 w-10 md:h-12 md:w-12 
                  rounded-xl md:rounded-2xl 
                  bg-gradient-to-br from-cedo-gold to-cedo-gold-dark 
                  flex items-center justify-center shadow-lg
                ">
                  <span className="font-bold text-cedo-blue text-lg md:text-xl">C</span>
                  <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                <div>
                  <div className="font-bold text-xl md:text-2xl text-cedo-gold">CEDO</div>
                  <div className="text-xs text-white/70">Admin Portal</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg md:rounded-xl hover:bg-white/10 
                  transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold 
                  min-h-[44px] min-w-[44px] flex items-center justify-center
                  active:scale-95
                "
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5 md:h-6 md:w-6 text-cedo-gold" />
              </button>
            </div>

            {/* Enhanced mobile navigation */}
            <nav className="
              flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto
              scrollbar-thin scrollbar-thumb-cedo-gold/20 scrollbar-track-transparent
            ">
              <div className="space-y-1 md:space-y-2">
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

            {/* Enhanced mobile footer */}
            <div className="
              p-3 md:p-4 border-t border-cedo-gold/20 
              bg-gradient-to-r from-cedo-blue/50 to-transparent
            ">
              <div className="text-center text-xs text-white/60">
                © 2024 CEDO Admin Portal
              </div>
            </div>
          </div>
        </aside>
      </>
    )
  }

  // Enhanced Desktop sidebar with responsive best practices
  return (
    <>
      {/* Enhanced responsive collapsible button */}
      <ToggleButton collapsed={collapsed} onClick={toggleDesktopCollapse} isVisible={isHovered} />

      {/* Enhanced responsive sidebar container */}
      <div
        className="relative transition-all duration-500 ease-out"
        style={{ width: collapsed ? '6rem' : '18rem' }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onClick={handleSidebarClick}
      >
        <Sidebar
          className={`
            fixed top-0 left-0 h-screen 
            !bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white 
            transition-all duration-500 ease-out shadow-2xl border-r border-cedo-gold/20 z-40 
            ${collapsed ? "w-24" : "w-72"}
          `}
          style={{
            width: collapsed ? '6rem' : '18rem',
            transition: 'width 500ms ease-out',
            backgroundColor: 'transparent'
          }}
        >
          {/* Enhanced responsive header */}
          <SidebarHeader className="
            py-4 md:py-6 lg:py-8 px-3 md:px-4 lg:px-6 
            border-b border-cedo-gold/20 
            bg-gradient-to-r from-cedo-blue to-cedo-blue/80
          " style={{ backgroundColor: 'transparent' }}>
            {/* Enhanced debug indicator */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-50">
                {collapsed ? 'COLLAPSED' : 'EXPANDED'}
              </div>
            )}
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2 md:gap-3 lg:gap-4'} min-w-0 transition-all duration-300`}>
                <div className="
                  relative h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 
                  overflow-hidden rounded-xl md:rounded-2xl 
                  bg-gradient-to-br from-cedo-gold to-cedo-gold-dark 
                  flex items-center justify-center shadow-lg flex-shrink-0
                ">
                  <span className="font-bold text-cedo-blue text-lg md:text-xl lg:text-2xl">C</span>
                  <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                {!collapsed && (
                  <div className="transition-all duration-300 min-w-0 ml-2 md:ml-3 lg:ml-4">
                    <div className="font-bold text-lg md:text-2xl lg:text-3xl text-cedo-gold truncate">CEDO</div>
                    <div className="text-xs md:text-sm text-white/70 truncate">Admin Portal</div>
                  </div>
                )}
              </div>
            </div>
          </SidebarHeader>

          {/* Enhanced responsive content */}
          <SidebarContent className="
            px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8 
            flex flex-col h-full
          " style={{ backgroundColor: 'transparent' }}>
            {/* Enhanced responsive navigation */}
            <SidebarMenu className="space-y-1 md:space-y-2 lg:space-y-3 flex-1">
              <div className="space-y-1 md:space-y-2 lg:space-y-3">
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

            {/* Enhanced responsive footer */}
            {!collapsed && (
              <div className="mt-4 md:mt-6 lg:mt-8 pt-4 md:pt-6 lg:pt-8 border-t border-cedo-gold/20">
                <div className="
                  text-center text-xs md:text-sm text-white/60 
                  bg-gradient-to-r from-transparent via-white/5 to-transparent 
                  py-2 md:py-3 rounded-lg
                ">
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

