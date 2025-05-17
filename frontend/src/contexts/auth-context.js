"use client"

import axios from "axios"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

<<<<<<< HEAD
// Define API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api"
=======
// ... (API_URL, internalApi, ROLES - keep as previously defined) ...
const AuthContext = createContext(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
console.info("AuthContext: API requests will be sent to:", API_URL)

// Create Axios instance for internal API calls
const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Define user roles
export const ROLES = {
<<<<<<< HEAD
  head_admin: 'Head Admin',
  student: 'Student',
  manager: 'Manager',
};

// Create AuthContext
const AuthContext = createContext(undefined)
=======
  HEAD_ADMIN: "Head Admin",
  STUDENT: "Student",
  MANAGER: "Manager",
  PARTNER: "Partner",
  REVIEWER: "Reviewer",
}
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)

export function AuthProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchParams, setSearchParams] = useState(new URLSearchParams())
<<<<<<< HEAD

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search))

      const handleRouteChange = () => {
        setSearchParams(new URLSearchParams(window.location.search))
      }

      window.addEventListener("popstate", handleRouteChange)

      return () => {
        window.removeEventListener("popstate", handleRouteChange)
      }
    }
  }, [pathname])

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const redirect = searchParams.get("redirect") || "/"

  const performRedirect = useCallback(
    (loggedInUser) => {
      if (!loggedInUser || !loggedInUser.role) {
        console.warn("AuthProvider performRedirect: No user or role for redirection. Defaulting to /sign-in.")
        router.replace("/sign-in")
        return
      }

      const redirectQueryParam = searchParams.get("redirect")
      let targetPath

      if (redirectQueryParam && redirectQueryParam !== pathname) {
        targetPath = redirectQueryParam
        console.log(`AuthProvider performRedirect: Using redirect query param: ${targetPath}`)
      } else {
        if (loggedInUser.dashboard) {
          targetPath = loggedInUser.dashboard
        } else {
          switch (loggedInUser.role) {
            case ROLES.HEAD_ADMIN:
            case ROLES.MANAGER:
              targetPath = "/admin-dashboard"
              break
            case ROLES.STUDENT:
            case ROLES.PARTNER:
              targetPath = "/student-dashboard"
              break
            case ROLES.REVIEWER:
              targetPath = "/admin-dashboard/review"
              break
            default:
              console.warn(
                `AuthProvider performRedirect: Unknown role "${loggedInUser.role}", redirecting to generic /.`,
              )
              targetPath = "/"
              break
          }
        }
      }
      console.log(`AuthProvider performRedirect: Redirecting to ${targetPath}`)
      if (pathname !== targetPath) {
        router.replace(targetPath)
      }
    },
    [router, searchParams, pathname],
  )

  useEffect(() => {
    const verifyCurrentUser = async () => {
=======

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search))

      const handleRouteChange = () => {
        setSearchParams(new URLSearchParams(window.location.search))
      }

      window.addEventListener("popstate", handleRouteChange)

      return () => {
        window.removeEventListener("popstate", handleRouteChange)
      }
    }
  }, [pathname])

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const redirect = searchParams.get("redirect") || "/"

  const performRedirect = useCallback(
    (loggedInUser) => {
      if (!loggedInUser || !loggedInUser.role) {
        console.warn("AuthProvider performRedirect: No user or role for redirection. Defaulting to /sign-in.")
        router.replace("/sign-in")
        return
      }

      const redirectQueryParam = searchParams.get("redirect")
      let targetPath

      if (redirectQueryParam && redirectQueryParam !== pathname) {
        targetPath = redirectQueryParam
        console.log(`AuthProvider performRedirect: Using redirect query param: ${targetPath}`)
      } else {
        if (loggedInUser.dashboard) {
          targetPath = loggedInUser.dashboard
        } else {
          switch (loggedInUser.role) {
            case ROLES.HEAD_ADMIN:
            case ROLES.MANAGER:
              targetPath = "/admin-dashboard"
              break
            case ROLES.STUDENT:
            case ROLES.PARTNER:
              targetPath = "/student-dashboard"
              break
            case ROLES.REVIEWER:
              targetPath = "/admin-dashboard/review"
              break
            default:
              console.warn(
                `AuthProvider performRedirect: Unknown role "${loggedInUser.role}", redirecting to generic /.`,
              )
              targetPath = "/"
              break
          }
        }
      }
      console.log(`AuthProvider performRedirect: Redirecting to ${targetPath}`)
      if (pathname !== targetPath) {
        router.replace(targetPath)
      }
    },
    [router, searchParams, pathname],
  )

  useEffect(() => {
    const initializeAuth = async () => {
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
      console.log("AuthProvider: Initializing auth...")
      setIsLoading(true)
      try {
        let token = null
        if (typeof document !== "undefined") {
          const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="))
          if (cookieValue) {
            token = cookieValue.split("=")[1]
          }
        }

        if (token) {
<<<<<<< HEAD
          console.log("AuthProvider: Token found in cookie.", token ? "Token found" : "No token")

          // Check token format and expiry
          try {
            // Basic validation - check if token has three parts separated by dots (header.payload.signature)
            const tokenParts = token.split(".")
            if (tokenParts.length !== 3) {
              console.warn("AuthProvider: Invalid token format (not a valid JWT). Clearing auth data.")
              throw new Error("Invalid token format")
=======
          console.log("AuthProvider: Token found in cookie.", token ? "Token valid format" : "Token invalid format")
          internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const storedUser = localStorage.getItem("cedo_user")

          if (storedUser) {
            const userDataFromStorage = JSON.parse(storedUser)
            setUser(userDataFromStorage)
            console.log("AuthProvider: User restored from localStorage.", userDataFromStorage)
          } else {
            console.warn("AuthProvider: Token found but no user in localStorage. Fetching from /auth/me.")
            try {
              const { data: meData } = await internalApi.get("/auth/me")
              if (meData && meData.user) {
                setUser(meData.user)
                localStorage.setItem("cedo_user", JSON.stringify(meData.user))
                console.log("AuthProvider: User fetched from /auth/me.", meData.user)
              } else {
                throw new Error("No user data from /auth/me or invalid response structure")
              }
            } catch (meError) {
              console.error("AuthProvider: Failed to fetch user from /auth/me:", meError.message)
              if (typeof document !== "undefined") {
                document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
              }
              localStorage.removeItem("cedo_user")
              delete internalApi.defaults.headers.common["Authorization"]
              setUser(null)
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
            }

            // Check if token is expired by decoding the payload (middle part)
            // Note: This is a client-side check and not as secure as server verification
            const payload = JSON.parse(atob(tokenParts[1]))
            const currentTime = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp < currentTime) {
              console.warn("AuthProvider: Token expired. Clearing auth data.")
              throw new Error("Token expired")
            }

            // Token passed basic client-side checks, proceed
            internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`
            const storedUser = localStorage.getItem("cedo_user")

            if (storedUser) {
              const userDataFromStorage = JSON.parse(storedUser)
              setUser(userDataFromStorage)
              console.log("AuthProvider: User restored from localStorage.", userDataFromStorage)
            } else {
              console.warn("AuthProvider: Token found but no user in localStorage. Fetching from /auth/me.")
              try {
                const { data: meData } = await internalApi.get("/auth/me")
                if (meData && meData.user) {
                  setUser(meData.user)
                  localStorage.setItem("cedo_user", JSON.stringify(meData.user))
                  console.log("AuthProvider: User fetched from /auth/me.", meData.user)
                } else {
                  throw new Error("No user data from /auth/me or invalid response structure")
                }
              } catch (meError) {
                console.error("AuthProvider: Failed to fetch user from /auth/me:", meError.message)
                if (typeof document !== "undefined") {
                  document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
                }
                localStorage.removeItem("cedo_user")
                delete internalApi.defaults.headers.common["Authorization"]
                setUser(null)
              }
            }
          } catch (tokenError) {
            console.error("AuthProvider: Token validation error:", tokenError.message)
            // Clear invalid token
            if (typeof document !== "undefined") {
              document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
            }
            localStorage.removeItem("cedo_user")
            delete internalApi.defaults.headers.common["Authorization"]
            setUser(null)
          }
        } else {
          console.log("AuthProvider: No token found in cookie.")
          setUser(null)
          delete internalApi.defaults.headers.common["Authorization"]
          localStorage.removeItem("cedo_user")
        }
      } catch (error) {
        console.error("AuthProvider: Error during initial auth processing:", error)
        setUser(null)
        delete internalApi.defaults.headers.common["Authorization"]
        if (typeof document !== "undefined") {
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
        }
        localStorage.removeItem("cedo_user")
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
        console.log("AuthProvider: Initialization complete.", { user, isLoading: false, isInitialized: true })
      }
    }
    if (!isInitialized) {
<<<<<<< HEAD
      verifyCurrentUser()
=======
      initializeAuth()
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
    }
  }, [isInitialized])

  useEffect(() => {
    console.log("AuthProvider mounted/updated at:", new Date().toISOString())

    return () => {
      console.log("AuthProvider unmounted at:", new Date().toISOString())
    }
  }, [])

  const commonSignInSuccess = useCallback(
    (token, userData, rememberMe = false) => {
      if (typeof document !== "undefined") {
        let cookieOptions = "path=/; SameSite=Lax; Secure"
        if (rememberMe) {
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 7)
          cookieOptions += `; expires=${expiryDate.toUTCString()}`
        }
        document.cookie = `cedo_token=${token}; ${cookieOptions}`
        console.log("AuthProvider: Cookie 'cedo_token' set.")
        localStorage.setItem("cedo_user", JSON.stringify(userData))
      }
      internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(userData)
      setIsLoading(false)
      setIsInitialized(true)
      console.log("AuthProvider: Sign-in successful. User state updated.", userData)
<<<<<<< HEAD

      // Resolve the Google Auth Promise if it's waiting
      if (window.googleAuthResolve) {
        window.googleAuthResolve(userData); // Resolve with user data
        delete window.googleAuthResolve;
        delete window.googleAuthReject; // Also clear reject if resolve is called
      }

      performRedirect(userData)
      return userData
    },
    [performRedirect],
  )

  const commonSignOutLogic = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      console.log("AuthProvider [signOut]: Signing out.")
      setIsLoading(true)
      try {
        // await internalApi.post("/auth/logout");
      } catch (error) {
        console.error("AuthProvider [signOut]: Error during backend logout:", error)
      } finally {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cedo_user")
          localStorage.removeItem("cedo_token")
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
          console.log("AuthProvider [signOut]: Token cookie and localStorage cleared.")
        }
        delete internalApi.defaults.headers.common["Authorization"]
        setUser(null)
        setIsLoading(false)
        if (redirect) {
          console.log(`AuthProvider [signOut]: Redirecting to ${redirectPath}.`)
          router.replace(redirectPath)
        }
      }
    },
    [router],
  )

  const signIn = useCallback(
    async (email, password, rememberMe = false, captchaToken = null) => {
      console.log("AuthProvider [signIn]: Attempting sign-in for", email)
      setIsLoading(true)
      try {
        const payload = { email, password }
        if (captchaToken) {
          payload.captchaToken = captchaToken
        }
        const response = await internalApi.post("/auth/login", payload)
        const { token, user: userData } = response.data
        if (token && userData) {
          return commonSignInSuccess(token, userData, rememberMe)
        } else {
          throw new Error("Login failed: No token or user data received.")
        }
      } catch (error) {
        console.error("AuthProvider [signIn]: Sign-in failed.", error)

        // Improved error handling
        let errorMessage = "An unexpected error occurred. Please try again."
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error("Backend response:", error.response.status, error.response.data)
            errorMessage =
              error.response.data?.message ||
              (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) ||
              `Server error (${error.response.status}).`
          } else {
            errorMessage = error.message // Fallback to the error message
          }
        }

        await commonSignOutLogic(false)
        setIsLoading(false)
        throw new Error(errorMessage) // Throw the improved error message
      }
    },
=======
      performRedirect(userData)
      return userData
    },
    [performRedirect],
  )

  const commonSignOutLogic = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      console.log("AuthProvider [signOut]: Signing out.")
      setIsLoading(true)
      try {
        // await internalApi.post("/auth/logout");
      } catch (error) {
        console.error("AuthProvider [signOut]: Error during backend logout:", error)
      } finally {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cedo_user")
          localStorage.removeItem("cedo_token")
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
          console.log("AuthProvider [signOut]: Token cookie and localStorage cleared.")
        }
        delete internalApi.defaults.headers.common["Authorization"]
        setUser(null)
        setIsLoading(false)
        if (redirect) {
          console.log(`AuthProvider [signOut]: Redirecting to ${redirectPath}.`)
          router.replace(redirectPath)
        }
      }
    },
    [router],
  )

  const signIn = useCallback(
    async (email, password, rememberMe = false) => {
      console.log("AuthProvider [signIn]: Attempting sign-in for", email)
      setIsLoading(true)
      try {
        const response = await internalApi.post("/auth/login", { email, password })
        const { token, user: userData } = response.data
        if (token && userData) {
          return commonSignInSuccess(token, userData, rememberMe)
        } else {
          throw new Error("Login failed: No token or user data received.")
        }
      } catch (error) {
        console.error(
          "AuthProvider [signIn]: Sign-in failed.",
          error.isAxiosError && error.response ? error.response.data : error.message,
        )
        await commonSignOutLogic(false)
        setIsLoading(false)
        if (axios.isAxiosError(error) && error.response) {
          const backendErrorMessage =
            error.response.data?.message ||
            (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) ||
            `Server error (${error.response.status}).`
          throw new Error(backendErrorMessage)
        } else if (axios.isAxiosError(error) && error.request) {
          throw new Error("Network Error: Unable to connect to the server.")
        }
        throw error
      }
    },
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
    [commonSignInSuccess, commonSignOutLogic],
  )

  const loadGoogleScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        console.log("AuthProvider [loadGoogleScript]: Google script already loaded.")
        resolve()
        return
      }
      if (typeof document === "undefined") {
        console.warn("AuthProvider [loadGoogleScript]: 'document' is undefined (SSR?).")
        resolve()
        return
      }
      const existingScript = document.getElementById("google-identity-services-script")
      if (existingScript) {
        console.log("AuthProvider [loadGoogleScript]: Google script tag already exists.")
        if (window.google?.accounts?.id) resolve()
        else {
          const handleLoad = () => {
            if (window.google?.accounts?.id) resolve()
            else reject(new Error("Google script loaded but API not available."))
            existingScript.removeEventListener("load", handleLoad)
            existingScript.removeEventListener("error", handleError)
          }
          const handleError = () => {
            reject(new Error("Failed to load existing Google Identity Services script."))
            existingScript.removeEventListener("load", handleLoad)
            existingScript.removeEventListener("error", handleError)
          }
          existingScript.addEventListener("load", handleLoad)
          existingScript.addEventListener("error", handleError)
        }
        return
      }
      console.log("AuthProvider [loadGoogleScript]: Loading Google script...")
      const script = document.createElement("script")
      script.id = "google-identity-services-script"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log("AuthProvider [loadGoogleScript]: Google script loaded successfully.")
        if (window.google?.accounts?.id) resolve()
        else reject(new Error("Google script loaded but google.accounts.id not available."))
      }
      script.onerror = () => reject(new Error("Failed to load Google Identity Services script."))
      document.head.appendChild(script)
    })
  }, [])

  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      console.log("AuthProvider [handleGoogleCredentialResponse]: Received response from Google SDK")
      if (!response?.credential) {
        console.error("AuthProvider [handleGoogleCredentialResponse]: No credential in response")
        if (window.googleAuthReject) {
          window.googleAuthReject(new Error("No credential received from Google"))
        }
        return
      }

      try {
<<<<<<< HEAD
=======
        // Send the ID token to your backend
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
        const backendResponse = await internalApi.post("/auth/google", {
          token: response.credential,
        })

        const { token, user: userData } = backendResponse.data

<<<<<<< HEAD
        if (token && userData) {
          return commonSignInSuccess(token, userData, false)
        } else {
          throw new Error("Google Sign-In failed: No token or user data received from backend.")
        }
      } catch (error) {
        let errorMessage = "An unexpected error occurred during Google Sign-In.";
        // let isHandledKnown403 = false; // Flag is implicitly handled by a single path for errorMessage now

        if (axios.isAxiosError(error) && error.response) {
          // Check for the specific "account not approved" 403 from /auth/google
          if (error.response.status === 403 && error.config?.url?.includes('/auth/google')) {
            const backendMessage = error.response.data?.message || 'Account not approved or access denied by backend.';
            console.warn(`AuthProvider [handleGoogleCredentialResponse]: Google Sign-In attempt for a user resulted in 403 (handled). Backend message: "${backendMessage}"`);
            errorMessage = backendMessage; // Use the backend message directly
          } else {
            // For other Axios errors with a response, log details as an error
            console.error(`AuthProvider [handleGoogleCredentialResponse]: Backend responded with ${error.response.status} for URL ${error.config?.url}`, error.response.data, error);
            errorMessage =
              error.response.data?.message ||
              (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) ||
              `Server error (${error.response.status}). Reason: ${error.response.data?.reason || 'N/A'}`;
          }
        } else if (axios.isAxiosError(error) && error.request) {
          // Network error, no response received
          console.error("AuthProvider [handleGoogleCredentialResponse]: Network error or no response from server for /auth/google.", error);
          errorMessage = "No response from server. Please check your network connection.";
        } else {
          // Non-Axios error or Axios error without response/request (e.g., setup issue)
          console.error("AuthProvider [handleGoogleCredentialResponse]: Non-Axios error or setup issue during Google Sign-In.", error);
          errorMessage = error.message || errorMessage;
        }

        if (window.googleAuthReject) {
          window.googleAuthReject(new Error(errorMessage));
        }
      }
    },
    [commonSignInSuccess],
=======
        if (window.googleAuthResolve) {
          window.googleAuthResolve({ credential: response.credential, ...backendResponse.data })
        }
      } catch (error) {
        console.error("AuthProvider [handleGoogleCredentialResponse]: Backend verification failed", error)
        if (window.googleAuthReject) {
          window.googleAuthReject(error)
        }
      }
    },
    [internalApi],
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
  )

  const signInWithGoogleAuth = useCallback(async () => {
    console.log("AuthProvider [signInWithGoogleAuth]: Initiating Google sign-in.")
    setIsLoading(true)
    try {
      await loadGoogleScript()
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        throw new Error("Google Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID) is not configured.")
      }

      console.log(
        "AuthProvider [signInWithGoogleAuth]: Using client ID:",
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          ? `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 8)}...`
          : "undefined",
      )

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      const googleAuthPromise = new Promise((resolve, reject) => {
        window.googleAuthResolve = resolve
        window.googleAuthReject = reject
        setTimeout(() => {
<<<<<<< HEAD
          if (window.googleAuthResolve) { // Check if it hasn't been resolved/rejected already
=======
          if (window.googleAuthResolve) {
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
            delete window.googleAuthResolve
            delete window.googleAuthReject
            reject(new Error("Google authentication process timed out. Please try again."))
          }
        }, 60000)
      })

      window.google.accounts.id.prompt()
<<<<<<< HEAD
      // The actual result of Google Sign-In (token or error) is handled by the callback handleGoogleCredentialResponse
      // The promise here is to wait for that callback to resolve/reject through window.googleAuthResolve/Reject
      await googleAuthPromise; // This will resolve if commonSignInSuccess is called, or reject if handleGoogleCredentialResponse calls googleAuthReject.
      // If commonSignInSuccess was called, the user is set and redirection happens there.
      // If it gets here after promise resolution without error, it means commonSignInSuccess ran.
      // No explicit user return is needed here as commonSignInSuccess updates state and redirects.
      return; // Indicate success, though actual user data is set by commonSignInSuccess

    } catch (error) {
      // Check if this error originated from our specific 403 handling in handleGoogleCredentialResponse
      // The error thrown from there will have the user-friendly message.
      if (error.message && (error.message.includes("User account is not approved") || error.message.includes("accessible to this System"))) {
        console.warn(`AuthProvider [signInWithGoogleAuth]: Handled known 403 scenario: ${error.message}`);
      } else if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
        console.warn(`AuthProvider [signInWithGoogleAuth]: Handled generic 403 from Google sign-in flow. User message: "${error.message}"`);
      } else {
        console.error(
          "AuthProvider [signInWithGoogleAuth]: Google sign-in failed or other error.",
          error // Log the full error for other cases
        );
      }

      await commonSignOutLogic(false)
      setIsLoading(false)

=======
      const googleUser = await googleAuthPromise
      console.log("AuthProvider [signInWithGoogleAuth]: Google credential received, sending to backend.")

      const response = await internalApi.post("/auth/google", { token: googleUser.credential })
      const { token, user: userData } = response.data

      if (token && userData) {
        return commonSignInSuccess(token, userData, false)
      } else {
        throw new Error("Google Sign-In failed: No token or user data received from backend.")
      }
    } catch (error) {
      console.error(
        "AuthProvider [signInWithGoogleAuth]: Google sign-in failed.",
        error.isAxiosError && error.response ? error.response.data : error.message,
        error,
      )
      await commonSignOutLogic(false)
      setIsLoading(false)

>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
      let specificErrorMessage = "Google Sign-In failed. Please try again."
      if (error.message && error.message.toLowerCase().includes("popup_closed_by_user")) {
        specificErrorMessage = "Google Sign-In was closed. Please try again."
      } else if (error.message && error.message.toLowerCase().includes("idpiframe_initialization_failed")) {
        specificErrorMessage =
          "Could not initialize Google Sign-In. Check browser settings (e.g., third-party cookies) or try a different browser."
      } else if (error.message && error.message.toLowerCase().includes("credential_not_found")) {
        specificErrorMessage = "No Google credential was selected or provided."
      } else if (
        error.message &&
        (error.message.toLowerCase().includes("timeout") || error.message.toLowerCase().includes("timed out"))
      ) {
        specificErrorMessage = "Google Sign-In timed out. Please try again."
<<<<<<< HEAD
      } else if (axios.isAxiosError(error) && error.response && error.config?.url?.includes("/auth/google")) {
=======
      } else if (error.isAxiosError && error.response && error.config?.url === "/auth/google") {
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
        specificErrorMessage =
          error.response.data?.message ||
          (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) ||
          `Google Sign-In: Server error (${error.response.status}).`
<<<<<<< HEAD
      } else if (error.message && !error.message.toLowerCase().includes("axioserror")) {
=======
      } else if (error.message && !error.message.toLowerCase().includes("axios")) {
        // Prefer custom messages over generic axios network errors if possible
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
        specificErrorMessage = error.message
      }
      throw new Error(specificErrorMessage)
    } finally {
      delete window.googleAuthResolve
      delete window.googleAuthReject
    }
  }, [loadGoogleScript, handleGoogleCredentialResponse, commonSignInSuccess, commonSignOutLogic])

<<<<<<< HEAD
=======
  const signUp = useCallback(async (name, email, password, organization, organizationType, captchaToken) => {
    console.log("AuthProvider [signUp]: Attempting sign-up for", email)
    setIsLoading(true)
    try {
      const response = await internalApi.post("/auth/register", {
        name,
        email,
        password,
        organization,
        organizationType,
        captchaToken,
      })
      console.log("AuthProvider [signUp]: Sign-up API call successful.", response.data)
      setIsLoading(false)
      return response.data
    } catch (error) {
      console.error(
        "AuthProvider [signUp]: Sign-up failed.",
        error.isAxiosError && error.response ? error.response.data : error.message,
      )
      setIsLoading(false)
      if (axios.isAxiosError(error) && error.response) {
        const backendErrorMessage =
          error.response.data?.message ||
          (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) ||
          `Registration failed (${error.response.status}).`
        throw new Error(backendErrorMessage)
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error("Registration failed: Network Error.")
      }
      throw error
    }
  }, [])

>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
  const signOut = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      await commonSignOutLogic(redirect, redirectPath)
    },
    [commonSignOutLogic],
  )

  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
    ROLES,
    redirect,
    searchParams,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }
  return context
}
