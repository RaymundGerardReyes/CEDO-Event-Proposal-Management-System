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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c2d6b"
}

export default function RootLayout({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SidebarProvider defaultOpen={true}>
        <div className="bg-background layout-container">
          <div className="flex h-screen">
            {/* Fixed Sidebar */}
            <AppSidebar />

            {/* Main Content Area with Responsive Margin */}
            <div
              className="flex-1 flex flex-col sidebar-main-content transition-all duration-300 ease-out container-reset"
              style={{ backgroundColor: 'transparent' }}
            >
              {/* Header with responsive padding */}
              <header className="sticky top-0 z-header bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <AppHeader />
              </header>

              {/* Main content with responsive overflow handling */}
              <main className="flex-1 main-content-responsive z-content" style={{ backgroundColor: 'transparent' }}>
                {children}
              </main>
            </div>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  )
}
