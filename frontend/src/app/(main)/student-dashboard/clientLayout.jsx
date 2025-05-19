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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} bg-[#f5f7fa]`}>
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
      </body>
    </html>
  )
}

// This component adjusts its margin based on sidebar state
function SidebarAwareContent({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check initial screen size
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true)
    }

    // Listen for sidebar toggle events
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    window.addEventListener("sidebar-toggle", handleSidebarToggle)

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle)
    }
  }, [])

  // Only apply margin after component mounts to avoid hydration mismatch
  const marginClass = isMounted ? (sidebarCollapsed ? "md:ml-16" : "md:ml-64") : "md:ml-64"

  return <div className={`flex flex-1 flex-col transition-all duration-300 ${marginClass}`}>{children}</div>
}
