import AdminClientLayout from "./admin-client-layout";
import "./globals.css";

export const metadata = {
  title: "CEDO Admin Dashboard",
  description: "CEDO Scholars Development Program Admin Portal",
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
 * Admin Dashboard Layout Component
 * 
 * Server component that handles metadata and delegates to the client layout
 * for interactive functionality. Follows Next.js App Router conventions.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} The admin dashboard layout
 */
export default function AdminDashboardLayout({ children }) {
  return <AdminClientLayout>{children}</AdminClientLayout>
}
