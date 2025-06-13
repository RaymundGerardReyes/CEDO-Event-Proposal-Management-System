"use client"

import { AppSidebar } from "@/components/dashboard/student/app-sidebar"
import Header from "@/components/dashboard/student/header"
import { ThemeProvider } from "@/components/dashboard/student/theme-provider"
import { SidebarProvider, useSidebar } from "@/components/dashboard/student/ui/sidebar"
import { Toaster } from "@/components/dashboard/student/ui/toaster"
import { Inter } from "next/font/google"
import { memo, useCallback, useEffect, useMemo, useState } from "react"

const inter = Inter({ subsets: ["latin"] })

// ✅ Memoized sidebar layout wrapper
const SidebarLayout = memo(({ children }) => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {children}
    </div>
  )
});

SidebarLayout.displayName = "SidebarLayout";

// ✅ Optimized SidebarAwareContent with better memoization
const SidebarAwareContent = memo(({ children }) => {
  const { isMobile } = useSidebar()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ✅ Memoized event handler to prevent recreation on every render
  const handleSidebarToggle = useCallback((e) => {
    if (!e.detail.isMobile) {
      setSidebarCollapsed(e.detail.collapsed)
    }
  }, [])

  // Listen for sidebar toggle events (keeping this for backward compatibility)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("sidebar-toggle", handleSidebarToggle)
      return () => window.removeEventListener("sidebar-toggle", handleSidebarToggle)
    }
  }, [handleSidebarToggle])

  // ✅ Memoized margin calculation - NOW USING OVERLAY APPROACH (0 margin)
  const marginValues = useMemo(() => {
    // Always use 0 margin - sidebar will overlay the content
    return { class: "", style: "0rem" } // No margin - full width content with overlay sidebar
  }, [isMounted, isMobile, sidebarCollapsed])

  // ✅ Memoized inline styles - NOW FULL WIDTH OVERLAY APPROACH
  const containerStyles = useMemo(() => ({
    marginLeft: '0', // Always 0 - no margin
    transition: 'margin-left 500ms ease-out',
    width: '100%' // Always full width
  }), [isMobile, marginValues.style])

  return (
    <div
      className={`flex flex-1 flex-col min-h-screen transition-all duration-500 ease-out ${marginValues.class}`}
      style={containerStyles}
    >
      {children}
    </div>
  )
});

SidebarAwareContent.displayName = "SidebarAwareContent";

// ✅ Memoized main content wrapper
const MainContent = memo(({ children }) => (
  <main className="flex-0 overflow-auto bg-white p-4 sm:p-6 md:p-8 lg:p-10 min-h-0" role="main">
    <div className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">{children}</div>
  </main>
));

MainContent.displayName = "MainContent";

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Memoized body classes to prevent recalculation
  const bodyClasses = useMemo(() => {
    let classes = inter.className
    if (mounted) {
      classes = `${inter.className} bg-[#f5f7fa]`
    }
    return classes
  }, [mounted])

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className={inter.className}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001a56]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={bodyClasses}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <SidebarProvider>
          <SidebarLayout>
            <AppSidebar />
            <SidebarAwareContent>
              <Header />
              <MainContent>
                {children}
              </MainContent>
            </SidebarAwareContent>
          </SidebarLayout>
          <Toaster />
        </SidebarProvider>
      </ThemeProvider>
    </div>
  )
}
