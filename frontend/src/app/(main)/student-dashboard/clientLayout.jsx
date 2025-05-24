"use client"

import { AppSidebar } from "@/components/dashboard/student/app-sidebar"
import Header from "@/components/dashboard/student/header"
import { ThemeProvider } from "@/components/dashboard/student/theme-provider"
import { SidebarProvider } from "@/components/dashboard/student/ui/sidebar"
import { Toaster } from "@/components/dashboard/student/ui/toaster"
import { Inter } from "next/font/google"
import { useEffect, useState } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Base class from the font should be safe for SSR
  let bodyClasses = inter.className
  if (mounted) {
    // Add other classes only after client has mounted
    bodyClasses = `${inter.className} bg-[#f5f7fa]`
  }

  return (
    <div className={bodyClasses}>
      {mounted && ( // Only render theme provider and children once mounted
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              <AppSidebar />
              <SidebarAwareContent>
                <Header />
                <main className="flex-1 overflow-auto bg-white p-6 md:p-8 lg:p-10" role="main">
                  <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
                </main>
              </SidebarAwareContent>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      )}
    </div>
  )
}

// This component adjusts its margin based on sidebar state
function SidebarAwareContent({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarCollapsed(true)
    }

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("sidebar-toggle", handleSidebarToggle)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sidebar-toggle", handleSidebarToggle)
      }
    }
  }, [])

  const marginClass = isMounted ? (sidebarCollapsed ? "md:ml-16" : "md:ml-64") : "md:ml-64"

  return <div className={`flex flex-1 flex-col transition-all duration-300 ${marginClass}`}>{children}</div>
}
