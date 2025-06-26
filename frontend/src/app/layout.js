// frontend/src/app/layout.js (or layout.jsx if you prefer)
import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering globally to prevent SSG issues with useSearchParams
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = false;

export const metadata = {
  title: 'CEDO Partnership Management',
  description: 'Manage partnerships and events efficiently',
}

export default function RootLayout({ children }) {
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
