"use client"

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Import the necessary icons from lucide-react
import { BarChart3, Calendar, ClipboardCheck, Clock, FileText, HelpCircle, Settings } from 'lucide-react';

// Import the sidebar components from your existing sidebar.jsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Helper function to check if a path is active
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Navigation items matching your existing folder structure
  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      href: "/proposals",
      label: "Proposals",
      icon: FileText,
    },
    {
      href: "/admin-dashboard/reviews", // Updated to match your folder structure
      label: "Review Proposals",
      icon: ClipboardCheck,
    },
    {
      href: "/event-tracking",
      label: "Event Tracking",
      icon: Calendar,
    },
    {
      href: "/admin-dashboard/reports", // Updated to match your folder structure
      label: "Reports",
      icon: Clock,
    },
  ];

  // Footer items
  const footerItems = [
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
    {
      href: "/help-support",
      label: "Help & Support",
      icon: HelpCircle,
    },
  ];

  return (
    <Sidebar className="border-r-0 bg-sidebar text-sidebar-foreground">
      {/* Logo Header */}
      <SidebarHeader className="flex items-center p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cedo-gold text-cedo-blue font-bold text-xl">
            C
          </div>
          <span className="text-xl font-semibold">CEDO</span>
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={cn(
                  "w-full justify-start text-white/90 hover:bg-white/10 hover:text-white",
                  "data-[active=true]:bg-white/20 data-[active=true]:text-white"
                )}
              >
                <Link href={item.href} className="flex items-center px-3 py-2">
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer Navigation */}
      <SidebarFooter className="mt-auto border-t border-white/10 px-2 py-4">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={cn(
                  "w-full justify-start text-white/90 hover:bg-white/10 hover:text-white",
                  "data-[active=true]:bg-white/20 data-[active=true]:text-white"
                )}
              >
                <Link href={item.href} className="flex items-center px-3 py-2">
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}