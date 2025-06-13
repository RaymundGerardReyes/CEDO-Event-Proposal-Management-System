// frontend/src/app/layout.js (or layout.jsx if you prefer)
import BrowserExtensionDetector from "@/components/browser-extension-detector";
import DOMErrorBoundary from "@/components/dom-error-boundary";
import DOMErrorMonitor from "@/components/dom-error-monitor";
import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import Script from "next/script";
import React from "react";
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
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/Favicon-CEDO.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      }
    ],
    shortcut: [
      {
        url: '/Favicon-CEDO.svg',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/Favicon-CEDO.svg',
        type: 'image/svg+xml',
        sizes: '180x180',
      }
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: '/Favicon-CEDO.svg',
        sizes: 'any',
      },
      {
        rel: 'mask-icon',
        url: '/Favicon-CEDO.svg',
        color: '#001a56',
      }
    ]
  },
  creator: 'CEDO Partnership Management',
  publisher: 'CEDO Partnership Management',
}

// Next.js 15 requires viewport to be exported separately
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#001a56',
  colorScheme: 'light',
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

// 🛡️ DEVELOPMENT NOTE: React StrictMode Detection
// React 18 StrictMode intentionally double-invokes components in development
// to detect side effects. This is normal behavior and won't happen in production.
// If you're experiencing double renders in Section3_SchoolEvent, this is likely the cause.
// 
// To temporarily disable for debugging (NOT recommended for production):
// 1. Wrap children in fragment instead of StrictMode
// 2. Remember to re-enable before deploying
//
// Learn more: https://react.dev/reference/react/StrictMode

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Force override any default favicons */}
        <link rel="icon" type="image/svg+xml" href="/Favicon-CEDO.svg" />
        <link rel="icon" type="image/x-icon" href="/Favicon-CEDO.svg" />
        <link rel="shortcut icon" href="/Favicon-CEDO.svg" />
        <link rel="apple-touch-icon" href="/Favicon-CEDO.svg" />
        <meta name="theme-color" content="#001a56" />
        <meta name="msapplication-TileColor" content="#001a56" />

        {/* ✅ SIMPLIFIED: Global handleCredentialResponse for COOP compatibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.handleCredentialResponse = function(response) {
                console.log('🔧 Global handleCredentialResponse called:', response);
                
                // Dispatch a custom event that React components can listen for
                try {
                  window.dispatchEvent(new CustomEvent('google-signin-response', { 
                    detail: response 
                  }));
                } catch (e) {
                  console.error('Error dispatching google-signin-response event:', e);
                }
              };
              
              console.log('✅ Global handleCredentialResponse defined in layout');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* ✅ SIMPLIFIED: Google Identity Services script with relaxed COOP policy */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          id="google-gsi-script"
        />

        {/* 🛡️ DOM Error Monitor - preventive measures for removeChild errors */}
        <DOMErrorMonitor />

        <div className="min-h-screen bg-background text-foreground">
          {/* 🛡️ DOM Error Boundary - catches removeChild and other DOM errors */}
          <DOMErrorBoundary>
            {/* 🛡️ StrictMode enabled - will cause double renders in development */}
            <React.StrictMode>
              <Providers>
                {children}
              </Providers>
            </React.StrictMode>
          </DOMErrorBoundary>
        </div>

        {/* 🔍 Browser Extension Detector - helps identify DOM manipulation issues */}
        <BrowserExtensionDetector />
      </body>
    </html>
  );
}
