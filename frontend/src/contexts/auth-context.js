// src/contexts/auth-context.js
"use client";

import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
const SESSION_TIMEOUT_DURATION = 500 * 1000; // 500 seconds in milliseconds

const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const ROLES = {
  head_admin: 'head_admin',
  student: 'student',
  manager: 'manager',
  partner: 'partner',
  reviewer: 'reviewer',
};

const AuthContext = createContext(undefined);

let sessionTimeoutId;
let gsiClientInitialized = false;

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParamsHook = useSearchParams();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // For Google Sign-In promise management
  const currentGoogleSignInPromiseActions = useRef(null);

  // Helper function to show user-friendly error messages
  const showErrorToast = useCallback((title, description, variant = "destructive") => {
    toast({
      title,
      description,
      variant,
      duration: 5000,
    });
  }, [toast]);

  // Helper function to show success messages
  const showSuccessToast = useCallback((title, description) => {
    toast({
      title,
      description,
      variant: "default",
      duration: 4000,
    });
  }, [toast]);

  // Helper function to handle different error types
  const handleAuthError = useCallback((error, context = "Authentication") => {
    let title = `${context} Error`;
    let description = "An unexpected error occurred. Please try again.";

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 403:
          if (message && message.toLowerCase().includes("pending approval")) {
            title = "Account Pending Approval";
            description = "Your account is currently pending approval. Please contact an administrator to activate your account.";
          } else if (message && message.toLowerCase().includes("not approved")) {
            title = "Account Not Approved";
            description = "Your account has not been approved yet. Please contact an administrator for assistance.";
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

    showErrorToast(title, description);
    return { title, description };
  }, [showErrorToast]);

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
            case ROLES.head_admin:
            case ROLES.manager:
              targetPath = "/admin-dashboard";
              break;
            case ROLES.student:
            case ROLES.partner:
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

  let commonSignOutLogicWithDependencies;

  const resetSessionTimeout = useCallback(() => {
    if (typeof window === "undefined") return;
    clearTimeout(sessionTimeoutId);
    if (user) {
      sessionTimeoutId = setTimeout(() => {
        console.log(`Session timed out due to inactivity (${SESSION_TIMEOUT_DURATION / 1000} seconds).`);
        if (commonSignOutLogicWithDependencies) {
          commonSignOutLogicWithDependencies(true, `/sign-in?reason=session_timeout_activity&redirect=${encodeURIComponent(pathname)}`);
        }
      }, SESSION_TIMEOUT_DURATION);
    }
  }, [user, pathname]);


  commonSignOutLogicWithDependencies = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      console.log("AuthContext: Signing out. Redirect:", redirect, "Path:", redirectPath);
      setIsLoading(true);
      clearTimeout(sessionTimeoutId);
      try {
        // Optional: await internalApi.post("/auth/logout");
      } catch (error) {
        // console.error("AuthProvider [signOut]: Error during backend logout:", error);
      } finally {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cedo_user");
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";

          if (window.google && window.google.accounts && window.google.accounts.id) {
            window.google.accounts.id.cancel();
            console.log("AuthContext (SignOut): Called google.accounts.id.cancel()");
          }

          console.log("AuthContext (SignOut): currentGoogleSignInPromiseActions.current BEFORE clear:", currentGoogleSignInPromiseActions.current);
          if (currentGoogleSignInPromiseActions.current) {
            console.warn("AuthContext (SignOut): Clearing an outstanding Google Sign-In promise reference.");
            currentGoogleSignInPromiseActions.current = null;
          }
          console.log("AuthContext (SignOut): currentGoogleSignInPromiseActions.current AFTER clear:", currentGoogleSignInPromiseActions.current);
        }
        delete internalApi.defaults.headers.common["Authorization"];
        setUser(null);
        console.log("AuthContext (SignOut): User set to null.");
        if (redirect) {
          if (pathname !== redirectPath) {
            router.replace(redirectPath);
          } else if (redirectPath === "/sign-in" && pathname === "/sign-in") {
            // Avoid loop if already on sign-in
          } else {
            router.replace(redirectPath);
          }
        }
        setIsLoading(false);
      }
    },
    [router, pathname],
  );


  const signOut = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      let effectiveRedirectPath = redirectPath;
      if (redirectPath === "/sign-in" && pathname !== "/sign-in" && pathname !== "/") {
        effectiveRedirectPath = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
      }
      await commonSignOutLogicWithDependencies(redirect, effectiveRedirectPath);
    },
    [commonSignOutLogicWithDependencies, pathname]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !user) {
      if (typeof window !== "undefined") { // Ensure window exists before removing listeners
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
      internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
      setIsLoading(false);
      performRedirect(userData);
      return userData;
    },
    [performRedirect],
  );

  const verifyCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      let token = null;
      if (typeof document !== "undefined") {
        const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
        if (cookieValue) token = cookieValue.split("=")[1];
      }

      if (token) {
        internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const storedUser = localStorage.getItem("cedo_user");
        let currentUserData = null;
        if (storedUser) {
          currentUserData = JSON.parse(storedUser);
        } else {
          const { data: meData } = await internalApi.get("/auth/me");
          if (meData && meData.user) {
            currentUserData = meData.user;
            localStorage.setItem("cedo_user", JSON.stringify(meData.user));
          } else {
            throw new Error("No user data from /auth/me despite having a token.");
          }
        }
        setUser(currentUserData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Only show error toasts for non-authentication related errors
      // Token expiration and invalid tokens are normal and shouldn't show error messages
      if (process.env.NODE_ENV === 'development') {
        console.warn("AuthContext [verifyCurrentUser]: Error verifying current user or token invalid.", error.message);
      }

      // Don't show error toast for normal token expiration/invalid token scenarios
      // These are expected behaviors when tokens expire or are invalid

      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
      }
      delete internalApi.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      verifyCurrentUser();
    }
  }, [isInitialized, verifyCurrentUser]);


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
        // Use the new error handling system
        const errorInfo = handleAuthError(error, "Sign-In");

        // Only log to console in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error("AuthContext: Sign-In Error Details:", error);
        }

        await commonSignOutLogicWithDependencies(false);
        setIsLoading(false);
        throw new Error(errorInfo.description);
      }
    },
    [commonSignInSuccess, commonSignOutLogicWithDependencies, handleAuthError, showSuccessToast],
  );

  const loadGoogleScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        resolve(); return;
      }
      if (typeof document === "undefined") {
        reject(new Error("Cannot load Google script in a non-browser environment.")); return;
      }
      const scriptId = "google-identity-services-script";
      let script = document.getElementById(scriptId);

      if (script && script.getAttribute('data-loaded') === 'true') {
        if (window.google?.accounts?.id) resolve();
        else reject(new Error("Google script tag present and marked loaded, but API not available."));
        return;
      }

      if (script && !script.getAttribute('data-loaded')) {
        const onExistingScriptLoad = () => {
          script.setAttribute('data-loaded', 'true');
          if (window.google?.accounts?.id) resolve();
          else reject(new Error("Existing Google script loaded but API (window.google.accounts.id) not available."));
          script.removeEventListener("load", onExistingScriptLoad);
          script.removeEventListener("error", onExistingScriptError);
        };
        const onExistingScriptError = (e) => {
          script.setAttribute('data-loaded', 'failed');
          reject(new Error("Failed to load existing Google script: " + e.message));
          script.removeEventListener("load", onExistingScriptLoad);
          script.removeEventListener("error", onExistingScriptError);
        };
        script.addEventListener("load", onExistingScriptLoad);
        script.addEventListener("error", onExistingScriptError);
        return;
      }

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          if (window.google?.accounts?.id) resolve();
          else reject(new Error("Google script loaded but google.accounts.id not available."));
        };
        script.onerror = (e) => {
          script.setAttribute('data-loaded', 'failed');
          reject(new Error("Failed to load Google Identity Services script: " + e.message));
        };
        document.head.appendChild(script);
      }
    });
  }, []);

  // Corrected handleGoogleCredentialResponse (similar to your original full version)
  const handleGoogleCredentialResponse = useCallback(
    async (googleResponse) => {
      const promiseActions = currentGoogleSignInPromiseActions.current;
      if (!promiseActions) {
        console.warn("AuthContext: Google credential response received, but no active promise was waiting for it.");
        return;
      }

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
          promiseActions.resolve(userDataFromBackend);
        } else {
          throw new Error("Google Sign-In failed: No valid token or user data received from backend server.");
        }
      } catch (error) {
        // Use the new error handling system instead of console.error
        const errorInfo = handleAuthError(error, "Google Sign-In");

        // Only log to console in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error("AuthContext: Google Sign-In Error Details:", error);
        }

        promiseActions.reject(new Error(errorInfo.description));
      } finally {
        console.log("AuthContext (handleGoogleCredentialResponse): Clearing currentGoogleSignInPromiseActions.current. Old value:", currentGoogleSignInPromiseActions.current);
        currentGoogleSignInPromiseActions.current = null;
        console.log("AuthContext (handleGoogleCredentialResponse): currentGoogleSignInPromiseActions.current is now null.");
      }
    },
    [commonSignInSuccess, handleAuthError, showSuccessToast]
  );

  const signInWithGoogleAuth = useCallback(async (elementIdToRenderButtonIn, buttonOptions = {}) => {
    console.log("AuthContext: signInWithGoogleAuth CALLED. Checking lock...");
    return new Promise(async (resolveOuter, rejectOuter) => {
      if (currentGoogleSignInPromiseActions.current) {
        console.warn("AuthContext: Another Google Sign-In operation is already in progress. Please wait.");
        return;
      }

      console.log("AuthContext: LOCK ACQUIRED. Setting currentGoogleSignInPromiseActions.current.");
      currentGoogleSignInPromiseActions.current = { resolve: resolveOuter, reject: rejectOuter, initiatedAt: new Date().toISOString() };

      try {
        console.log("AuthContext: signInWithGoogleAuth - Attempting to load Google script...");
        await loadGoogleScript();
        console.log("AuthContext: signInWithGoogleAuth - Google script loaded. Checking Client ID...");
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error("AuthContext: signInWithGoogleAuth - Google Client ID is not configured.");
          throw new Error("Google Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID) is not configured in environment variables.");
        }
        console.log("AuthContext: signInWithGoogleAuth - Client ID found. Initializing GSI if needed...");

        if (!gsiClientInitialized) {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            console.log("AuthContext: signInWithGoogleAuth - Initializing google.accounts.id...");
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse,
              auto_select: false,
            });
            gsiClientInitialized = true;
            console.log("AuthContext: signInWithGoogleAuth - GSI initialized.");
          } else {
            console.error("AuthContext: signInWithGoogleAuth - Google GSI script not fully available for initialization after loading.");
            throw new Error("Google GSI script not fully available for initialization after loading.");
          }
        } else {
          console.log("AuthContext: signInWithGoogleAuth - GSI already initialized.");
        }

        console.log(`AuthContext: signInWithGoogleAuth - Attempting to render button in element: ${elementIdToRenderButtonIn}`);
        const buttonDiv = document.getElementById(elementIdToRenderButtonIn);
        if (buttonDiv) {
          buttonDiv.innerHTML = '';
          const defaultRenderOptions = {
            theme: "outline", size: "large", type: "standard", text: "signin_with",
          };
          const mergedOptions = { ...defaultRenderOptions, ...buttonOptions };
          window.google.accounts.id.renderButton(buttonDiv, mergedOptions);
          console.log(`AuthContext: signInWithGoogleAuth - Google button rendered in ${elementIdToRenderButtonIn}. Waiting for callback...`);
        } else {
          let errorMsg = `Google Sign-In Button Error: HTML element with ID '${elementIdToRenderButtonIn}' was not found in the DOM.`;
          if (!elementIdToRenderButtonIn) {
            errorMsg = `Google Sign-In Button Error: The 'elementIdToRenderButtonIn' parameter was not provided or was invalid. Cannot render button.`;
          }
          console.error(`AuthContext: signInWithGoogleAuth - ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("AuthContext: ERROR in signInWithGoogleAuth setup phase. Error message:", error.message, "Stack:", error.stack);
        const promiseActionsForThisAttempt = currentGoogleSignInPromiseActions.current;
        if (promiseActionsForThisAttempt && promiseActionsForThisAttempt.reject === rejectOuter) {
          console.log("AuthContext: signInWithGoogleAuth catch - Rejecting promise for this attempt.");
          promiseActionsForThisAttempt.reject(error);
        } else if (promiseActionsForThisAttempt) {
          console.warn("AuthContext: signInWithGoogleAuth catch - Mismatch in promise actions. Current promiseActions' initiatedAt:", promiseActionsForThisAttempt.initiatedAt);
          rejectOuter(error);
        } else {
          console.warn("AuthContext: signInWithGoogleAuth catch - No promise actions found. The promise might have been cleared.");
          rejectOuter(error);
        }
        console.log("AuthContext: signInWithGoogleAuth catch - Releasing LOCK by setting currentGoogleSignInPromiseActions.current to null. Old value:", currentGoogleSignInPromiseActions.current);
        currentGoogleSignInPromiseActions.current = null;
        console.log("AuthContext: signInWithGoogleAuth catch - LOCK RELEASED. currentGoogleSignInPromiseActions.current is now null.");
      }
    });
  }, [loadGoogleScript, handleGoogleCredentialResponse]);

  // --- New functions for User Management API calls ---
  const fetchAllUsers = useCallback(async () => {
    if (!user || user.role !== ROLES.head_admin) {
      const errorMsg = "Unauthorized to fetch users.";
      showErrorToast("Access Denied", "You don't have permission to view user data.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log("AuthContext: Fetching all users...");
      const response = await internalApi.get("/users");
      return response.data;
    } catch (error) {
      // Use the new error handling system
      const errorInfo = handleAuthError(error, "User Data Fetch");

      // Only log to console in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error("AuthContext: Error in fetchAllUsers:", error);
      }

      throw error;
    }
  }, [user, handleAuthError, showErrorToast]);

  const updateUserApproval = useCallback(async (userIdToUpdate, newApprovalStatus) => {
    if (!user || user.role !== ROLES.head_admin) {
      const errorMsg = "Unauthorized to update user approval.";
      showErrorToast("Access Denied", "You don't have permission to update user approval status.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log(`AuthContext: Updating approval for user ${userIdToUpdate} to ${newApprovalStatus}`);
      const response = await internalApi.put(`/users/${userIdToUpdate}/approval`, { is_approved: newApprovalStatus });

      // Show success message
      const statusText = newApprovalStatus ? "approved" : "revoked";
      showSuccessToast("User Updated", `User approval status has been ${statusText} successfully.`);

      return response.data;
    } catch (error) {
      // Use the new error handling system
      const errorInfo = handleAuthError(error, "User Approval Update");

      // Only log to console in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error("AuthContext: Error in updateUserApproval:", error);
      }

      throw error;
    }
  }, [user, handleAuthError, showErrorToast, showSuccessToast]);
  // --- End of new functions ---

  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
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