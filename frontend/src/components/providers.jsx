"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from '@/components/ui/use-toast';
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ToastProvider>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
} 