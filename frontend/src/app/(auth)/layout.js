// frontend/src/app/(auth)/layout.js
import { ThemeProvider } from "@/components/theme-provider"; // Assuming you have a theme provider
import { Toaster } from "@/components/ui/toaster"; // Assuming you use ShadCN toaster
import { Inter } from "next/font/google";
import "../globals.css"; // Your global styles

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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}