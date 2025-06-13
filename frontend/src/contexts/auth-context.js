/**
 * Authentication Context Provider - Simplified for COOP Compatibility
 * 
 * Implements Google OAuth 2.0 and traditional email/password authentication
 * with simplified state management and COOP-compatible Google Sign-In.
 * 
 * Features:
 * - Google Sign-In with simplified Identity Services integration
 * - Email/password authentication with reCAPTCHA
 * - Automatic token refresh and session management
 * - Role-based access control and redirects
 * - Simplified error handling and user feedback
 * 
 * @see https://developers.google.com/identity/gsi/web
 * @see https://medium.com/@aswathyraj/google-oauth-in-node-js-express-and-react-js-6cb2e23e82e5
 * 
 * @module contexts/auth-context
 */

// src/contexts/auth-context.js
"use client";

import { useToast } from "@/components/ui/use-toast";
import { cleanupGoogleAuth, renderGoogleSignInButton } from "@/lib/google-auth";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

/**
 * Session Management Configuration
 */
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES) || 30;
const SESSION_TIMEOUT_DURATION = SESSION_TIMEOUT_MINUTES * 60 * 1000;

/**
 * Axios instance for API communication
 */
const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * User Role Constants
 */
export const ROLES = {
  HEAD_ADMIN: 'head_admin',
  STUDENT: 'student',
  MANAGER: 'manager',
  PARTNER: 'partner',
  REVIEWER: 'reviewer',
};

/**
 * Authentication Context
 */
const AuthContext = createContext(undefined);

/**
 * Global state variables for session management
 */
