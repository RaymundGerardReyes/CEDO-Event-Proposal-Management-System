import { AppHeader } from "@/components/dashboard/admin/app-header"
import { AppSidebar } from "@/components/dashboard/admin/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
})

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
        {/* Modern CSS Grid Layout - Mobile First */}
        <div className={`
          ${inter.variable} font-sans
          min-h-screen bg-gradient-to-br from-slate-50 to-slate-100
          grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[auto_1fr]
          transition-all duration-300 ease-in-out
        `}>

          {/* Sidebar - Responsive positioning */}
          <aside className="
            order-2 lg:order-1
            lg:sticky lg:top-0 lg:h-screen
            overflow-hidden
          ">
            <AppSidebar />
          </aside>

          {/* Main Content Area - Flexible and responsive */}
          <main className="
            order-1 lg:order-2
            flex flex-col
            min-h-screen lg:h-screen
            overflow-hidden
          ">
            {/* Header - Sticky on all devices */}
            <header className="
              sticky top-0 z-30
              bg-white/95 backdrop-blur-md
              border-b border-slate-200/60
              shadow-sm
            ">
              <AppHeader />
            </header>

            {/* Content Area - Flexible scrolling */}
            <section className="
              flex-1 
              overflow-auto
              bg-gradient-to-br from-slate-50/50 to-white/50
              px-4 sm:px-6 lg:px-8
              py-4 sm:py-6 lg:py-8
              space-y-4 sm:space-y-6 lg:space-y-8
            ">
              {/* Content wrapper for consistent max-width */}
              <div className="
                mx-auto
                max-w-7xl
                w-full
              ">
                {children}
              </div>
            </section>
          </main>
        </div>

        {/* Toast notifications */}
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  )
}