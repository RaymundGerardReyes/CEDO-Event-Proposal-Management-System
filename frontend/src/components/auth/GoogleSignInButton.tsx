/**
 * Google Sign-In button component
 * Handles Google authentication button rendering and state
 */
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
    onError: (message: string) => void;
}

const GOOGLE_BUTTON_CONTAINER_ID = "google-signin-button-container";

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
    const { isGoogleButtonRendered, isGoogleAuthProcessing } = useGoogleAuth();
    const isMobile = useIsMobile();

    return (
        <div className="mb-4 w-full min-h-[40px] flex justify-center items-center">
            {isGoogleAuthProcessing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center items-center text-sm text-muted-foreground"
                >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading Google Sign-In...</span>
                </motion.div>
            )}

            <div
                id={GOOGLE_BUTTON_CONTAINER_ID}
                className="w-full min-h-[40px] flex justify-center items-center"
                style={{ display: isGoogleAuthProcessing ? 'none' : 'flex' }}
            >
                {!isGoogleButtonRendered && !isGoogleAuthProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-muted-foreground"
                    >
                        Initializing Google Sign-In...
                    </motion.div>
                )}
            </div>
        </div>
    );
}








