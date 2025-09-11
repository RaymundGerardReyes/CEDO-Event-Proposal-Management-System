// frontend/src/components/ui/font-loader.jsx
// Purpose: Font loading component with fallback handling
// Key approaches: Font loading states, fallback rendering, error recovery
// Refactor: Created to provide consistent font loading experience

"use client";

import { getFontLoadingStatus, waitForFonts } from '@/lib/fonts';
import { useEffect, useState } from 'react';

/**
 * FontLoader Component
 * 
 * Handles font loading states and provides fallback rendering
 * while fonts are loading to prevent layout shifts.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.fallback - Fallback content while fonts load
 * @param {boolean} props.showFallback - Whether to show fallback during loading
 * @returns {JSX.Element} The font loader component
 */
export function FontLoader({
    children,
    fallback = null,
    showFallback = false
}) {
    const [fontStatus, setFontStatus] = useState('loading');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const checkFontStatus = () => {
            const status = getFontLoadingStatus();
            setFontStatus(status);
        };

        // Check initial status
        checkFontStatus();

        // Wait for fonts to load
        waitForFonts().then(() => {
            setFontStatus('loaded');
        }).catch((error) => {
            console.warn('Font loading failed:', error);
            setFontStatus('error');
        });

        // Listen for font loading events
        if (typeof window !== 'undefined') {
            const handleFontsLoaded = () => {
                setFontStatus('loaded');
            };

            const handleFontsError = () => {
                setFontStatus('error');
            };

            document.fonts.addEventListener('loadingdone', handleFontsLoaded);
            document.fonts.addEventListener('loadingerror', handleFontsError);

            return () => {
                document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
                document.fonts.removeEventListener('loadingerror', handleFontsError);
            };
        }
    }, []);

    // Show fallback during loading if requested
    if (showFallback && fontStatus === 'loading' && isClient) {
        return fallback || (
            <div className="font-sans">
                {children}
            </div>
        );
    }

    // Show content with appropriate font class
    return (
        <div className={fontStatus === 'loaded' ? 'font-inter' : 'font-sans'}>
            {children}
        </div>
    );
}

/**
 * FontLoadingIndicator Component
 * 
 * Shows a loading indicator while fonts are loading.
 * 
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @returns {JSX.Element} The font loading indicator
 */
export function FontLoadingIndicator({ message = "Loading fonts..." }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground font-sans">{message}</p>
            </div>
        </div>
    );
}

/**
 * useFontStatus Hook
 * 
 * Hook to get current font loading status.
 * 
 * @returns {string} Font loading status ('loading', 'loaded', 'error', 'server')
 */
export function useFontStatus() {
    const [fontStatus, setFontStatus] = useState('server');

    useEffect(() => {
        const checkStatus = () => {
            setFontStatus(getFontLoadingStatus());
        };

        checkStatus();

        if (typeof window !== 'undefined') {
            const handleFontsLoaded = () => setFontStatus('loaded');
            const handleFontsError = () => setFontStatus('error');

            document.fonts.addEventListener('loadingdone', handleFontsLoaded);
            document.fonts.addEventListener('loadingerror', handleFontsError);

            return () => {
                document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
                document.fonts.removeEventListener('loadingerror', handleFontsError);
            };
        }
    }, []);

    return fontStatus;
}







