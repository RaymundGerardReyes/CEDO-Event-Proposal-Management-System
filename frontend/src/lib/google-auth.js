// Google OAuth Integration

// Google OAuth client ID - replace with your actual client ID in production
const GOOGLE_CLIENT_ID = "63555762451ercontent.com"

/**
 * Initialize Google OAuth API
 */
export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    // Load the Google API client script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      try {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    script.onerror = (error) => reject(error)
    document.head.appendChild(script)
  })
}

/**
 * Handle the credential response from Google
 * @param {Object} response - The credential response
 */
function handleCredentialResponse(response) {
  // This function will be called when the user completes the Google sign-in flow
  // The response contains a JWT ID token that can be verified on your backend
  if (window.googleAuthCallback) {
    window.googleAuthCallback(response)
  }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User information
 */
export function signInWithGoogle() {
  return new Promise(async (resolve, reject) => {
    try {
      // Initialize Google Auth if not already initialized
      await initGoogleAuth()

      // Set up callback to handle the response
      window.googleAuthCallback = (response) => {
        if (response && response.credential) {
          // Decode the JWT to get basic user info
          // In a real app, you would send this token to your backend for verification
          const payload = decodeJwtResponse(response.credential)
          resolve({
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
          })
        } else {
          reject(new Error("Google authentication failed"))
        }
      }

      // Prompt the user to select an account
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If the prompt is not displayed or skipped, fall back to redirect method
          redirectToGoogleAuth()
        }
      })
    } catch (error) {
      console.error("Google sign in error:", error)
      reject(error)
    }
  })
}

/**
 * Redirect to Google OAuth page
 */
function redirectToGoogleAuth() {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`
  const scope = "email profile"

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.append("client_id", GOOGLE_CLIENT_ID)
  url.searchParams.append("redirect_uri", redirectUri)
  url.searchParams.append("response_type", "code")
  url.searchParams.append("scope", scope)
  url.searchParams.append("access_type", "offline")
  url.searchParams.append("prompt", "consent")

  window.location.href = url.toString()
}

/**
 * Decode the JWT token from Google
 * @param {string} token - The JWT token
 * @returns {Object} The decoded payload
 */
function decodeJwtResponse(token) {
  const base64Url = token.split(".")[1]
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  )
  return JSON.parse(jsonPayload)
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - The authorization code
 * @returns {Promise<Object>} The tokens
 */
export async function getGoogleTokens(code) {
  // In a real implementation, this would be done on the server side
  // to keep your client secret secure
  const response = await fetch("/api/auth/google/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens")
  }

  return response.json()
}
