/**
 * Google Sign-In Debug Utility
 * Provides debugging tools and manual cleanup for Google Sign-In issues
 */

export const GoogleSignInDebug = {
    // Check if Google Sign-In is stuck
    checkGoogleSignInState() {
        if (typeof window === 'undefined') {
            console.log('GoogleSignInDebug: Not in browser environment');
            return null;
        }

        const state = {
            googleScriptLoaded: !!(window.google && window.google.accounts && window.google.accounts.id),
            gsiInitialized: false,
            domElements: {
                googleContainers: document.querySelectorAll('[data-google-signin-container="true"]').length,
                gsiElements: document.querySelectorAll('[id*="credential_picker"], [id*="g_id_"], .g_id_signin').length,
                googleButtons: document.querySelectorAll('[data-google-signin-container="true"] > div').length
            },
            timestamp: new Date().toISOString()
        };

        console.log('GoogleSignInDebug: Current state:', state);
        return state;
    },

    // Manually cleanup Google Sign-In elements
    manualCleanup() {
        if (typeof window === 'undefined') {
            console.log('GoogleSignInDebug: Not in browser environment');
            return;
        }

        console.log('GoogleSignInDebug: Starting manual cleanup...');

        // Clean up Google Sign-In containers
        const googleContainers = document.querySelectorAll('[data-google-signin-container="true"]');
        console.log(`GoogleSignInDebug: Found ${googleContainers.length} Google containers`);

        googleContainers.forEach((container, index) => {
            try {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                    console.log(`GoogleSignInDebug: Removed container ${index + 1}`);
                }
            } catch (error) {
                console.warn(`GoogleSignInDebug: Error removing container ${index + 1}:`, error.message);
            }
        });

        // Clean up Google Identity Services elements
        const gsiElements = document.querySelectorAll('[id*="credential_picker"], [id*="g_id_"], .g_id_signin, [id*="google-signin"]');
        console.log(`GoogleSignInDebug: Found ${gsiElements.length} GSI elements`);

        gsiElements.forEach((element, index) => {
            try {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                    console.log(`GoogleSignInDebug: Removed GSI element ${index + 1}`);
                }
            } catch (error) {
                console.warn(`GoogleSignInDebug: Error removing GSI element ${index + 1}:`, error.message);
            }
        });

        // Try to cancel any active Google Sign-In
        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                window.google.accounts.id.cancel();
                console.log('GoogleSignInDebug: Called google.accounts.id.cancel()');
            } catch (error) {
                console.warn('GoogleSignInDebug: Error calling google.accounts.id.cancel():', error.message);
            }
        }

        console.log('GoogleSignInDebug: Manual cleanup completed');
    },

    // Development mode helper
    developmentModeInfo() {
        const isDevelopment = process.env.NODE_ENV === 'development' ||
            process.env.DISABLE_GOOGLE_SIGNIN_IN_DEV === 'true';

        console.log('GoogleSignInDebug: Development mode info:', {
            isDevelopment,
            nodeEnv: process.env.NODE_ENV,
            disableGoogleSignIn: process.env.DISABLE_GOOGLE_SIGNIN_IN_DEV,
            recommendation: isDevelopment ?
                'Google Sign-In should be disabled in development. Use email/password authentication.' :
                'Google Sign-In should be enabled in production.'
        });

        return isDevelopment;
    },

    // Monitor for stuck promises (development only)
    monitorStuckPromises() {
        if (process.env.NODE_ENV !== 'development') {
            console.log('GoogleSignInDebug: Promise monitoring only available in development');
            return;
        }

        console.log('GoogleSignInDebug: Starting promise monitoring...');

        // Check every 30 seconds for stuck promises
        const monitorInterval = setInterval(() => {
            // This would need access to the auth context to check currentGoogleSignInPromiseActions
            // For now, just log that monitoring is active
            console.log('GoogleSignInDebug: Monitoring for stuck promises...');
        }, 30000);

        // Return cleanup function
        return () => {
            clearInterval(monitorInterval);
            console.log('GoogleSignInDebug: Stopped promise monitoring');
        };
    }
};

// Make it available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.GoogleSignInDebug = GoogleSignInDebug;
    console.log('GoogleSignInDebug: Debug utility available as window.GoogleSignInDebug');
} 