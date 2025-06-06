"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { BarChart3, CalendarDays, ClipboardCheck, FileText, HelpCircle, PieChart, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppSidebar() {
    const pathname = usePathname()
    const isMobile = useIsMobile()

    return (
        <Sidebar
            className={`border-r-0 bg-cedo-blue text-white shadow-md transition-all duration-300 z-50 ${isMobile ? "w-16" : ""}`}
        >
            <SidebarHeader className="py-6 px-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-cedo-gold flex items-center justify-center shadow-sm">
                        <span className="font-bold text-cedo-blue text-lg">C</span>
                    </div>
                    {!isMobile && <div className="font-bold text-xl text-cedo-gold">CEDO</div>}
                </div>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isPathActive(pathname, "/")}
                            className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                        >
                            <Link href="/">
                                <BarChart3 className="h-5 w-5 mr-3" />
                                {!isMobile && <span>Dashboard</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isPathActive(pathname, "/proposals")}
                            className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                        >
                            <Link href="/proposals">
                                <FileText className="h-5 w-5 mr-3" />
                                {!isMobile && <span>Proposals</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isPathActive(pathname, "/review")}
                            className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                        >
                            <Link href="/review">
                                <ClipboardCheck className="h-5 w-5 mr-3" />
                                {!isMobile && <span>Review Proposals</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isPathActive(pathname, "/events")}
                            className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                        >
                            <Link href="/events">
                                <CalendarDays className="h-5 w-5 mr-3" />
                                {!isMobile && <span>Event Tracking</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isPathActive(pathname, "/reports")}
                            className="text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 data-[active=true]:bg-cedo-gold/20 data-[active=true]:text-cedo-gold data-[active=true]:font-medium"
                        >
                            <Link href="/reports">
                                <PieChart className="h-5 w-5 mr-3" />
                                {!isMobile && <span>Reports</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="mt-auto border-t border-white/10 p-4">
                <div className="space-y-2">
                    <SidebarMenuButton
                        asChild
                        className="text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200 w-full"
                    >
                        <Link href="/settings">
                            <Settings className="h-5 w-5 mr-3" />
                            {!isMobile && <span>Settings</span>}
                        </Link>
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        asChild
                        className="text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200 w-full"
                    >
                        <Link href="/help">
                            <HelpCircle className="h-5 w-5 mr-3" />
                            {!isMobile && <span>Help & Support</span>}
                        </Link>
                    </SidebarMenuButton>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

// Helper function to check if the current path matches a nav item
function isPathActive(pathname, route) {
    if (route === "/" && pathname === "/") {
        return true
    }
    if (route !== "/" && pathname.startsWith(route)) {
        return true
    }
    return false
}
