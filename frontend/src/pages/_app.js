import '@/app/globals.css';
import { Toaster, ToastProvider } from "@/components/ui/use-toast";
import { AuthProvider } from '@/contexts/auth-context';

function MyApp({ Component, pageProps }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <Component {...pageProps} />
                <Toaster />
            </AuthProvider>
        </ToastProvider>
    );
}
export default MyApp;