import ClientLayout from "./clientLayout";

// After (Correct)
export const metadata = {
  title: "SDP Event Approval Platform",
  description: "Scholars Development Program Event Approval System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>
}


import './globals.css';
