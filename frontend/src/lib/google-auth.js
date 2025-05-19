// frontend/src/lib/google-auth.js
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
let googleScriptLoaded = false;
let gsiClientInitialized = false;

// Global callback promise handlers, to be set by signInWithGoogleGIS
let globalResolve = null;
let globalReject = null;

function handleCredentialResponse(response) {
  if (response.error) {
    console.warn("Google Auth Credential Error:", response.error);
    if (globalReject) {
      globalReject(new Error(response.error.message || "Google Sign-In failed or was cancelled."));
    }
    return;
  }
  if (response.credential && globalResolve) {
    globalResolve({ token: response.credential });
  } else if (globalReject) {
    globalReject(new Error("Google authentication failed: No credential in response."));
  }
  // Clean up global handlers
  globalResolve = null;
  globalReject = null;
}

export function loadGoogleGIS() {
  return new Promise((resolve, reject) => {
    if (googleScriptLoaded) {
      return resolve();
    }
    if (!document.getElementById('google-gsi-client-script')) {
      const script = document.createElement("script");
      script.id = 'google-gsi-client-script';
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleScriptLoaded = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error("Failed to load Google GSI script:", error);
        reject(new Error("Failed to load Google GSI script."));
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists, assume it's loading or loaded.
      // If it's already loaded, googleScriptLoaded should be true.
      // If it's still loading, the original promise from its creation will handle it.
      // This simple check might need a more robust solution for concurrent calls
      // if the script is still in the process of loading from a previous call.
      // For now, assuming it loads quickly or this function is called sequentially.
      resolve();
    }
  });
}

export function initializeGoogleGIS() {
  if (!window.google || !window.google.accounts || !GOOGLE_CLIENT_ID) {
    console.error("Google GSI client not available or GOOGLE_CLIENT_ID missing.");
    return Promise.reject(new Error("Google Sign-In cannot be initialized."));
  }
  if (gsiClientInitialized) {
    return Promise.resolve();
  }
  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse, // Global callback handler
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    gsiClientInitialized = true;
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing Google GSI client:", error);
    gsiClientInitialized = false; // Reset on error
    return Promise.reject(error);
  }
}

export function signInWithGoogleGIS() {
  return new Promise(async (resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      return reject(new Error("Google Client ID is not configured."));
    }
    try {
      await loadGoogleGIS();
      await initializeGoogleGIS(); // Ensure it's initialized

      // Set up promise handlers for the global callback
      globalResolve = resolve;
      globalReject = reject;

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn("Google Sign-In prompt not displayed:", reason);
          // If prompt fails, reject the promise. UI can then decide to show a button.
          // For a button flow, you'd use `renderButton` and its callback.
          // The redirect flow is a more drastic fallback.
          if (globalReject) globalReject(new Error(`Google prompt not displayed: ${reason}. Try clicking the Google Sign-In button.`));
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.warn("Google Sign-In prompt skipped:", reason);
          if (globalReject) globalReject(new Error(`Google prompt skipped: ${reason}.`));
        } else if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason();
          if (globalReject) globalReject(new Error(`Google prompt dismissed: ${reason}.`));
        }
        // If prompt is displayed, the global `handleCredentialResponse` will be triggered by Google's SDK
        // which will then call either globalResolve or globalReject.
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (globalReject) globalReject(error); else reject(error);
    }
  });
}

// The redirect flow is more complex for SPA integration and token handling.
// The getGoogleTokens and decodeJwtResponse are kept if you intend to pursue that,
// but the primary flow enhanced here is the ID token retrieval via GIS prompt/button.

function redirectToGoogleAuth() {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`; // Backend must handle this
  const scope = "email profile openid";

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scope);
  url.searchParams.append("access_type", "offline"); // For refresh token, if backend is configured
  url.searchParams.append("prompt", "consent select_account");

  window.location.href = url.toString();
}

export async function getGoogleTokensFromServer(code) {
  // This function calls YOUR backend, which then securely exchanges the code with Google.
  const response = await fetch("/api/auth/google/exchange-code", { // Example backend endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to exchange code for tokens" }));
    throw new Error(errorData.message || "Token exchange failed");
  }
  return response.json(); // Expects backend to return session token and user data
}

// Client-side JWT decoding is for inspection only, NOT for verification.
export function decodeJwtResponse(token) {
  try {
    const base64Url = token.split(".")[1];
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