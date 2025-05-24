"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton as UiSidebarMenuButton
} from "@/components/dashboard/student/ui/sidebar"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  LayoutDashboard,
  Menu,
  PlusCircle,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

function LocalSidebarMenuButton({ href, isActive, icon, children, className = "", onClick }) {
  return (
    <Link href={href} passHref legacyBehavior>
      <a
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 hover:bg-[#1a3b80] focus:outline-none focus:ring-2 focus:ring-[#f0c14b] focus:ring-offset-2 focus:ring-offset-[#0A2B70] ${isActive ? "bg-[#1a3b80] text-[#f0c14b]" : "text-white hover:text-[#f0c14b]"
          } ${className}`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="font-medium truncate">{children}</span>
      </a>
    </Link>
  )
}

function NavItem({ href, isActive, icon, children, collapsed, onClick }) {
  return (
    <div className="relative group">
      <LocalSidebarMenuButton
        href={href}
        isActive={isActive}
        icon={icon}
        onClick={onClick}
        className={`${collapsed ? "justify-center px-2" : ""}`}
      >
        {!collapsed && children}
      </LocalSidebarMenuButton>

      {collapsed && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none"
          role="tooltip"
        >
          {children}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleResize = useCallback(() => {
    const currentlyMobile = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(currentlyMobile)
    if (currentlyMobile) {
      setMobileOpen(false)
    } else {
      // Optionally set a default collapsed state for desktop on initial load if needed
      // setCollapsed(false); // Default to expanded on desktop
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize])

  // Dispatch sidebar state changes (if other components listen to this)
  useEffect(() => {
    if (!isMobile) {
      window.dispatchEvent(
        new CustomEvent("sidebar-toggle", {
          detail: { collapsed, isMobile: false },
        }),
      )
    }
  }, [collapsed, isMobile])

  const toggleDesktopCollapse = () => {
    const newCollapsedState = !collapsed
    setCollapsed(newCollapsedState)
    // Dispatch event if needed (already handled by useEffect above)
  }

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavItemClickMobile = () => {
    if (isMobile) {
      setMobileOpen(false) // Close mobile menu on item click
    }
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/student-dashboard/events", label: "My Events", icon: <Calendar className="h-5 w-5" /> },
    { href: "/student-dashboard/submit-event", label: "Submit New Event", icon: <PlusCircle className="h-5 w-5" /> },
    { href: "/student-dashboard/sdp-credits", label: "SDP Credits", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/student-dashboard/drafts", label: "Resume Drafts", icon: <Clock className="h-5 w-5" /> },
  ]

  // Mobile version (uses overlay, local NavItem and LocalSidebarMenuButton with Link)
  if (isMobile) {
    return (
      <>
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-[60] lg:hidden p-2 rounded-lg bg-[#0A2B70] text-[#f0c14b] shadow-lg hover:bg-[#1a3b80] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#f0c14b]"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed top-0 left-0 w-64 h-full bg-[#0A2B70] text-white z-[60] transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-label="Main sidebar"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-[#1a3b80]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#f0c14b] flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-[#0A2B70] text-lg">C</span>
                </div>
                <div className="font-bold text-xl text-[#f0c14b]">CEDO</div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-[#1a3b80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f0c14b]"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5 text-[#f0c14b]" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  isActive={pathname === item.href}
                  icon={item.icon}
                  collapsed={false}
                  onClick={handleNavItemClickMobile}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar - Refactored to use common UI components
  return (
    <Sidebar
      className={`fixed top-0 left-0 h-screen bg-[#0A2B70] text-white z-30 transition-all duration-300 ease-in-out shadow-md border-r-0 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <SidebarHeader className="py-6 px-4 border-b border-[#1a3b80] flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#f0c14b] flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="font-bold text-[#0A2B70] text-lg">C</span>
          </div>
          {!collapsed && <div className="font-bold text-xl text-[#f0c14b] truncate">CEDO</div>}
        </div>
        <button
          onClick={toggleDesktopCollapse}
          className="p-1.5 rounded-full hover:bg-[#1a3b80] transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#f0c14b] text-[#f0c14b]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <UiSidebarMenuButton
                asChild
                href={item.href}
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                className="text-white/90 hover:bg-[#1a3b80] hover:text-[#f0c14b] transition-colors duration-200 data-[active=true]:bg-[#2a4b90] data-[active=true]:text-[#f0c14b] data-[active=true]:font-medium"
                tooltip={collapsed ? item.label : undefined}
              >
                <Link href={item.href} className="flex items-center w-full">
                  <span className={`flex-shrink-0 ${collapsed ? "" : "mr-3"}`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </UiSidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Optional Footer, if desired, similar to admin sidebar */}
      {/* <SidebarFooter className="mt-auto border-t border-[#1a3b80] p-4">
        {!collapsed && <div className="text-center text-xs text-white/50">Student Portal © 2024</div>}
        {collapsed && <div className="text-center text-xs text-white/50">©</div>}
      </SidebarFooter> */}
    </Sidebar>
  )
}
