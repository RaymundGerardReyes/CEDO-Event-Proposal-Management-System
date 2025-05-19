// frontend/src/components/dashboard/student/app-sidebar.jsx
"use client";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768; // px

// Helper component for navigation items
function NavItem({ href, isActive, icon, children, collapsed }) {
  return (
    <div className="relative group">
      <SidebarMenuButton
        href={href}
        isActive={isActive}
        icon={icon}
        className={`${collapsed ? "justify-center px-2" : ""}`}
      >
        {!collapsed && children}
      </SidebarMenuButton>

      {collapsed && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap z-20"
          role="tooltip"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = useCallback(() => {
    const currentlyMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(currentlyMobile);

    if (currentlyMobile) {
      setCollapsed(prevCollapsed => {
        if (!prevCollapsed) {
          window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: true } }));
          return true;
        }
        return prevCollapsed;
      });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: newCollapsedState } }));
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/events", label: "My Events", icon: <Calendar className="h-5 w-5" /> },
    { href: "/submit-event", label: "Submit New Event", icon: <PlusCircle className="h-5 w-5" /> },
    { href: "/sdp-credits", label: "SDP Credits", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/drafts", label: "Resume Drafts", icon: <Clock className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 flex flex-col h-screen bg-[#0A2B70] text-white z-10 transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"}`}
      aria-label="Main sidebar"
    >
      <div className="relative border-b border-[#1a3b80] py-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "px-4"} mb-2`}>
          <div className="h-10 w-10 rounded-full bg-[#f0c14b] flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-[#0A2B70] text-lg">C</span>
          </div>
          {!collapsed && (
            <div className="font-bold text-xl text-[#f0c14b] ml-3 whitespace-nowrap overflow-hidden">
              CEDO
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className={`absolute top-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#1a3b80] hover:bg-[#2a4b90] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#f0c14b] focus:ring-offset-2 focus:ring-offset-[#0A2B70] ${collapsed ? "left-1/2 -translate-x-1/2" : "right-4"}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar-menu"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-[#f0c14b]" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-[#f0c14b]" />
          )}
        </button>
      </div>

      <nav id="sidebar-menu" className="flex-grow space-y-1 mt-4 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            isActive={pathname === item.href}
            icon={item.icon}
            collapsed={collapsed}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>
    </aside>
  );
}