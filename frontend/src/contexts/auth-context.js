// frontend/src/contexts/auth-context.js
"use client";

import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // Added usePathname
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(undefined);

// API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
console.info("AuthContext: API requests will be sent to:", API_URL);

// Axios instance for API calls
const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Standardized roles. Ensure these match your backend and middleware.
export const ROLES = {
  HEAD_ADMIN: "Head Admin", // Matches middleware
  STUDENT: "Student",       // Matches middleware
  MANAGER: "Manager",       // Matches middleware
  PARTNER: "Partner",       // Added for completeness
  REVIEWER: "Reviewer",     // Added for completeness
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // True initially until auth status is determined
  const [isInitialized, setIsInitialized] = useState(false); // Tracks if initial auth check has run
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const searchParams = useSearchParams(); // Get searchParams for redirect logic

  // Centralized redirection logic
  const performRedirect = useCallback((loggedInUser) => {
    if (!loggedInUser || !loggedInUser.role) {
      console.warn("AuthProvider performRedirect: No user or role for redirection. Defaulting to /sign-in.");
      router.replace("/sign-in"); // Fallback
      return;
    }

    const redirectQueryParam = searchParams?.get("redirect");
    let targetPath;

    if (redirectQueryParam && redirectQueryParam !== pathname) { // Avoid redirecting to self if already on target
      targetPath = redirectQueryParam;
      console.log(`AuthProvider performRedirect: Using redirect query param: ${targetPath}`);
    } else {
      // Use dashboard path from user object if available (recommended)
      if (loggedInUser.dashboard) {
        targetPath = loggedInUser.dashboard;
      } else { // Fallback to role-based paths
        switch (loggedInUser.role) {
          case ROLES.HEAD_ADMIN:
            targetPath = "/admin-dashboard"; // As per your proposed structure
            break;
          case ROLES.STUDENT:
            targetPath = "/student-dashboard"; // As per your proposed structure
            break;
          case ROLES.MANAGER:
            targetPath = "/admin-dashboard"; // Assuming manager uses admin dashboard
            break;
          // Add other roles like PARTNER, REVIEWER if they have specific dashboards
          default:
            console.warn(`AuthProvider performRedirect: Unknown role "${loggedInUser.role}", redirecting to generic / (main redirector).`);
            targetPath = "/"; // Redirect to the main redirector page: app/(main)/page.jsx
            break;
        }
      }
    }
    console.log(`AuthProvider performRedirect: Redirecting to ${targetPath}`);
    if (pathname !== targetPath) { // Only redirect if not already on the target path
      router.replace(targetPath);
    }
  }, [router, searchParams, pathname]);


  // Effect for initializing authentication state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("AuthProvider: Initializing auth...");
      setIsLoading(true);
      try {
        let token = null;
        if (typeof document !== "undefined") {
          const cookieValue = document.cookie
            .split("; ")
            .find((row) => row.startsWith("cedo_token="));
          if (cookieValue) {
            token = cookieValue.split("=")[1];
          }
        }

        if (token) {
          console.log("AuthProvider: Token found in cookie.", token ? 'Token valid format' : 'Token invalid format');
          internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const storedUser = localStorage.getItem("cedo_user");

          if (storedUser) {
            const userDataFromStorage = JSON.parse(storedUser);
            // Optional: Verify token is still valid for this user, e.g. by a quick /auth/me call
            // For now, we trust localStorage if token exists.
            setUser(userDataFromStorage);
            console.log("AuthProvider: User restored from localStorage.", userDataFromStorage);
          } else {
            console.warn("AuthProvider: Token found but no user in localStorage. Fetching from /auth/me.");
            try {
              const { data: meData } = await internalApi.get("/auth/me"); // Backend should return { user: {...} }
              if (meData && meData.user) {
                setUser(meData.user);
                localStorage.setItem("cedo_user", JSON.stringify(meData.user));
                console.log("AuthProvider: User fetched from /auth/me.", meData.user);
              } else {
                throw new Error("No user data from /auth/me or invalid response structure");
              }
            } catch (meError) {
              console.error("AuthProvider: Failed to fetch user from /auth/me:", meError.message);
              // Clear invalid token and user data
              if (typeof document !== "undefined") {
                document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
              }
              localStorage.removeItem("cedo_user");
              delete internalApi.defaults.headers.common["Authorization"];
              setUser(null);
            }
          }
        } else {
          console.log("AuthProvider: No token found in cookie.");
          setUser(null); // Ensure user is null if no token
          delete internalApi.defaults.headers.common["Authorization"];
          localStorage.removeItem("cedo_user"); // Clear localStorage as well
        }
      } catch (error) {
        console.error("AuthProvider: Error during initial auth processing:", error);
        setUser(null);
        delete internalApi.defaults.headers.common["Authorization"];
        if (typeof document !== "undefined") {
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        }
        localStorage.removeItem("cedo_user");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        console.log("AuthProvider: Initialization complete.", { user, isLoading: false, isInitialized: true });
      }
    };
    initializeAuth();
  }, []); // Empty dependency array: run only once on mount

  const commonSignInSuccess = (token, userData, rememberMeGoogle = false) => {
    if (typeof document !== "undefined") {
      let cookieString = `cedo_token=${token}; path=/; SameSite=Lax`;
      // For Google Sign In, 'rememberMe' is not directly applicable in the same way,
      // Google manages its own session. We set a session cookie for our app.
      // For email/password, 'rememberMe' can extend cookie life.
      if (rememberMeGoogle === true) { // This flag differentiates if it's email/pass with rememberMe
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Example: 7 days
        cookieString += `; expires=${expiryDate.toUTCString()}`;
      }
      document.cookie = cookieString;
      console.log("AuthProvider: Cookie 'cedo_token' set.");
      localStorage.setItem("cedo_user", JSON.stringify(userData));
    }
    internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    setIsLoading(false); // Ensure loading is false after successful sign-in
    setIsInitialized(true); // Should already be true, but good to ensure
    console.log("AuthProvider: Sign-in successful. User state updated.", userData);
    performRedirect(userData); // Centralized redirect
    return userData;
  };

  const commonSignOutLogic = (redirect = true) => {
    console.log("AuthProvider [signOut]: Signing out.");
    setIsLoading(true);
    try {
      // Optional: await internalApi.post("/auth/logout"); // Call backend to invalidate session/token
    } catch (error) {
      console.error("AuthProvider [signOut]: Error during backend logout:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        localStorage.removeItem("cedo_token"); // Though token is mainly in cookie
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        console.log("AuthProvider [signOut]: Token cookie and localStorage cleared.");
      }
      delete internalApi.defaults.headers.common["Authorization"];
      setUser(null);
      setIsLoading(false);
      // setIsInitialized(true); // isInitialized should remain true
      if (redirect) {
        console.log("AuthProvider [signOut]: Redirecting to /sign-in.");
        router.replace("/sign-in");
      }
    }
  };

  const signIn = async (email, password, rememberMe = false) => {
    console.log("AuthProvider [signIn]: Attempting sign-in for", email);
    setIsLoading(true);
    try {
      const response = await internalApi.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;
      if (token && userData) {
        return commonSignInSuccess(token, userData, rememberMe);
      } else {
        throw new Error("Login failed: No token or user data received.");
      }
    } catch (error) {
      console.error("AuthProvider [signIn]: Sign-in failed.", error.isAxiosError && error.response ? error.response.data : error.message);
      commonSignOutLogic(false); // Clear auth state but don't redirect from here
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        const backendErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Server error (${error.response.status}).`;
        throw new Error(backendErrorMessage);
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error("Network Error: Unable to connect to the server.");
      }
      throw error;
    }
  };

  const signInWithGoogleAuth = async () => {
    console.log("AuthProvider [signInWithGoogleAuth]: Initiating Google sign-in.");
    setIsLoading(true);
    try {
      await loadGoogleScript();
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const googleAuthPromise = new Promise((resolve, reject) => {
        window.googleAuthResolve = resolve;
        window.googleAuthReject = reject;
        setTimeout(() => {
          if (window.googleAuthResolve) { // Check if it hasn't been cleared yet
            delete window.googleAuthResolve;
            delete window.googleAuthReject;
            reject(new Error("Google authentication process timed out. Please try again."));
          }
        }, 60000); // 60 seconds timeout
      });
      window.google.accounts.id.prompt();
      const googleUser = await googleAuthPromise;
      console.log("AuthProvider [signInWithGoogleAuth]: Google credential received, sending to backend.");
      const response = await internalApi.post("/auth/google", { token: googleUser.credential });
      const { token, user: userData } = response.data;

      if (token && userData) {
        return commonSignInSuccess(token, userData); // rememberMe not applicable for Google in the same way
      } else {
        throw new Error("Google Sign-In failed: No token or user data received.");
      }
    } catch (error) {
      console.error("AuthProvider [signInWithGoogleAuth]: Google sign-in failed.", error.isAxiosError && error.response ? error.response.data : error.message);
      commonSignOutLogic(false); // Clear auth state
      setIsLoading(false);
      if (error.config?.url === "/auth/google" && axios.isAxiosError(error) && error.response) {
        const backendErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Google Sign-In: Server error (${error.response.status}).`;
        throw new Error(backendErrorMessage);
      }
      throw error; // Re-throw for SignInPage to catch
    } finally {
      // Clean up promise handlers
      delete window.googleAuthResolve;
      delete window.googleAuthReject;
    }
  };

  const handleGoogleCredentialResponse = (response) => {
    console.log("AuthProvider [handleGoogleCredentialResponse]: Received response from Google SDK.", response ? "Has response" : "No response");
    if (response && response.credential) {
      if (window.googleAuthResolve) {
        console.log("AuthProvider [handleGoogleCredentialResponse]: Resolving Google auth promise.");
        window.googleAuthResolve(response);
      } else {
        console.warn("AuthProvider [handleGoogleCredentialResponse]: window.googleAuthResolve not found (timed out or already handled).");
      }
    } else {
      const errorMessage = response?.error || "Google authentication failed or was dismissed by the user.";
      console.error("AuthProvider [handleGoogleCredentialResponse]:", errorMessage);
      if (window.googleAuthReject) {
        window.googleAuthReject(new Error(errorMessage));
      } else {
        console.warn("AuthProvider [handleGoogleCredentialResponse]: window.googleAuthReject not found (timed out or already handled).");
      }
    }
    // Do not delete promise handlers here, signInWithGoogleAuth's finally block will do it
  };

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        console.log("AuthProvider [loadGoogleScript]: Google script already loaded and initialized.");
        resolve();
        return;
      }
      if (typeof document === 'undefined') {
        console.warn("AuthProvider [loadGoogleScript]: document is undefined (SSR?), cannot load Google script.");
        resolve(); // Resolve to not block, but Google Sign-In won't work
        return;
      }
      const existingScript = document.getElementById('google-identity-services-script');
      if (existingScript) {
        console.log("AuthProvider [loadGoogleScript]: Google script tag already exists.");
        // If script exists but window.google.accounts.id is not yet available, listen to its load event.
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          existingScript.addEventListener('load', resolve);
          existingScript.addEventListener('error', () => reject(new Error("Failed to load Google Identity Services script (existing script error).")));
        }
        return;
      }
      console.log("AuthProvider [loadGoogleScript]: Loading Google script.");
      const script = document.createElement("script");
      script.id = 'google-identity-services-script';
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("AuthProvider [loadGoogleScript]: Google script loaded successfully.");
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          // This case should ideally not happen if onload is fired correctly
          console.error("AuthProvider [loadGoogleScript]: Script loaded but google.accounts.id not available.");
          reject(new Error("Google script loaded but not initialized correctly."));
        }
      };
      script.onerror = () => {
        console.error("AuthProvider [loadGoogleScript]: Failed to load Google script.");
        reject(new Error("Failed to load Google Identity Services script. Check network and script URL."));
      };
      document.head.appendChild(script);
    });
  };

  const signUp = async (name, email, password, organization, organizationType, captchaToken) => {
    console.log("AuthProvider [signUp]: Attempting sign-up for", email);
    setIsLoading(true);
    try {
      // The backend /auth/register route typically returns the new user and a token,
      // or just a success message. If it returns user and token, you could log them in.
      // For now, assuming it just returns user data or success message, not auto-login.
      const response = await internalApi.post("/auth/register", {
        name, email, password, organization, organizationType, captchaToken,
      });
      console.log("AuthProvider [signUp]: Sign-up API call successful.", response.data);
      // If backend returns token and user, you could call commonSignInSuccess here.
      // Example: if (response.data.token && response.data.user) {
      //   return commonSignInSuccess(response.data.token, response.data.user);
      // }
      return response.data; // Return data for SignUpPage to handle (e.g., show success message)
    } catch (error) {
      console.error("AuthProvider [signUp]: Sign-up failed.", error.isAxiosError && error.response ? error.response.data : error.message);
      setIsLoading(false); // Ensure loading is false on error
      if (axios.isAxiosError(error) && error.response) {
        const backendErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Registration failed (${error.response.status}).`;
        throw new Error(backendErrorMessage);
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error("Registration failed: Network Error.");
      }
      throw error;
    } finally {
      // setIsLoading(false); // Moved to error block or should be set if auto-login happens
    }
  };

  const signOut = async (redirect = true) => {
    commonSignOutLogic(redirect);
  };

  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
    signUp,
    ROLES, // Expose ROLES if needed by components
    // setUser, // Expose setUser with caution, usually not needed by consuming components
  };

  // console.log("AuthProvider: Rendering. Context values:", { userEmail: user?.email, isLoading, isInitialized });

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider. Check your app's root layout file.");
  }
  return context;
}
