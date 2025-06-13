/**
 * Google Authentication Library - Simplified for COOP Compatibility
 * 
 * A simplified wrapper for Google Identity Services that works with
 * relaxed Cross-Origin-Opener-Policy settings for popup communication.
 * 
 * Features:
 * - Google Identity Services SDK integration
 * - Custom button rendering with theme options
 * - Simplified promise handling
 * - COOP-compatible popup communication
 * - Development mode optimizations
 * 
 * @see https://developers.google.com/identity/gsi/web
 * @see https://medium.com/@aswathyraj/google-oauth-in-node-js-express-and-react-js-6cb2e23e82e5
 * 
 * @module lib/google-auth
 */

// src/lib/google-auth.js

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

let googleScriptPromise = null;
let isGSIInitialized = false;

/**
 * Simple credential response handler
 * This function is registered globally and handles Google's authentication response
 */
function handleCredentialResponse(response) {
  console.log('🔧 Google credential response received:', response);

  // Dispatch global event for React components to listen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('google-signin-response', {
      detail: response
    }));
  }

  // Handle active promise if exists
  const actions = window.__currentGoogleSignInActions;
  if (actions) {
    window.__currentGoogleSignInActions = null;

    if (response.error) {
      actions.reject(new Error(response.error_description || response.error));
    } else if (response.credential) {
      actions.resolve({ token: response.credential });
    } else {
      actions.reject(new Error('No credential received from Google'));
    }
  }
}

/**
 * Load Google Identity Services script
 */
export function loadGoogleScript() {
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('Not in browser environment'));
      }

      // Register global callback
      window.handleCredentialResponse = handleCredentialResponse;

      // Check if already loaded
      if (window.google?.accounts?.id) {
        return resolve();
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Wait for Google API to be available
        const checkGoogle = () => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };

      script.onerror = () => {
        googleScriptPromise = null;
        reject(new Error('Failed to load Google script'));
      };

      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

/**
 * Initialize Google Identity Services
 */
export function initializeGoogleGSI() {
  return loadGoogleScript().then(() => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    if (!isGSIInitialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        // ✅ COOP-compatible settings
        use_fedcm_for_prompt: false, // Disable FedCM for better COOP compatibility
        itp_support: true,
      });
      isGSIInitialized = true;
    }

    return Promise.resolve();
  });
}

/**
 * Render Google Sign-In button
 * 
 * @param {HTMLElement|string} elementOrId - Container element or ID
 * @param {Object} options - Button customization options
 * @returns {Promise} Promise that resolves with user token
 */
export function renderGoogleSignInButton(elementOrId, options = {}) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser environment'));
  }

  // Enhanced check for existing operation with automatic cleanup
  if (window.__currentGoogleSignInActions) {
    console.warn('⚠️ Google Sign-In operation detected, attempting cleanup...');

    // Force cleanup and retry
    cleanupGoogleAuth();

    // Wait a moment for cleanup to complete
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check again after cleanup
        if (window.__currentGoogleSignInActions) {
          reject(new Error('Google Sign-In already in progress - please wait and try again'));
        } else {
          // Retry the operation
          renderGoogleSignInButton(elementOrId, options).then(resolve).catch(reject);
        }
      }, 100);
    });
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Set up promise actions
      window.__currentGoogleSignInActions = { resolve, reject };

      // Initialize GSI
      await initializeGoogleGSI();

      // Get container element
      const container = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

      if (!container) {
        throw new Error(`Container element '${elementOrId}' not found`);
      }

      // Clear container
      container.innerHTML = '';

      // Default button options
      const defaultOptions = {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        width: '280',
      };

      const buttonOptions = { ...defaultOptions, ...options };

      // Render button
      window.google.accounts.id.renderButton(container, buttonOptions);

    } catch (error) {
      window.__currentGoogleSignInActions = null;
      reject(error);
    }
  });
}

/**
 * One Tap prompt for Google Sign-In
 */
export function promptGoogleOneTap() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser environment'));
  }

  return new Promise(async (resolve, reject) => {
    try {
      await initializeGoogleGSI();

      window.__currentGoogleSignInActions = { resolve, reject };

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          window.__currentGoogleSignInActions = null;
          reject(new Error(`Google prompt not displayed: ${notification.getNotDisplayedReason()}`));
        } else if (notification.isSkippedMoment()) {
          window.__currentGoogleSignInActions = null;
          reject(new Error(`Google prompt skipped: ${notification.getSkippedReason()}`));
        } else if (notification.isDismissedMoment()) {
          window.__currentGoogleSignInActions = null;
          reject(new Error(`Google prompt dismissed: ${notification.getDismissedReason()}`));
        }
      });

    } catch (error) {
      window.__currentGoogleSignInActions = null;
      reject(error);
    }
  });
}

/**
 * Cleanup Google Sign-In state
 * Enhanced cleanup to prevent "Google Sign-In already in progress" errors
 */
export function cleanupGoogleAuth() {
  if (typeof window !== 'undefined') {
    console.log('🧹 Cleaning up Google Auth state...');

    // Clear current sign-in actions
    window.__currentGoogleSignInActions = null;

    if (window.google?.accounts?.id) {
      try {
        // Cancel any ongoing Google Sign-In operations
        window.google.accounts.id.cancel();

        // Disable auto-select to prevent automatic re-signin
        window.google.accounts.id.disableAutoSelect();

        console.log('✅ Google Sign-In operations cancelled and auto-select disabled');
      } catch (e) {
        console.warn('⚠️ Error during Google Sign-In cleanup:', e);
      }
    }

    // Clear any Google Auth related iframes or prompts
    try {
      const googleIframes = document.querySelectorAll('iframe[src*="accounts.google.com"]');
      googleIframes.forEach(iframe => {
        try {
          iframe.remove();
        } catch (e) {
          console.warn('Warning: Could not remove Google iframe:', e);
        }
      });

      const googleDivs = document.querySelectorAll('div[data-client-id]');
      googleDivs.forEach(div => {
        try {
          if (div.innerHTML.includes('Sign in with Google')) {
            div.innerHTML = '';
          }
        } catch (e) {
          console.warn('Warning: Could not clear Google div:', e);
        }
      });
    } catch (e) {
      console.warn('Warning: Error cleaning Google DOM elements:', e);
    }

    console.log('🔄 Google Auth cleanup completed');
  }
}

/**
 * Reset Google Auth state for testing
 */
export function __resetGoogleAuthStateForTests() {
  if (typeof window !== 'undefined') {
    window.__currentGoogleSignInActions = null;
    window.handleCredentialResponse = handleCredentialResponse;
    window.google = undefined;
  }
  googleScriptPromise = null;
  isGSIInitialized = false;
}