// frontend/src/app/layout.js (or layout.jsx if you prefer)
import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

// Force dynamic rendering globally to prevent SSG issues with useSearchParams
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = false;

export const metadata = {
  title: 'CEDO Partnership Management',
  description: 'Manage partnerships and events efficiently',
}

// Next.js 15 requires viewport to be exported separately
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Suppress third-party deprecation warnings in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');

    // Suppress specific deprecation warnings from third-party libraries
    if (message.includes('-ms-high-contrast is in the process of being deprecated') ||
      message.includes('Forced Colors Mode standard') ||
      message.includes('[Deprecation]')) {
      return;
    }

    // Keep other important warnings
    originalWarn(...args);
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
