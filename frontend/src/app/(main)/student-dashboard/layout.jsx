import ClientLayout from "./clientLayout";
import './globals.css';

// ✅ Enable ISR for better performance - Server Component can export revalidate
export const revalidate = 300; // Revalidate every 5 minutes

export const metadata = {
  title: "SDP Event Approval Platform",
  description: "Scholars Development Program Event Approval System",
  icons: {
    icon: [
      {
        url: '/Favicon-CEDO.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      }
    ],
    shortcut: '/Favicon-CEDO.svg',
    apple: [
      {
        url: '/Favicon-CEDO.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      }
    ]
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Student Dashboard Layout Component
 * 
 * Main layout wrapper for the student dashboard that delegates
 * to the ClientLayout component for the actual UI structure.
 * Follows Next.js App Router layout conventions.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} The student dashboard layout
 */
export default function StudentDashboardLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>
}
