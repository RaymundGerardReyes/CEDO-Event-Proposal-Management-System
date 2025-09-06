// frontend/src/app/auth/layout.js
// Purpose: Auth layout wrapper for authentication pages
// Key approaches: Simplified layout without duplicate font loading, error boundary protection
// Refactor: Removed duplicate Inter font import to prevent font loading conflicts

import DOMErrorBoundary from "@/components/dom-error-boundary";
// ✅ FIXED: Removed duplicate Inter font import - already loaded in root layout
// import { Inter } from "next/font/google";
// import "../globals.css"; // Temporarily disabled due to Turbopack CSS processing issue

// ✅ FIXED: Removed duplicate font instance - using root layout font
// const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CEDO Management Portal",
  description: "Partnership and Proposal Management System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AuthLayout({ children }) {
  return (
    <DOMErrorBoundary>
      {children}
    </DOMErrorBoundary>
  );
}