let sessionTimeoutId;

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }) {
  // Next.js hooks for navigation and routing
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParamsHook = useSearchParams();
  const { toast } = useToast();

  // Authentication state management
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Google Sign-In specific state (simplified)
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(false);

  // Reference for stable callback access
  const authStateRef = useRef({ user: null, isLoading: true });

  // Update ref when state changes
  useEffect(() => {
    authStateRef.current = { user, isLoading };
  }, [user, isLoading]);

  /**
   * Display error messages to user
   */
  const showErrorToast = useCallback((title, description, variant = "destructive") => {
    toast({
      title,
      description,
      variant,
      duration: 5000,
    });
  }, [toast]);

  /**
   * Display success messages to user
   */
  const showSuccessToast = useCallback((title, description) => {
    toast({
      title,
      description,
      variant: "default",
      duration: 4000,
    });
  }, [toast]);

  /**
   * Handle authentication errors with user-friendly messages
   */
  const handleAuthError = useCallback((error, context = "Authentication") => {
    let title = `${context} Error`;
    let description = "An unexpected error occurred. Please try again.";

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      const reason = error.response?.data?.reason;

      switch (status) {
        case 403:
          if (reason === "USER_NOT_APPROVED" || (message && message.toLowerCase().includes("pending approval"))) {
            title = "Account Pending Approval";
            description = "Your account is currently pending approval. Please contact an administrator to activate your account.";
            return { title, description, skipToast: true };
          } else if (reason === "USER_NOT_FOUND") {
            title = "Account Not Found";
            description = "Account not found. Please contact an administrator to create your account first.";
            return { title, description, skipToast: true };
          } else {
            title = "Access Denied";
            description = message || "You don't have permission to access this resource.";
          }
          break;
        case 401:
          title = "Authentication Failed";
          description = message || "Invalid credentials. Please check your login information.";
          break;
        case 404:
          title = "Service Unavailable";
          description = "The authentication service is currently unavailable. Please try again later.";
          break;
        case 500:
          title = "Server Error";
          description = "A server error occurred. Please try again later.";
          break;
        default:
          if (message) {
            description = message;
          }
      }
    } else if (error instanceof Error) {
      description = error.message;
    }

    const errorInfo = { title, description };
    if (!errorInfo.skipToast) {
      showErrorToast(title, description);
    }

    return errorInfo;
  }, [showErrorToast]);

  /**
   * Perform redirect based on user role and context
   */
  const performRedirect = useCallback(
    (loggedInUser) => {
      const currentRedirectParam = currentSearchParamsHook.get("redirect");
      if (!loggedInUser || !loggedInUser.role) {
        if (pathname !== "/sign-in") router.replace("/sign-in");
        return;
      }

      let targetPath;
      if (currentRedirectParam && currentRedirectParam !== pathname) {
        targetPath = currentRedirectParam;
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
            default:
              targetPath = "/";
              break;
          }
        }
      }

      if (pathname !== targetPath) {
        router.replace(targetPath);
      }
    },
    [router, currentSearchParamsHook, pathname],
  );

  /**
   * Reset session timeout
   */
  const resetSessionTimeout = useCallback(() => {
    if (typeof window === "undefined") return;
    clearTimeout(sessionTimeoutId);
    if (authStateRef.current.user) {
      sessionTimeoutId = setTimeout(() => {
        console.log(`Session timed out due to inactivity (${SESSION_TIMEOUT_MINUTES} minutes).`);
        signOut(true, `/sign-in?reason=session_timeout_activity&redirect=${encodeURIComponent(pathname)}`);
      }, SESSION_TIMEOUT_DURATION);
    }
  }, [pathname]);

  /**
   * Common sign-out logic
   */
  const signOut = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      console.log("AuthContext: Signing out. Redirect:", redirect, "Path:", redirectPath);
      setIsLoading(true);
      clearTimeout(sessionTimeoutId);

      try {
        // Optional: await internalApi.post("/auth/logout");
      } catch (error) {
        // Ignore logout errors
      } finally {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cedo_user");
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";

          // Enhanced Google Sign-In cleanup - Force clear all states
          try {
            cleanupGoogleAuth();

            // Additional cleanup for persistent Google Sign-In state
            if (window.__currentGoogleSignInActions) {
              window.__currentGoogleSignInActions = null;
            }

            // Clear any pending Google Identity Services operations
            if (window.google?.accounts?.id) {
              try {
                window.google.accounts.id.cancel();
                // Force disable auto-select to prevent automatic re-signin
                window.google.accounts.id.disableAutoSelect();
              } catch (e) {
                console.warn('Warning: Error during Google Sign-In cleanup:', e);
              }
            }

            console.log("✅ Google Sign-In state cleaned successfully");
          } catch (error) {
            console.warn('Warning: Error during enhanced Google cleanup:', error);
          }
        }

        // Clear API headers
        if (internalApi && internalApi.defaults && internalApi.defaults.headers && internalApi.defaults.headers.common) {
          delete internalApi.defaults.headers.common["Authorization"];
        }

        // Reset Google auth processing state
        setIsGoogleAuthProcessing(false);

        setUser(null);
        console.log("AuthContext (SignOut): User set to null.");

        if (redirect) {
          let effectiveRedirectPath = redirectPath;
          if (redirectPath === "/sign-in" && pathname !== "/sign-in" && pathname !== "/") {
            effectiveRedirectPath = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
          }

          if (pathname !== effectiveRedirectPath) {
            router.replace(effectiveRedirectPath);
          }
        }
        setIsLoading(false);
      }
    },
    [router, pathname],
  );

  /**
   * Session timeout event listeners
   */
  useEffect(() => {
    if (typeof window === "undefined" || !user) {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", resetSessionTimeout);
        window.removeEventListener("keypress", resetSessionTimeout);
      }
      clearTimeout(sessionTimeoutId);
      return;
    }

    resetSessionTimeout();

    window.addEventListener("mousemove", resetSessionTimeout);
    window.addEventListener("keypress", resetSessionTimeout);

    return () => {
      window.removeEventListener("mousemove", resetSessionTimeout);
      window.removeEventListener("keypress", resetSessionTimeout);
      clearTimeout(sessionTimeoutId);
    };
  }, [user, resetSessionTimeout]);

  /**
   * Common sign-in success handler
   */
  const commonSignInSuccess = useCallback(
    (token, userData, rememberMe = false) => {
      if (typeof document !== "undefined") {
        let cookieOptions = "path=/; SameSite=Lax; Secure";
        if (rememberMe) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          cookieOptions += `; expires=${expiryDate.toUTCString()}`;
        }
        document.cookie = `cedo_token=${token}; ${cookieOptions}`;
        localStorage.setItem("cedo_user", JSON.stringify(userData));
      }

      if (internalApi && internalApi.defaults && internalApi.defaults.headers) {
        internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      setUser(userData);
      setIsLoading(false);
      performRedirect(userData);
      return userData;
    },
    [performRedirect],
  );

  /**
   * Verify current user from stored credentials
   */
  const verifyCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      let token = null;
      if (typeof document !== "undefined") {
        const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
        if (cookieValue) token = cookieValue.split("=")[1];
      }

      if (token) {
        if (internalApi && internalApi.defaults && internalApi.defaults.headers) {
          internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const storedUser = localStorage.getItem("cedo_user");
        let currentUserData = null;

        if (storedUser) {
          currentUserData = JSON.parse(storedUser);
        } else {
          const { data: meData } = await internalApi.get("/users/me");
          if (meData && meData.user) {
            currentUserData = meData.user;
            localStorage.setItem("cedo_user", JSON.stringify(meData.user));
          } else {
            throw new Error("No user data from /users/me despite having a token.");
          }
        }
        setUser(currentUserData);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("AuthContext [verifyCurrentUser]: Error verifying current user or token invalid.", error.message);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
      }

      if (internalApi && internalApi.defaults && internalApi.defaults.headers && internalApi.defaults.headers.common) {
        delete internalApi.defaults.headers.common["Authorization"];
      }
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    if (!isInitialized) {
      verifyCurrentUser();
    }
  }, [isInitialized, verifyCurrentUser]);

  /**
   * Handle Google credential response
   */
  const handleGoogleCredentialResponse = useCallback(
    async (googleResponse) => {
      console.log('🔧 AuthContext: Processing Google credential response:', googleResponse);

      try {
        if (googleResponse.error || !googleResponse?.credential) {
          let errMsg = "Google Sign-In failed or was cancelled by the user.";
          if (googleResponse.error_description) {
            errMsg = googleResponse.error_description;
          } else if (googleResponse.error) {
            errMsg = `Google Sign-In error: ${googleResponse.error}`;
          }
          throw new Error(errMsg);
        }

        const backendResponse = await internalApi.post("/auth/google", { token: googleResponse.credential });
        const { token, user: userDataFromBackend } = backendResponse.data;

        if (token && userDataFromBackend) {
          commonSignInSuccess(token, userDataFromBackend, false);
          showSuccessToast("Sign-In Successful", `Welcome back, ${userDataFromBackend.name}!`);
          return userDataFromBackend;
        } else {
          throw new Error("Google Sign-In failed: No valid token or user data received from backend server.");
        }
      } catch (error) {
        // Special handling for 403 errors
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          const message = error.response?.data?.message;
          const reason = error.response?.data?.reason;

          if (reason === "USER_NOT_FOUND") {
            const notFoundError = new Error("Account not found. Please contact an administrator to create your account first.");
            notFoundError.isUserNotFound = true;
            throw notFoundError;
          }

          if (reason === "USER_NOT_APPROVED" ||
            (message && (
              message.toLowerCase().includes("pending approval") ||
              message.toLowerCase().includes("account pending") ||
              message.toLowerCase().includes("not approved")
            ))) {
            const pendingApprovalError = new Error("Your account is currently pending approval. Please contact an administrator to activate your account.");
            pendingApprovalError.isPendingApproval = true;
            throw pendingApprovalError;
          }
        }

        // For all other errors, use the existing error handling system
        const errorInfo = handleAuthError(error, "Google Sign-In");
        throw new Error(errorInfo.description);
      }
    },
    [commonSignInSuccess, handleAuthError, showSuccessToast]
  );

  /**
   * Listen for global Google Sign-In events
   */
  useEffect(() => {
    const handleGlobalGoogleSignIn = async (event) => {
      console.log('🔧 Global Google Sign-In event received:', event.detail);
      setIsGoogleAuthProcessing(true);

      try {
        await handleGoogleCredentialResponse(event.detail);
      } catch (error) {
        console.error('❌ Google Sign-In error:', error);
        // Error toast already shown by handleAuthError or specific handling
      } finally {
        setIsGoogleAuthProcessing(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('google-signin-response', handleGlobalGoogleSignIn);
      console.log('✅ Global Google Sign-In event listener registered');
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('google-signin-response', handleGlobalGoogleSignIn);
        console.log('🔄 Global Google Sign-In event listener cleaned up');
      }
    };
  }, [handleGoogleCredentialResponse]);

  /**
   * Email/password sign-in
   */
  const signIn = useCallback(
    async (email, password, rememberMe = false, captchaToken = null) => {
      setIsLoading(true);
      try {
        const payload = { email, password };
        if (captchaToken) payload.captchaToken = captchaToken;

        const response = await internalApi.post("/auth/login", payload);
        const { token, user: userData } = response.data;

        if (token && userData) {
          showSuccessToast("Sign-In Successful", `Welcome back, ${userData.name}!`);
          return commonSignInSuccess(token, userData, rememberMe);
        }
        throw new Error("Login failed: No token or user data received from server.");
      } catch (error) {
        const errorInfo = handleAuthError(error, "Sign-In");
        await signOut(false);
        setIsLoading(false);
        throw new Error(errorInfo.description);
      }
    },
    [commonSignInSuccess, signOut, handleAuthError, showSuccessToast],
  );

  /**
   * Google Sign-In with simplified integration
   */
  const signInWithGoogleAuth = useCallback(async (buttonContainerElement, buttonOptions = {}) => {
    console.log("AuthContext: signInWithGoogleAuth CALLED");

    try {
      setIsGoogleAuthProcessing(true);

      const defaultOptions = {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
      };

      const mergedOptions = { ...defaultOptions, ...buttonOptions };

      // Use simplified Google Auth library
      await renderGoogleSignInButton(buttonContainerElement, mergedOptions);

      console.log("AuthContext: Google button rendered successfully");

    } catch (error) {
      console.error("AuthContext: Google Sign-In error:", error);
      setIsGoogleAuthProcessing(false);
      throw error;
    }
  }, []);

  /**
   * Force cleanup Google Sign-In state
   */
  const forceCleanupGoogleSignIn = useCallback(() => {
    console.log("🚨 FORCE CLEANUP: Cleaning up Google Sign-In state");
    cleanupGoogleAuth();
    setIsGoogleAuthProcessing(false);
  }, []);

  // User management functions (keeping existing implementation)
  const fetchAllUsers = useCallback(async () => {
    if (!user || user.role !== ROLES.HEAD_ADMIN) {
      const errorMsg = "Unauthorized to fetch users.";
      showErrorToast("Access Denied", "You don't have permission to view user data.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log("AuthContext: Fetching all users...");
      const response = await internalApi.get("/users");
      return response.data;
    } catch (error) {
      const errorInfo = handleAuthError(error, "User Data Fetch");
      if (process.env.NODE_ENV === 'development') {
        console.error("AuthContext: Error in fetchAllUsers:", error);
      }
      throw error;
    }
  }, [user, handleAuthError, showErrorToast]);

  const updateUserApproval = useCallback(async (userIdToUpdate, newApprovalStatus) => {
    if (!user || user.role !== ROLES.HEAD_ADMIN) {
      const errorMsg = "Unauthorized to update user approval.";
      showErrorToast("Access Denied", "You don't have permission to update user approval status.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log(`AuthContext: Updating approval for user ${userIdToUpdate} to ${newApprovalStatus}`);
      const response = await internalApi.put(`/users/${userIdToUpdate}/approval`, { is_approved: newApprovalStatus });
      const statusText = newApprovalStatus ? "approved" : "revoked";
      showSuccessToast("User Updated", `User approval status has been ${statusText} successfully.`);
      return response.data;
    } catch (error) {
      const errorInfo = handleAuthError(error, "User Approval Update");
      if (process.env.NODE_ENV === 'development') {
        console.error("AuthContext: Error in updateUserApproval:", error);
      }
      throw error;
    }
  }, [user, handleAuthError, showErrorToast, showSuccessToast]);

  /**
   * Context value
   */
  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
    forceCleanupGoogleSignIn,
    // Additional state for UI components
    isGoogleAuthProcessing,
    // User management functions
    ROLES,
    redirect: currentSearchParamsHook.get("redirect") || "/",
    searchParams: currentSearchParamsHook,
    fetchAllUsers,
    updateUserApproval,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}