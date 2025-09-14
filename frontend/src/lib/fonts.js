// frontend/src/lib/fonts.js
// Purpose: Centralized font configuration for CEDO frontend
// Key approaches: Robust font loading with fallbacks, error handling, performance optimization
// Refactor: Created to prevent font loading issues and provide consistent typography

import { Inter } from "next/font/google";

// ✅ ENHANCED: Inter font configuration with fallbacks and error handling
export const inter = Inter({
    subsets: ["latin"],
    display: "swap", // Prevent layout shift
    preload: true,   // Preload for better performance
    fallback: [
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "sans-serif"
    ],
    // ✅ ADDED: Variable font for better performance
    variable: "--font-inter",
    // ✅ ADDED: Adjust font loading behavior
    adjustFontFallback: true,
});

// ✅ ADDED: Font loading status utility
export const getFontLoadingStatus = () => {
    if (typeof window === 'undefined') {
        return 'server';
    }

    // Check if Inter font is loaded
    const interLoaded = document.fonts.check('1em Inter');
    return interLoaded ? 'loaded' : 'loading';
};

// ✅ ADDED: Font fallback utility
export const getFontFallback = () => {
    return [
        'var(--font-inter)',
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif'
    ].join(', ');
};

// ✅ ADDED: Font loading promise for components that need to wait for fonts
export const waitForFonts = () => {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    return document.fonts.ready;
};

// ✅ ADDED: Font loading error handler
export const handleFontError = (error) => {
    console.warn('Font loading error:', error);
    // Fallback to system fonts
    document.documentElement.style.setProperty(
        '--font-inter',
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    );
};

// ✅ ADDED: Initialize font loading with error handling
export const initializeFonts = () => {
    if (typeof window === 'undefined') {
        return;
    }

    // Listen for font loading events
    document.fonts.addEventListener('loadingdone', () => {
        console.log('✅ Fonts loaded successfully');
    });

    document.fonts.addEventListener('loadingerror', (event) => {
        console.warn('⚠️ Font loading error:', event);
        handleFontError(event);
    });

    // Check if fonts are already loaded
    if (document.fonts.ready) {
        console.log('✅ Fonts already loaded');
    }
};
















