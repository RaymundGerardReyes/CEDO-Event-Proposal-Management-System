"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"; // Assuming this is your custom sidebar component
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming this hook is correctly defined
import { BarChart3, CalendarDays, ClipboardCheck, FileText, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Helper function to check if the current path matches a nav item
function isPathActive(currentPathname, linkHref) {
  // Exact match for the main dashboard link
  if (linkHref === "/admin-dashboard") {
    return currentPathname === linkHref;
  }
  // For all other links, check if the current path starts with the link's href
  // This handles cases like /admin-dashboard/proposals and /admin-dashboard/proposals/some-id
  return currentPathname.startsWith(linkHref);
}


export function AppSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile() // Fixed usage - returns boolean directly
  const [isCollapsed, setIsCollapsed] = useState(false); // State to manage sidebar collapse

  const sidebarMenuItems = [
    { href: "/admin-dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5 mr-3" /> },
    { href: "/admin-dashboard/proposals", label: "Proposals", icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: "/admin-dashboard/review", label: "Review Proposals", icon: <ClipboardCheck className="h-5 w-5 mr-3" /> },
    { href: "/admin-dashboard/events", label: "Event Tracking", icon: <CalendarDays className="h-5 w-5 mr-3" /> },
    { href: "/admin-dashboard/reports", label: "Reports", icon: <PieChart className="h-5 w-5 mr-3" /> },
  ];

  return (
    <Sidebar
      className={`border-r-0 bg-cedo-blue text-white shadow-md transition-all duration-300 z-50 ${isCollapsed ? "w-16" : "w-64"}`} // Adjust width based on collapse state
    >
      <SidebarHeader className="py-6 px-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-cedo-gold flex items-center justify-center shadow-sm">
            <span className="font-bold text-cedo-blue text-lg">C</span>
          </div>
          {!isCollapsed && <div className="font-bold text-xl text-cedo-gold">CEDO</div>}
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-white">
          {isCollapsed ? ">" : "<"} {/* Toggle button for collapsing */}
        </button>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {sidebarMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isPathActive(pathname, item.href)}
                className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                tooltip={isCollapsed ? undefined : item.label} // Show tooltip only when sidebar is expanded
              >
                <Link href={item.href}>
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-white/10 p-4">
        {/* Footer content can be added here if needed */}
        {isMobile && <div className="text-center text-xs text-white/50">©</div>}
        {!isMobile && <div className="text-center text-xs text-white/50">CEDO Portal © 2024</div>}
      </SidebarFooter>
    </Sidebar>
  )
}