// app/layout.jsx

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure this is imported

// REMOVE THIS LINE - You don't import static assets from 'public' this way
// import profileAvatar from '@/public/images/profile-avatar.png';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ProposeConnect - Event Proposal Management System",
  description: "Streamlined event proposal submission and management",
  generator: "v0.dev",
  // 'viewport' and 'themeColor' should be moved to the dedicated 'viewport' export below
};

// Correct way to export viewport and themeColor settings as per Next.js guidelines
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c2d6b', // themeColor can also have an array for light/dark modes
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Next.js will automatically add viewport and theme-color meta tags
          based on the 'viewport' export above. Do not add manual meta tags here
          for properties managed by Next.js metadata API.
        */}
      </head>
      <body className={`${inter.className} bg-[#f8f9fa]`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              {/* If AppSidebar or AppHeader uses profile-avatar.png,
                  they should reference it as a string path, e.g., "/images/profile-avatar.png" */}
              <AppSidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}