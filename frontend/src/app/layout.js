// frontend/src/app/layout.js (or layout.jsx if you prefer)
"use client"; // Add "use client" if AuthProvider or ThemeProvider use client-side hooks like useState/useEffect directly

import { Inter } from "next/font/google"; // Or your preferred font
import "./globals.css"; // Your global styles

// Ensure this path correctly points to your auth-context.js file
// If your AuthContext.jsx was consolidated into auth-context.js, this is correct.
// If you decided to keep AuthContext.jsx and rename it, adjust the import.
import { AuthProvider } from "@/contexts/auth-context"; // This should point to the file you provided

import { ToastProvider } from "@/components/dashboard/admin/ui/use-toast";
import { ThemeProvider } from "@/components/theme-provider"; // Assuming you have a theme provider
import { Toaster } from "@/components/ui/toaster"; // Assuming you use ShadCN toaster 

const inter = Inter({ subsets: ["latin"] });

// Metadata should ideally be defined as an export if this is a Server Component,
// but if "use client" is needed at the top for providers, metadata handling might differ slightly
// or be set in child page.jsx/layout.jsx files.
// For simplicity, if "use client" is at the top, we'll omit static metadata export here.
// export const metadata = {
//   title: "CEDO Management Portal",
//   description: "Partnership and Proposal Management System",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* You can add meta tags, link tags here if not using static metadata export */}
        <title>CEDO Management Portal</title>
        <meta name="description" content="Partnership and Proposal Management System" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/*
            Ensure AuthProvider is imported from the correct file:
            src/contexts/auth-context.js (the one you provided that contains the useAuth hook throwing the error)
          */}
          <AuthProvider>
            <ToastProvider>
              {children} {/* This will render your page content, including (main)/layout.js */}
              <Toaster />  {/* Toaster for notifications */}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
