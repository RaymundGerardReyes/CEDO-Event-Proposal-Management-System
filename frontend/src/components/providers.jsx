"use client";

import RouterStabilizer from "@/components/RouterStabilizer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }) {
    return (
        <RouterStabilizer>
            <ThemeProvider>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </ThemeProvider>
        </RouterStabilizer>
    );
} 