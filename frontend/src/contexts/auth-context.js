// frontend/src/contexts/auth-context.js
"use client";

import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// ... (API_URL, internalApi, ROLES - keep as previously defined) ...
const AuthContext = createContext(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
console.info("AuthContext: API requests will be sent to:", API_URL);

const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const ROLES = {
  HEAD_ADMIN: "Head Admin",
  STUDENT: "Student",
  MANAGER: "Manager",
  PARTNER: "Partner",
  REVIEWER: "Reviewer",
};


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const performRedirect = useCallback(/* ... as previously defined ... */(loggedInUser) => {
    if (!loggedInUser || !loggedInUser.role) {
      console.warn("AuthProvider performRedirect: No user or role for redirection. Defaulting to /sign-in.");
      router.replace("/sign-in");
      return;
    }

    const redirectQueryParam = searchParams?.get("redirect");
    let targetPath;

    if (redirectQueryParam && redirectQueryParam !== pathname) {
      targetPath = redirectQueryParam;
      console.log(`AuthProvider performRedirect: Using redirect query param: ${targetPath}`);
    } else {
      if (loggedInUser.dashboard) {
        targetPath = loggedInUser.dashboard;
      } else {
        switch (loggedInUser.role) {
          case ROLES.HEAD_ADMIN:
          case ROLES.MANAGER:
            targetPath = "/admin-dashboard";
            break;
          case ROLES.STUDENT:
          case ROLES.PARTNER:
            targetPath = "/student-dashboard";
            break;
          case ROLES.REVIEWER:
            targetPath = "/admin-dashboard/review";
            break;
          default:
            console.warn(`AuthProvider performRedirect: Unknown role "${loggedInUser.role}", redirecting to generic /.`);
            targetPath = "/";
            break;
        }
      }
    }
    console.log(`AuthProvider performRedirect: Redirecting to ${targetPath}`);
    if (pathname !== targetPath) {
      router.replace(targetPath);
    }
  }, [router, searchParams, pathname]);

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
            setUser(userDataFromStorage);
            console.log("AuthProvider: User restored from localStorage.", userDataFromStorage);
          } else {
            console.warn("AuthProvider: Token found but no user in localStorage. Fetching from /auth/me.");
            try {
              const { data: meData } = await internalApi.get("/auth/me");
              if (meData && meData.user) {
                setUser(meData.user);
                localStorage.setItem("cedo_user", JSON.stringify(meData.user));
                console.log("AuthProvider: User fetched from /auth/me.", meData.user);
              } else {
                throw new Error("No user data from /auth/me or invalid response structure");
              }
            } catch (meError) {
              console.error("AuthProvider: Failed to fetch user from /auth/me:", meError.message);
              if (typeof document !== "undefined") {
                document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
              }
              localStorage.removeItem("cedo_user");
              delete internalApi.defaults.headers.common["Authorization"];
              setUser(null);
            }
          }
        } else {
          console.log("AuthProvider: No token found in cookie.");
          setUser(null);
          delete internalApi.defaults.headers.common["Authorization"];
          localStorage.removeItem("cedo_user");
        }
      } catch (error) {
        console.error("AuthProvider: Error during initial auth processing:", error);
        setUser(null);
        delete internalApi.defaults.headers.common["Authorization"];
        if (typeof document !== "undefined") {
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        }
        localStorage.removeItem("cedo_user");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        console.log("AuthProvider: Initialization complete.", { user, isLoading: false, isInitialized: true });
      }
    };
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized]); // Added isInitialized dependency

  const commonSignInSuccess = useCallback((token, userData, rememberMe = false) => {
    if (typeof document !== "undefined") {
      let cookieOptions = "path=/; SameSite=Lax; Secure";
      if (rememberMe) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        cookieOptions += `; expires=${expiryDate.toUTCString()}`;
      }
      document.cookie = `cedo_token=${token}; ${cookieOptions}`;
      console.log("AuthProvider: Cookie 'cedo_token' set.");
      localStorage.setItem("cedo_user", JSON.stringify(userData));
    }
    internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    setIsLoading(false);
    setIsInitialized(true);
    console.log("AuthProvider: Sign-in successful. User state updated.", userData);
    performRedirect(userData);
    return userData;
  }, [performRedirect]); // Added performRedirect to useCallback dependencies


  const commonSignOutLogic = useCallback(async (redirect = true, redirectPath = "/sign-in") => {
    console.log("AuthProvider [signOut]: Signing out.");
    setIsLoading(true);
    try {
      // await internalApi.post("/auth/logout");
    } catch (error) {
      console.error("AuthProvider [signOut]: Error during backend logout:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        localStorage.removeItem("cedo_token");
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        console.log("AuthProvider [signOut]: Token cookie and localStorage cleared.");
      }
      delete internalApi.defaults.headers.common["Authorization"];
      setUser(null);
      setIsLoading(false);
      if (redirect) {
        console.log(`AuthProvider [signOut]: Redirecting to ${redirectPath}.`);
        router.replace(redirectPath);
      }
    }
  }, [router]); // Added router to useCallback dependencies

  const signIn = useCallback(async (email, password, rememberMe = false) => {
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
      await commonSignOutLogic(false);
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        const backendErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Server error (${error.response.status}).`;
        throw new Error(backendErrorMessage);
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error("Network Error: Unable to connect to the server.");
      }
      throw error;
    }
  }, [commonSignInSuccess, commonSignOutLogic]);

  const loadGoogleScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        console.log("AuthProvider [loadGoogleScript]: Google script already loaded.");
        resolve();
        return;
      }
      if (typeof document === 'undefined') {
        console.warn("AuthProvider [loadGoogleScript]: 'document' is undefined (SSR?).");
        resolve();
        return;
      }
      const existingScript = document.getElementById('google-identity-services-script');
      if (existingScript) {
        console.log("AuthProvider [loadGoogleScript]: Google script tag already exists.");
        if (window.google?.accounts?.id) resolve();
        else {
          const handleLoad = () => {
            if (window.google?.accounts?.id) resolve();
            else reject(new Error("Google script loaded but API not available."));
            existingScript.removeEventListener('load', handleLoad);
            existingScript.removeEventListener('error', handleError);
          };
          const handleError = () => {
            reject(new Error("Failed to load existing Google Identity Services script."));
            existingScript.removeEventListener('load', handleLoad);
            existingScript.removeEventListener('error', handleError);
          };
          existingScript.addEventListener('load', handleLoad);
          existingScript.addEventListener('error', handleError);
        }
        return;
      }
      console.log("AuthProvider [loadGoogleScript]: Loading Google script...");
      const script = document.createElement("script");
      script.id = 'google-identity-services-script';
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("AuthProvider [loadGoogleScript]: Google script loaded successfully.");
        if (window.google?.accounts?.id) resolve();
        else reject(new Error("Google script loaded but google.accounts.id not available."));
      };
      script.onerror = () => reject(new Error("Failed to load Google Identity Services script."));
      document.head.appendChild(script);
    });
  }, []);


  const handleGoogleCredentialResponse = useCallback(async (response) => {
    console.log("AuthProvider [handleGoogleCredentialResponse]: Received response from Google SDK");
    if (!response?.credential) {
      console.error("AuthProvider [handleGoogleCredentialResponse]: No credential in response");
      if (window.googleAuthReject) {
        window.googleAuthReject(new Error("No credential received from Google"));
      }
      return;
    }

    try {
      // Send the ID token to your backend
      const backendResponse = await internalApi.post("/auth/google", {
        token: response.credential
      });

      const { token, user: userData } = backendResponse.data;

      if (window.googleAuthResolve) {
        window.googleAuthResolve({ credential: response.credential, ...backendResponse.data });
      }
    } catch (error) {
      console.error("AuthProvider [handleGoogleCredentialResponse]: Backend verification failed", error);
      if (window.googleAuthReject) {
        window.googleAuthReject(error);
      }
    }
  }, [internalApi]);


  const signInWithGoogleAuth = useCallback(async () => {
    console.log("AuthProvider [signInWithGoogleAuth]: Initiating Google sign-in.");
    setIsLoading(true);
    try {
      await loadGoogleScript();
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        throw new Error("Google Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID) is not configured.");
      }

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
          if (window.googleAuthResolve) {
            delete window.googleAuthResolve;
            delete window.googleAuthReject;
            reject(new Error("Google authentication process timed out. Please try again."));
          }
        }, 60000);
      });

      window.google.accounts.id.prompt();
      const googleUser = await googleAuthPromise;
      console.log("AuthProvider [signInWithGoogleAuth]: Google credential received, sending to backend.");

      const response = await internalApi.post("/auth/google", { token: googleUser.credential });
      const { token, user: userData } = response.data;

      if (token && userData) {
        return commonSignInSuccess(token, userData, false);
      } else {
        throw new Error("Google Sign-In failed: No token or user data received from backend.");
      }
    } catch (error) {
      console.error("AuthProvider [signInWithGoogleAuth]: Google sign-in failed.", error.isAxiosError && error.response ? error.response.data : error.message, error);
      await commonSignOutLogic(false);
      setIsLoading(false);

      let specificErrorMessage = "Google Sign-In failed. Please try again.";
      if (error.message && error.message.toLowerCase().includes("popup_closed_by_user")) {
        specificErrorMessage = "Google Sign-In was closed. Please try again.";
      } else if (error.message && error.message.toLowerCase().includes("idpiframe_initialization_failed")) {
        specificErrorMessage = "Could not initialize Google Sign-In. Check browser settings (e.g., third-party cookies) or try a different browser.";
      } else if (error.message && error.message.toLowerCase().includes("credential_not_found")) {
        specificErrorMessage = "No Google credential was selected or provided.";
      } else if (error.message && (error.message.toLowerCase().includes("timeout") || error.message.toLowerCase().includes("timed out"))) {
        specificErrorMessage = "Google Sign-In timed out. Please try again.";
      } else if (error.isAxiosError && error.response && error.config?.url === "/auth/google") {
        specificErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Google Sign-In: Server error (${error.response.status}).`;
      } else if (error.message && !error.message.toLowerCase().includes("axios")) { // Prefer custom messages over generic axios network errors if possible
        specificErrorMessage = error.message;
      }
      throw new Error(specificErrorMessage);
    } finally {
      delete window.googleAuthResolve;
      delete window.googleAuthReject;
    }
  }, [loadGoogleScript, handleGoogleCredentialResponse, commonSignInSuccess, commonSignOutLogic]); // Added dependencies


  const signUp = useCallback(async (name, email, password, organization, organizationType, captchaToken) => {
    console.log("AuthProvider [signUp]: Attempting sign-up for", email);
    setIsLoading(true);
    try {
      const response = await internalApi.post("/auth/register", {
        name, email, password, organization, organizationType, captchaToken,
      });
      console.log("AuthProvider [signUp]: Sign-up API call successful.", response.data);
      setIsLoading(false);
      return response.data;
    } catch (error) {
      console.error("AuthProvider [signUp]: Sign-up failed.", error.isAxiosError && error.response ? error.response.data : error.message);
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        const backendErrorMessage = error.response.data?.message || (error.response.data?.errors && error.response.data.errors.map((e) => e.msg).join(", ")) || `Registration failed (${error.response.status}).`;
        throw new Error(backendErrorMessage);
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error("Registration failed: Network Error.");
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async (redirect = true, redirectPath = "/sign-in") => {
    await commonSignOutLogic(redirect, redirectPath);
  }, [commonSignOutLogic]);

  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
    signUp,
    ROLES,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}