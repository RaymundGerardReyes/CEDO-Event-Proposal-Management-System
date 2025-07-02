// frontend/src/lib/google-auth.js

import { config } from "@/lib/utils";

const GOOGLE_CLIENT_ID = config.googleClientId;

let googleScriptLoadPromise = null;
let gsiClientInitPromise = null;

// Stores the resolve/reject functions for the current sign-in attempt's promise
let currentSignInPromiseActions = null;

/**
 * Handles the credential response from Google Identity Services.
 * This function is set as the global callback during GIS initialization.
 * It resolves or rejects the promise associated with the current sign-in attempt.
 * @param {object} response - The credential response object from Google.
 */
function handleCredentialResponse(response) {
  if (!currentSignInPromiseActions) {
    console.warn("Google Auth: Received credential response but no active sign-in promise was expecting it.", response);
    return;
  }

  const { resolve, reject } = currentSignInPromiseActions;
  currentSignInPromiseActions = null; // Consume the promise actions, critical for state management

  if (response.error) {
    console.warn("Google Auth Credential Error:", response.error, response.error_description || response.error_subtype);
    const errorMessage = response.error_description || response.error_subtype || response.error || "Google Sign-In failed or was cancelled by the user.";
    reject(new Error(errorMessage));
  } else if (response.credential) {
    resolve({ token: response.credential });
  } else {
    // This case should ideally not be reached if response.error is properly provided by Google for all error scenarios
    reject(new Error("Google authentication failed: No credential in response and no error object."));
  }
}

/**
 * Loads the Google Identity Services (GIS) client script.
 * This function is idempotent: it ensures the script is loaded only once.
 * @returns {Promise<void>} A promise that resolves when the script is loaded, or rejects on error.
 */
export function loadGoogleGIS() {
  if (!googleScriptLoadPromise) {
    googleScriptLoadPromise = new Promise((resolve, reject) => {
      // Check if GIS client script is already effectively loaded and window.google.accounts.id is available
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // console.log("Google GSI script already loaded.");
        return resolve();
      }

      const scriptId = 'google-gsi-client-script';
      let scriptElement = document.getElementById(scriptId);

      if (scriptElement) {
        // If script tag exists, it might be loading or failed.
        // This simple check doesn't guarantee it's fully loaded and ready.
        // Relying on window.google.accounts.id above is safer.
        // For robustness, if the script element exists but window.google.accounts.id is not yet there,
        // it means it's either still loading or failed.
        // The `onload` and `onerror` handlers are crucial.
        // If another instance of this function is called while script is loading,
        // they should all await the same `googleScriptLoadPromise`.
      }

      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = scriptId;
        scriptElement.src = "https://accounts.google.com/gsi/client";
        scriptElement.async = true;
        scriptElement.defer = true;
        document.head.appendChild(scriptElement);
      }

      scriptElement.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          resolve();
        } else {
          console.error("Google GSI script loaded but window.google.accounts.id not found.");
          googleScriptLoadPromise = null; // Allow retry on next call
          reject(new Error("Google GSI script loaded but not correctly initialized by Google."));
        }
      };

      scriptElement.onerror = (error) => {
        console.error("Failed to load Google GSI script:", error);
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement); // Clean up failed script tag
        }
        googleScriptLoadPromise = null; // Allow retry on next call
        reject(new Error("Failed to load Google GSI script."));
      };
    });
  }
  return googleScriptLoadPromise;
}

/**
 * Initializes the Google Identity Services client with the configured Client ID and callback.
 * This function is idempotent.
 * @returns {Promise<void>} A promise that resolves when GIS is initialized, or rejects on error.
 */
export function initializeGoogleGIS() {
  if (!gsiClientInitPromise) {
    gsiClientInitPromise = loadGoogleGIS().then(() => {
      if (!GOOGLE_CLIENT_ID) {
        console.error("Google Client ID is not configured for GSI initialization.");
        throw new Error("Google Client ID is not configured."); // This will reject gsiClientInitPromise
      }
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        // Should be caught by loadGoogleGIS, but as a safeguard:
        console.error("Google GSI client not available for initialization (window.google.accounts.id is missing).");
        throw new Error("Google Sign-In script not loaded or available before initialization.");
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse, // Global callback handler for all GIS credential responses
          auto_select: false, // Set to true if you want One Tap to attempt auto sign-in on init
          cancel_on_tap_outside: true, // For the One Tap prompt
        });
        return Promise.resolve(); // Google's initialize is synchronous
      } catch (error) {
        console.error("Error initializing Google GSI client:", error);
        gsiClientInitPromise = null; // Allow retry on next call
        throw error; // Rethrow to reject the promise
      }
    }).catch(error => {
      gsiClientInitPromise = null; // Ensure reset on any failure in the chain
      throw error; // Propagate error to the caller
    });
  }
  return gsiClientInitPromise;
}

/**
 * Attempts to sign in the user using Google's One Tap prompt.
 * @returns {Promise<{token: string}>} A promise that resolves with the ID token, or rejects on error/cancellation.
 */
