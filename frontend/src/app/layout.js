// frontend/src/app/layout.js
// Purpose: Root layout for CEDO partnership management frontend
// Key approaches: Centralized font loading, error handling, performance optimization
// Refactor: Updated to use centralized font utility and added font initialization

import { Providers } from "@/components/providers";
// ✅ FIXED: Use centralized font configuration
import { initializeFonts, inter } from "@/lib/fonts";
import "./globals.css";

// Force dynamic rendering globally to prevent SSG issues with useSearchParams
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = false;

export const metadata = {
  title: 'CEDO Partnership Management',
  description: 'Manage partnerships and events efficiently',
}

export default function RootLayout({ children }) {
  // ✅ ADDED: Initialize font loading with error handling
  if (typeof window !== 'undefined') {
    // Initialize fonts on client side
    initializeFonts();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
