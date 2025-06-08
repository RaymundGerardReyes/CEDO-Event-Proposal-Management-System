import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/use-toast';
import { AuthProvider } from '@/contexts/auth-context';
import '../app/globals.css'; // Use the correct path for your global styles

function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ToastProvider>
                <AuthProvider>
                    <Component {...pageProps} />
                    <Toaster />
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default MyApp;