export function signInWithGooglePrompt() {
  if (currentSignInPromiseActions) {
    console.warn("Google Auth: signInWithGooglePrompt called while another sign-in operation is already in progress.");
    return Promise.reject(new Error("Another Google Sign-In operation is already in progress."));
  }

  return new Promise(async (resolve, reject) => {
    currentSignInPromiseActions = { resolve, reject };

    if (!GOOGLE_CLIENT_ID) {
      // This check is also in initializeGoogleGIS, but good for early exit.
      currentSignInPromiseActions.reject(new Error("Google Client ID is not configured."));
      currentSignInPromiseActions = null;
      return;
    }

    try {
      await initializeGoogleGIS(); // Ensures GIS is loaded and initialized.

      window.google.accounts.id.prompt((notification) => {
        // This notification callback is for the prompt's lifecycle, distinct from the credential callback.
        if (!currentSignInPromiseActions && !notification.isDismissedMoment() && !notification.isSkippedMoment() && !notification.isNotDisplayed()) {
          // If there's no active promise but a positive notification, it's an unexpected state.
          // This might happen if the prompt displays and then currentSignInPromiseActions is cleared externally before resolution.
          // console.warn("Google Auth: Prompt notification received but no active promise handler.", notification);
          // For most cases, if a credential is returned, handleCredentialResponse will be called.
          // This block primarily handles cases where the prompt *doesn't* lead to a credential immediately.
        }

        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn("Google Sign-In prompt not displayed:", reason);
          if (currentSignInPromiseActions) {
            currentSignInPromiseActions.reject(new Error(`Google prompt not displayed: ${reason}. Consider showing a sign-in button.`));
            currentSignInPromiseActions = null;
          }
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.warn("Google Sign-In prompt skipped:", reason);
          if (currentSignInPromiseActions) {
            currentSignInPromiseActions.reject(new Error(`Google prompt skipped: ${reason}.`));
            currentSignInPromiseActions = null;
          }
        } else if (notification.isDismissedMoment()) {
          // This means the user closed the prompt (e.g., clicked 'X' or ESC).
          const reason = notification.getDismissedReason();
          console.warn("Google Sign-In prompt dismissed by user:", reason);
          if (currentSignInPromiseActions) {
            currentSignInPromiseActions.reject(new Error(`Google prompt dismissed by user: ${reason}.`));
            currentSignInPromiseActions = null;
          }
        }
        // If the prompt displays and the user selects an account, 
        // `handleCredentialResponse` will be invoked by Google's library,
        // which will then resolve/reject `currentSignInPromiseActions`.
      });
    } catch (error) {
      console.error("Google sign-in via prompt error:", error);
      if (currentSignInPromiseActions) {
        currentSignInPromiseActions.reject(error);
        currentSignInPromiseActions = null;
      } else {
        // If currentSignInPromiseActions is null here, an error occurred after it was already cleared
        // or before it was properly set. The initial reject passed to new Promise should handle it.
        // This specific path might not be hit if logic above is sound.
      }
    }
  });
}

/**
 * Renders a Google Sign-In button in the specified HTML element and returns a promise for the sign-in result.
 * @param {string|HTMLElement} elementOrId - The HTML element or its ID where the button should be rendered.
 * @param {object} [buttonOptions] - Customization options for the button (e.g., theme, size, text).
 * See Google's documentation for `IdConfiguration.text` for text options.
 * Example: { text: "Sign in with Google" } or { text: "continue_with" }
 * @returns {Promise<{token: string}>} A promise that resolves with the ID token upon successful sign-in, or rejects on error/cancellation.
 */
export function renderGoogleSignInButton(elementOrId, buttonOptions = {}) {
  if (currentSignInPromiseActions) {
    console.warn("Google Auth: renderGoogleSignInButton called while another sign-in operation is already in progress.");
    return Promise.reject(new Error("Another Google Sign-In operation is already in progress."));
  }

  return new Promise(async (resolve, reject) => {
    currentSignInPromiseActions = { resolve, reject };

    if (!GOOGLE_CLIENT_ID) {
      currentSignInPromiseActions.reject(new Error("Google Client ID is not configured."));
      currentSignInPromiseActions = null;
      return;
    }

    try {
      await initializeGoogleGIS(); // Ensure GIS is loaded and initialized.

      const buttonDiv = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

      if (!buttonDiv) {
        currentSignInPromiseActions.reject(new Error(`HTML element '${elementOrId}' not found for Google Sign-In button.`));
        currentSignInPromiseActions = null;
        return;
      }
      // Note: Avoiding innerHTML = '' to prevent React DOM conflicts
      // Google will handle button replacement automatically

      const defaultRenderOptions = {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with", // Default text, Google handles localization. Override with buttonOptions.text.
      };

      const mergedOptions = { ...defaultRenderOptions, ...buttonOptions };

      window.google.accounts.id.renderButton(buttonDiv, mergedOptions);
      // The promise (currentSignInPromiseActions) will be resolved or rejected by `handleCredentialResponse` 
      // when the user interacts with the rendered button and completes or cancels the Google Sign-In flow.
      // No explicit resolve/reject here from renderButton itself, it's all async via the global callback.

    } catch (error) {
      console.error("Error rendering Google Sign-In button:", error);
      if (currentSignInPromiseActions) {
        currentSignInPromiseActions.reject(error);
        currentSignInPromiseActions = null;
      }
    }
  });
}

/**
 * Decodes a JWT token (client-side). 
 * WARNING: This is for inspection (e.g., debugging, getting user info like name/email from ID token)
 * and NOT for security validation. Secure validation of ID tokens must be done on your backend server.
 * @param {string} token - The JWT token string.
 * @returns {object|null} The decoded payload of the JWT, or null if decoding fails.
 */
export function decodeJwtResponse(token) {
  if (!token || typeof token !== 'string') {
    console.error("Invalid token provided for decoding.");
    return null;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT: The token must have 3 parts.");
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

// Note: The redirect-based OAuth flow functions (redirectToGoogleAuth, getGoogleTokensFromServer)
// from your original code are a separate authentication mechanism. They can be included here
// if you need both GIS (for pop-up/One Tap) and a traditional redirect OAuth flow.
// For this exercise, the focus has been on enhancing the GIS prompt and button flows.