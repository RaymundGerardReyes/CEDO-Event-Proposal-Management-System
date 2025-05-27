import { AppHeader } from "@/components/dashboard/admin/app-header"
import { AppSidebar } from "@/components/dashboard/admin/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ProposeConnect - Event Proposal Management System",
  description: "Streamlined event proposal submission and management",
  generator: "v0.dev"
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
}

export const themeColor = "#0c2d6b"

export default function RootLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col md:flex-row">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  )
}
