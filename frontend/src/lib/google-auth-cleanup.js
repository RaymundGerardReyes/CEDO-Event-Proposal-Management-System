/**
 * Google Sign-In Cleanup Utility
 * 
 * Addresses Next.js 15.3.2 + Turbopack state persistence issues
 * that cause "Another Google Sign-In operation is already in progress" errors.
 * 
 * Based on Next.js discussion: https://github.com/vercel/next.js/discussions/55987
 */

/**
 * Force cleanup all Google Sign-In state across the application
 * This addresses Turbopack's aggressive state persistence
 */
export function forceCleanupAllGoogleState() {
    console.log("🧹 FORCE CLEANUP ALL: Starting comprehensive Google Sign-In state cleanup");

    if (typeof window === 'undefined') {
        console.log("🧹 FORCE CLEANUP ALL: Server-side, skipping cleanup");
        return;
    }

    try {
        // 1. Cancel any active Google operations
        if (window.google?.accounts?.id) {
            try {
                window.google.accounts.id.cancel();
                console.log("✅ FORCE CLEANUP ALL: Called google.accounts.id.cancel()");
            } catch (error) {
                console.warn("⚠️ FORCE CLEANUP ALL: Error calling google.accounts.id.cancel():", error);
            }
        }

        // 2. Clear all window-level Google state
        if (window.__googleSignInPromiseActions) {
            delete window.__googleSignInPromiseActions;
            console.log("✅ FORCE CLEANUP ALL: Cleared window.__googleSignInPromiseActions");
        }

        if (window.__currentSignInPromiseActions) {
            delete window.__currentSignInPromiseActions;
            console.log("✅ FORCE CLEANUP ALL: Cleared window.__currentSignInPromiseActions");
        }

        if (window.handleCredentialResponse) {
            delete window.handleCredentialResponse;
            console.log("✅ FORCE CLEANUP ALL: Cleared window.handleCredentialResponse");
        }

        // 3. Clear all Google Sign-In related localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('google') ||
                key.includes('gsi') ||
                key.includes('gapi') ||
                key.includes('orphanedGoogleCredential')
            )) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`✅ FORCE CLEANUP ALL: Removed localStorage key: ${key}`);
        });

        // 4. Clear all Google Sign-In related sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (
                key.includes('google') ||
                key.includes('gsi') ||
                key.includes('gapi')
            )) {
                sessionKeysToRemove.push(key);
            }
        }

        sessionKeysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            console.log(`✅ FORCE CLEANUP ALL: Removed sessionStorage key: ${key}`);
        });

        // 5. Remove any Google Sign-In buttons from DOM
        const googleButtons = document.querySelectorAll('[id*="google"], [class*="google"], [data-testid*="google"]');
        googleButtons.forEach(button => {
            if (button.innerHTML.includes('Sign in with Google') || button.innerHTML.includes('signin_with')) {
                button.innerHTML = '';
                console.log("✅ FORCE CLEANUP ALL: Cleared Google button content");
            }
        });

        // 6. Clear any Google-related timeouts/intervals
        // Note: This is aggressive but necessary for Turbopack
        const highestTimeoutId = setTimeout(() => { }, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        console.log("✅ FORCE CLEANUP ALL: Cleared all timeouts");

        // 7. Reset Google script loading state
        const googleScript = document.getElementById('google-identity-services-script');
        if (googleScript) {
            googleScript.setAttribute('data-loaded', 'false');
            console.log("✅ FORCE CLEANUP ALL: Reset Google script loading state");
        }

        const gsiScript = document.getElementById('google-gsi-client-script');
        if (gsiScript) {
            gsiScript.remove();
            console.log("✅ FORCE CLEANUP ALL: Removed Google GSI script");
        }

        console.log("🧹 FORCE CLEANUP ALL: Comprehensive cleanup completed");
        return true;

    } catch (error) {
        console.error("❌ FORCE CLEANUP ALL: Error during cleanup:", error);
        return false;
    }
}

/**
 * Initialize a clean Google Sign-In state
 * Call this before attempting any Google Sign-In operations
 */
export function initializeCleanGoogleState() {
    console.log("🔧 INIT CLEAN: Initializing clean Google Sign-In state");

    // First, force cleanup everything
    forceCleanupAllGoogleState();

    // Wait for cleanup to complete
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("🔧 INIT CLEAN: Clean state initialization completed");
            resolve();
        }, 100);
    });
}

/**
 * Monitor and auto-cleanup stuck Google Sign-In states
 * Useful for development with Turbopack hot reloading
 */
export function startGoogleStateMonitor() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
        return;
    }

    console.log("🔍 MONITOR: Starting Google Sign-In state monitor");

    // Check every 5 seconds for stuck states
    const monitorInterval = setInterval(() => {
        const hasStuckState = !!(
            window.__googleSignInPromiseActions ||
            window.__currentSignInPromiseActions ||
            document.querySelector('[data-testid*="google"] .animate-spin') // Loading indicators
        );

        if (hasStuckState) {
            console.warn("🚨 MONITOR: Detected stuck Google Sign-In state, auto-cleaning...");
            forceCleanupAllGoogleState();
        }
    }, 5000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(monitorInterval);
        forceCleanupAllGoogleState();
    });

    return monitorInterval;
}

/**
 * Turbopack-specific cleanup for hot module replacement
 */
export function turbopackCleanup() {
    if (typeof window === 'undefined') return;

    console.log("🔥 TURBOPACK CLEANUP: Handling hot module replacement");

    // Clear all module-level state
    forceCleanupAllGoogleState();

    // Reset any module caches
    if (window.require && window.require.cache) {
        Object.keys(window.require.cache).forEach(key => {
            if (key.includes('google') || key.includes('auth')) {
                delete window.require.cache[key];
            }
        });
    }

    console.log("🔥 TURBOPACK CLEANUP: Hot module replacement cleanup completed");
}

// Auto-start monitor in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    startGoogleStateMonitor();
} 