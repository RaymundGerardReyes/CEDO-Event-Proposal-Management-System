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

const MOBILE_BREAKPOINT = 768

function NavItem({ href, isActive, icon, children, collapsed, onClick, badge = null }) {
  return (
    <div className="relative group">
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cedo-gold focus:ring-offset-2 focus:ring-offset-cedo-blue ${isActive
          ? "bg-gradient-to-r from-cedo-gold to-cedo-gold-dark text-cedo-blue shadow-lg transform scale-[1.02]"
          : "text-white/90 hover:bg-white/10 hover:text-cedo-gold"
          } ${collapsed ? "justify-center px-3" : ""}`}
      >
        <Link href={href} onClick={onClick} className="flex items-center gap-3 w-full">
          <span className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
          </span>
          {!collapsed && (
            <>
              <span className="font-medium truncate transition-all duration-300">{children}</span>
              {badge && (
                <span className="ml-auto bg-cedo-gold text-cedo-blue text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </>
          )}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-cedo-gold/20 to-cedo-gold-dark/20 rounded-xl animate-pulse"></div>
          )}
        </Link>
      </SidebarMenuButton>

      {collapsed && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 pointer-events-none border border-cedo-gold/20"
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

  // Debug logging for state changes
  useEffect(() => {
    console.log("AppSidebar: State changed", { collapsed, isMobile, isOpen })
  }, [collapsed, isMobile, isOpen])

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

  const navItems = [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: null
    },
    {
      href: "/admin-dashboard/proposals",
      label: "Proposals",
      icon: <Calendar className="h-5 w-5" />,
      badge: "3"
    },
    {
      href: "/admin-dashboard/review",
      label: "Review Proposals",
      icon: <PlusCircle className="h-5 w-5" />,
      badge: null
    },
    {
      href: "/admin-dashboard/events",
      label: "Event Tracking",
      icon: <Calendar className="h-5 w-5" />,
      badge: "24"
    },
    {
      href: "/admin-dashboard/reports",
      label: "Reports",
      icon: <Clock className="h-5 w-5" />,
      badge: "2"
    },
  ]

  // Mobile version with enhanced design
  if (isMobile) {
    return (
      <>
        <button
          onClick={onOpen}
          className="fixed top-6 left-6 z-[60] lg:hidden p-3 rounded-2xl bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold shadow-2xl hover:shadow-cedo-gold/25 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold border border-cedo-gold/20"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden transition-all duration-300"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed top-0 left-0 w-80 h-full bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white z-[60] transform transition-all duration-500 ease-out lg:hidden shadow-2xl border-r border-cedo-gold/20 ${isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-label="Main sidebar"
        >
          <div className="flex flex-col h-full backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg">
                  <span className="font-bold text-cedo-blue text-xl">C</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-cedo-gold">CEDO</div>
                  <div className="text-xs text-white/70">Student Portal</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cedo-gold"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6 text-cedo-gold" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    isActive={pathname === item.href || (item.href !== "/student-dashboard" && pathname.startsWith(item.href))}
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

            {/* Footer */}
            <div className="p-4 border-t border-cedo-gold/20 bg-gradient-to-r from-cedo-blue/50 to-transparent">
              <div className="text-center text-xs text-white/60">
                © 2024 CEDO Student Portal
              </div>
            </div>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar with enhanced design
  return (
    <>
      {/* Hover detection container */}
      <div className="group" style={{ width: collapsed ? '5rem' : '18rem' }}>

        {/* Hidden button that shows on hover */}
        <button
          onClick={toggleDesktopCollapse}
          className={`fixed z-30 p-2 rounded-r-xl bg-gradient-to-r from-cedo-blue to-cedo-blue/90 text-cedo-gold shadow-2xl hover:shadow-cedo-gold/25 hover:scale-105 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-cedo-gold border border-l-0 border-cedo-gold/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible`}
          style={{
            top: '4rem', // 64px header + 16px margin
            left: collapsed ? '5rem' : '18rem', // Exactly at sidebar edge
            transition: 'left 500ms ease-out, opacity 300ms ease-out, visibility 300ms ease-out',
            borderTopLeftRadius: '0',
            borderBottomLeftRadius: '0'
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <Sidebar
          className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-cedo-blue via-cedo-blue to-cedo-blue/95 text-white transition-all duration-500 ease-out shadow-2xl border-r border-cedo-gold/20 ${collapsed ? "w-20" : "w-72"
            }`}
          style={{
            width: collapsed ? '5rem' : '18rem', // Fallback inline styles
            transition: 'width 500ms ease-out'
          }}
        >
          {/* Header */}
          <SidebarHeader className="py-6 px-4 border-b border-cedo-gold/20 bg-gradient-to-r from-cedo-blue to-cedo-blue/80">
            {/* Debug indicator */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-50">
                {collapsed ? 'COLLAPSED' : 'EXPANDED'}
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-cedo-gold to-cedo-gold-dark flex items-center justify-center shadow-lg">
                  <span className="font-bold text-cedo-blue text-xl">C</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                {!collapsed && (
                  <div className="transition-all duration-300">
                    <div className="font-bold text-2xl text-cedo-gold">CEDO</div>
                    <div className="text-xs text-white/70">Student Portal</div>
                  </div>
                )}
              </div>
            </div>
          </SidebarHeader>

          {/* Content */}
          <SidebarContent className="px-4 py-6 flex flex-col h-full">
            {/* Main Navigation */}
            <SidebarMenu className="space-y-2 flex-1">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <NavItem
                      href={item.href}
                      isActive={pathname === item.href || (item.href !== "/student-dashboard" && pathname.startsWith(item.href))}
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

            {/* Footer */}
            {!collapsed && (
              <div className="mt-4 pt-4 border-t border-cedo-gold/20">
                <div className="text-center text-xs text-white/60 bg-gradient-to-r from-transparent via-white/5 to-transparent py-2 rounded-lg">
                  © 2024 CEDO Student Portal
                </div>
              </div>
            )}
          </SidebarContent>
        </Sidebar>
      </div>
    </>
  )
}
