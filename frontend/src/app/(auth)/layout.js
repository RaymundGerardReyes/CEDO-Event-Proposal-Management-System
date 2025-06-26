// frontend/src/app/(auth)/layout.js
import DOMErrorBoundary from "@/components/dom-error-boundary";
import { Inter } from "next/font/google";
// import "../globals.css"; // Temporarily disabled due to Turbopack CSS processing issue

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CEDO Management Portal",
  description: "Partnership and Proposal Management System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <DOMErrorBoundary>
      {children}
    </DOMErrorBoundary>
  );
}