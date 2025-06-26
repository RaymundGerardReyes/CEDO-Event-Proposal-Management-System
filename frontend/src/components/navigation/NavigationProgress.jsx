'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

/**
 * Custom Link component with loading states for Next.js 13+ App Router
 * Based on: https://github.com/vercel/next.js/discussions/41934
 */
export function NavigationLink({ href, children, className, ...props }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleClick = (e) => {
        // Check for modifier keys (new tab behavior)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return; // Let default behavior handle new tab
        }

        // Check if same URL to prevent unnecessary loading
        if (href === window.location.href.replace(window.location.origin, '')) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <>
            <NextLink
                href={href}
                onClick={handleClick}
                className={`${className} ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                {...props}
            >
                {children}
                {isPending && (
                    <span className="ml-2 inline-block animate-spin">⏳</span>
                )}
            </NextLink>
        </>
    );
}

/**
 * Global navigation progress indicator
 */
export function NavigationProgress() {
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let progressInterval;

        if (isNavigating) {
            setProgress(0);
            progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 200);
        } else {
            setProgress(100);
            setTimeout(() => setProgress(0), 500);
        }

        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [isNavigating]);

    // Listen for navigation events using pathname changes
    useEffect(() => {
        const handleStart = () => setIsNavigating(true);
        const handleComplete = () => setIsNavigating(false);

        // Monitor fetch requests to detect navigation
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource] = args;
            if (typeof resource === 'string' && resource.includes('/submit-event/')) {
                handleStart();
            }

            try {
                const response = await originalFetch(...args);
                handleComplete();
                return response;
            } catch (error) {
                handleComplete();
                throw error;
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    if (!isNavigating && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div
                className="h-1 bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
            {isNavigating && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading reporting section... This may take a moment for first-time compilation.</span>
                    </div>
                </div>
            )}
        </div>
    );
} 