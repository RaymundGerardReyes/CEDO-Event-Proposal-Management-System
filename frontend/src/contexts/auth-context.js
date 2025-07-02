// src/contexts/auth-context.js
"use client";

import { useToast } from "@/components/ui/use-toast";
import { config } from "@/lib/utils";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_URL = config.apiUrl;

// Session timeout: SESSION_TIMEOUT_MINUTES guaranteed > 0 by next.config.js
// Read from .env as SESSION_TIMEOUT_MINUTES=30, mapped via next.config.js
const SESSION_TIMEOUT_DURATION = config.sessionTimeoutMinutes * 60 * 1000;

const internalApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const ROLES = {
  HEAD_ADMIN: 'head_admin',
  MANAGER: 'manager',
  STUDENT: 'student',
  PARTNER: 'partner',
  REVIEWER: 'reviewer',
};

const AuthContext = createContext(null);

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
      const reason = error.response?.data?.reason;

      switch (status) {
        case 403:
          if (reason === "USER_NOT_APPROVED" || (message && message.toLowerCase().includes("pending approval"))) {
            title = "Account Pending Approval";
            description = "Your account is currently pending approval. Please contact an administrator to activate your account.";
            // Don't show toast for pending approval - let the calling component handle it
            return { title, description, skipToast: true };
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

    // Only show toast if not explicitly skipped
    const errorInfo = { title, description };
    if (!errorInfo.skipToast) {
      showErrorToast(title, description);
    }

    return errorInfo;
  }, [showErrorToast]);

  const performRedirect = useCallback(
    (loggedInUser) => {
      console.log("🔄 performRedirect called with user:", JSON.stringify(loggedInUser, null, 2));
      console.log("🔄 Current pathname:", pathname);

      const currentRedirectParam = currentSearchParamsHook.get("redirect");
      console.log("🔄 Redirect param from URL:", currentRedirectParam);

      if (!loggedInUser || !loggedInUser.role) {
        console.log("❌ No user or role found, redirecting to sign-in");
        if (pathname !== "/sign-in") router.replace("/sign-in");
        return;
      }

      console.log("✅ User role detected:", loggedInUser.role);
      console.log("✅ User dashboard from JWT:", loggedInUser.dashboard);

      // 🔧 SMART REDIRECT LOGIC - Check if user is already in a valid area
      const isValidStudentArea = pathname.startsWith("/student-dashboard");
      const isValidAdminArea = pathname.startsWith("/admin-dashboard");
      const isAuthRoute = ["/sign-in", "/signup", "/login", "/sign-up"].includes(pathname);
      const isRootPath = pathname === "/";

      // Define role-based access validation
      const hasValidAccess = () => {
        switch (loggedInUser.role) {
          case ROLES.HEAD_ADMIN:
          case ROLES.MANAGER:
            return isValidAdminArea || isRootPath || isAuthRoute;
          case ROLES.STUDENT:
          case ROLES.PARTNER:
          case ROLES.REVIEWER:
            return isValidStudentArea || isRootPath || isAuthRoute;
          default:
            return false;
        }
      };

      // Only redirect if necessary
      let shouldRedirect = false;
      let targetPath = pathname;

      if (currentRedirectParam && currentRedirectParam !== pathname) {
        // Honor explicit redirect parameter
        targetPath = currentRedirectParam;
        shouldRedirect = true;
        console.log("🎯 Using redirect param:", targetPath);
      } else if (isAuthRoute) {
        // Redirect away from auth routes when authenticated
        shouldRedirect = true;
        targetPath = loggedInUser.dashboard || getDefaultDashboardForRole(loggedInUser.role);
        console.log("🚀 Redirecting away from auth route to:", targetPath);
      } else if (isRootPath) {
        // Redirect from root to appropriate dashboard
        shouldRedirect = true;
        targetPath = loggedInUser.dashboard || getDefaultDashboardForRole(loggedInUser.role);
        console.log("🚀 Redirecting from root to:", targetPath);
      } else if (!hasValidAccess()) {
        // User is in an area they don't have access to
        shouldRedirect = true;
        targetPath = loggedInUser.dashboard || getDefaultDashboardForRole(loggedInUser.role);
        console.log("🚀 Access denied, redirecting to:", targetPath);
      } else {
        // User is already in a valid area, don't redirect
        console.log("✅ User is already in valid area, no redirect needed:", pathname);
      }

      console.log("🎯 Final target path:", targetPath);
      console.log("🎯 Should redirect:", shouldRedirect);

      if (shouldRedirect && pathname !== targetPath) {
        console.log("🚀 Redirecting from", pathname, "to", targetPath);
        router.replace(targetPath);
      } else {
        console.log("✅ Staying on current path:", pathname);
      }
    },
    [router, currentSearchParamsHook, pathname],
  );

  // Helper function to get default dashboard for role
  const getDefaultDashboardForRole = (role) => {
    switch (role) {
      case ROLES.HEAD_ADMIN:
      case ROLES.MANAGER:
        return "/admin-dashboard";
      case ROLES.STUDENT:
      case ROLES.PARTNER:
      case ROLES.REVIEWER:
        return "/student-dashboard";
      default:
        return "/";
    }
  };

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
      console.log("🚪 AuthContext: Starting sign-out process. Redirect:", redirect, "Path:", redirectPath);
      setIsLoading(true);
      clearTimeout(sessionTimeoutId);

      try {
        // Call backend logout to clear server-side cookie
        await internalApi.post("/auth/logout");
        console.log("✅ AuthContext: Backend logout successful");
      } catch (error) {
        console.error("❌ AuthProvider [signOut]: Error during backend logout:", error);
      } finally {
        if (typeof window !== "undefined") {
          // Clear localStorage and cookies
          localStorage.removeItem("cedo_user");
          document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
          console.log("🧹 AuthContext: Cleared localStorage and cookies");

          // Cancel Google Sign-In and clean up Google state
          if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
              window.google.accounts.id.cancel();
              console.log("✅ AuthContext (SignOut): Called google.accounts.id.cancel()");
            } catch (googleCancelError) {
              console.warn("⚠️ AuthContext (SignOut): Error canceling Google Sign-In:", googleCancelError);
            }
          }

          // Clear any outstanding Google Sign-In promises
          console.log("🔍 AuthContext (SignOut): currentGoogleSignInPromiseActions.current BEFORE clear:", currentGoogleSignInPromiseActions.current);
          if (currentGoogleSignInPromiseActions.current) {
            console.warn("🧹 AuthContext (SignOut): Clearing an outstanding Google Sign-In promise reference.");
            try {
              // If there's an active promise, reject it cleanly
              if (currentGoogleSignInPromiseActions.current.reject) {
                currentGoogleSignInPromiseActions.current.reject(new Error("Sign-out interrupted Google Sign-In operation"));
              }
            } catch (promiseError) {
              console.warn("⚠️ AuthContext (SignOut): Error rejecting Google promise:", promiseError);
            }
            currentGoogleSignInPromiseActions.current = null;
          }
          console.log("✅ AuthContext (SignOut): currentGoogleSignInPromiseActions.current AFTER clear:", currentGoogleSignInPromiseActions.current);

          // Reset GSI client initialization flag to force re-initialization
          gsiClientInitialized = false;
          console.log("🔄 AuthContext (SignOut): Reset gsiClientInitialized flag");

          // Add a delay flag to prevent immediate re-initialization
          window.__cedoGoogleSignOutTimestamp = Date.now();
          console.log("⏰ AuthContext (SignOut): Set sign-out timestamp for delay mechanism");

          // Clean up any remaining Google button containers
          try {
            const googleContainers = document.querySelectorAll('[id*="google"], [data-google-signin-container="true"]');
            googleContainers.forEach(container => {
              if (container && container.parentNode && document.body.contains(container)) {
                const googleButtons = container.querySelectorAll('.g_id_signin, .g-signin2, [data-client_id]');
                googleButtons.forEach(button => {
                  if (button.parentNode === container) {
                    container.removeChild(button);
                  }
                });
              }
            });
            console.log("🧹 AuthContext (SignOut): Cleaned up Google button containers");
          } catch (cleanupError) {
            console.warn("⚠️ AuthContext (SignOut): Error during Google button cleanup:", cleanupError);
          }
        }

        // Clear API authorization header
        delete internalApi.defaults.headers.common["Authorization"];
        console.log("🧹 AuthContext: Cleared API authorization header");

        // Set user to null
        setUser(null);
        console.log("✅ AuthContext (SignOut): User set to null.");

        // Handle redirect
        if (redirect) {
          if (pathname !== redirectPath) {
            console.log(`🚀 AuthContext: Redirecting from ${pathname} to ${redirectPath}`);
            router.replace(redirectPath);
          } else if (redirectPath === "/sign-in" && pathname === "/sign-in") {
            console.log("✅ AuthContext: Already on sign-in page, no redirect needed");
            // Avoid loop if already on sign-in
          } else {
            console.log(`🚀 AuthContext: Force redirecting to ${redirectPath}`);
            router.replace(redirectPath);
          }
        }

        setIsLoading(false);
        console.log("✅ AuthContext: Sign-out process completed");
      }
    },
    [router, pathname],
  );


  const signOut = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      await commonSignOutLogicWithDependencies(redirect, redirectPath);
    },
    [commonSignOutLogicWithDependencies]
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
    console.log("🔍 verifyCurrentUser: Starting user verification...");
    setIsLoading(true);
    try {
      let token = null;
      if (typeof document !== "undefined") {
        const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
        if (cookieValue) token = cookieValue.split("=")[1];
      }

      console.log("🔍 verifyCurrentUser: Token found:", token ? "Yes" : "No");

      if (token) {
        internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const storedUser = localStorage.getItem("cedo_user");
        console.log("🔍 verifyCurrentUser: Stored user in localStorage:", storedUser ? "Yes" : "No");

        let currentUserData = null;
        if (storedUser) {
          currentUserData = JSON.parse(storedUser);
          console.log("🔍 verifyCurrentUser: Using cached user data:", JSON.stringify(currentUserData, null, 2));
        } else {
          console.log("🔍 verifyCurrentUser: Fetching user data from /auth/me...");
          const { data: meData } = await internalApi.get("/auth/me");
          if (meData && meData.user) {
            currentUserData = meData.user;
            localStorage.setItem("cedo_user", JSON.stringify(meData.user));
            console.log("🔍 verifyCurrentUser: Fresh user data from API:", JSON.stringify(currentUserData, null, 2));
          } else {
            throw new Error("No user data from /auth/me despite having a token.");
          }
        }

        console.log("✅ verifyCurrentUser: Setting user data with role:", currentUserData?.role);
        setUser(currentUserData);

        // CRITICAL FIX: Call performRedirect for existing authenticated users
        console.log("🚀 verifyCurrentUser: Calling performRedirect for authenticated user");
        performRedirect(currentUserData);
      } else {
        console.log("❌ verifyCurrentUser: No token found, setting user to null");
        setUser(null);
      }
    } catch (error) {
      // Only show error toasts for non-authentication related errors
      // Token expiration and invalid tokens are normal and shouldn't show error messages
      console.error("🔍 verifyCurrentUser: Error during verification:", error.message);
      if (process.env.NODE_ENV === 'development') {
        console.warn("AuthContext [verifyCurrentUser]: Error verifying current user or token invalid.", error.message);
      }

      // Don't show error toast for normal token expiration/invalid token scenarios
      // These are expected behaviors when tokens expire or are invalid

      console.log("🧹 verifyCurrentUser: Cleaning up localStorage and cookies due to error");
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
        // Special handling for 403 pending approval errors
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          const message = error.response?.data?.message;
          const reason = error.response?.data?.reason;

          // More robust detection of pending approval errors
          if (reason === "USER_NOT_APPROVED" ||
            (message && (
              message.toLowerCase().includes("pending approval") ||
              message.toLowerCase().includes("account pending") ||
              message.toLowerCase().includes("not approved")
            ))) {
            // For pending approval, don't show toast - let the sign-in page handle it with the error dialog
            const pendingApprovalError = new Error("Your account is currently pending approval. Please contact an administrator to activate your account.");
            pendingApprovalError.isPendingApproval = true;
            pendingApprovalError.allowRetry = true; // Allow button to be re-rendered
            promiseActions.reject(pendingApprovalError);
            return;
          }
        }

        // Check for account not found errors (404 or specific messages)
        if (axios.isAxiosError(error) &&
          (error.response?.status === 404 ||
            (error.response?.data?.message &&
              error.response.data.message.toLowerCase().includes("account not found")))) {
          const accountNotFoundError = new Error("Account not found. Please contact an administrator to create your account first.");
          accountNotFoundError.isAccountNotFound = true;
          accountNotFoundError.allowRetry = true; // Allow button to be re-rendered
          promiseActions.reject(accountNotFoundError);
          return;
        }

        // For all other errors, use the existing error handling system
        const errorInfo = handleAuthError(error, "Google Sign-In");
        const generalError = new Error(errorInfo.description);
        generalError.allowRetry = true; // Allow button to be re-rendered for most errors

        promiseActions.reject(generalError);
      } finally {
        console.log("AuthContext (handleGoogleCredentialResponse): Clearing currentGoogleSignInPromiseActions.current. Old value:", currentGoogleSignInPromiseActions.current);
        currentGoogleSignInPromiseActions.current = null;
        console.log("AuthContext (handleGoogleCredentialResponse): currentGoogleSignInPromiseActions.current is now null.");
      }
    },
    [commonSignInSuccess, handleAuthError, showSuccessToast]
  );

  const signInWithGoogleAuth = useCallback(async (buttonContainerElement, buttonOptions = {}) => {
    console.log("🚀 AuthContext: signInWithGoogleAuth CALLED. Attempting to acquire lock...");
    return new Promise(async (resolveOuter, rejectOuter) => {
      // Check if we recently signed out and should wait
      if (typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp) {
        const timeSinceSignOut = Date.now() - window.__cedoGoogleSignOutTimestamp;
        if (timeSinceSignOut < 3000) { // Wait 3 seconds after sign-out
          const remainingDelay = 3000 - timeSinceSignOut;
          console.log(`⏳ AuthContext: Recent sign-out detected, waiting ${remainingDelay}ms before Google Sign-In initialization`);
          const delayError = new Error("Google Sign-In is initializing. Please wait a moment and try again.");
          delayError.isDelay = true;
          delayError.allowRetry = true;
          rejectOuter(delayError);
          return;
        } else {
          // Clear the timestamp if enough time has passed
          delete window.__cedoGoogleSignOutTimestamp;
          console.log("✅ AuthContext: Sign-out delay period completed, proceeding with Google Sign-In");
        }
      }

      if (currentGoogleSignInPromiseActions.current) {
        const errMessage = "AuthContext: Another Google Sign-In operation is already in progress. Please wait.";
        console.warn("⚠️", errMessage);
        rejectOuter(new Error(errMessage)); // Ensure this outer promise is rejected
        return;
      }

      console.log("AuthContext: Lock acquired. Setting currentGoogleSignInPromiseActions.current.");
      currentGoogleSignInPromiseActions.current = { resolve: resolveOuter, reject: rejectOuter, initiatedAt: new Date().toISOString() };

      try {
        console.log("AuthContext: signInWithGoogleAuth - Attempting to load Google script...");
        await loadGoogleScript();
        console.log("AuthContext: signInWithGoogleAuth - Google script loaded. Checking Client ID...");
        const clientId = config.googleClientId;
        if (!clientId) {
          console.error("AuthContext: signInWithGoogleAuth - Google Client ID is not configured.");
          throw new Error("Google Client ID (GOOGLE_CLIENT_ID) is not configured in environment variables.");
        }
        console.log("AuthContext: signInWithGoogleAuth - Client ID found. Initializing GSI if needed...");

        if (!gsiClientInitialized) {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            console.log("AuthContext: signInWithGoogleAuth - Initializing google.accounts.id...");
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse, // This callback will use the resolveOuter/rejectOuter from currentGoogleSignInPromiseActions
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

        console.log("AuthContext: signInWithGoogleAuth - Attempting to render button in element: ", buttonContainerElement);
        const buttonDiv = buttonContainerElement;

        // CRITICAL CHECK: Ensure the buttonDiv is a valid, attached DOM element before calling renderButton
        if (buttonDiv && typeof buttonDiv.appendChild === 'function' && document.body.contains(buttonDiv)) {
          const defaultRenderOptions = {
            theme: "outline", size: "large", type: "standard", text: "signin_with",
          };
          const mergedOptions = { ...defaultRenderOptions, ...buttonOptions };

          try {
            // Clear any existing Google button content first to ensure clean render
            const existingGoogleButtons = buttonDiv.querySelectorAll('.g_id_signin, .g-signin2, [data-client_id]');
            existingGoogleButtons.forEach(button => {
              if (button.parentNode === buttonDiv) {
                buttonDiv.removeChild(button);
              }
            });

            await new Promise(resolve => setTimeout(resolve, 200)); // Delay for DOM stability
            console.log("AuthContext: Pre-renderButton check. buttonDiv:", buttonDiv, "Parent:", buttonDiv.parentNode);
            window.google.accounts.id.renderButton(buttonDiv, mergedOptions);
            console.log(`AuthContext: signInWithGoogleAuth - Google button render initiated in ${buttonContainerElement}. Waiting for GSI callback...`);
          } catch (renderError) {
            console.error("AuthContext: Error during window.google.accounts.id.renderButton:", renderError.message, renderError);
            currentGoogleSignInPromiseActions.current = null; // Release lock
            const buttonRenderError = new Error(`Failed to render Google Sign-In button: ${renderError.message}`);
            buttonRenderError.allowRetry = true; // Allow retry for render errors
            rejectOuter(buttonRenderError);
          }
        } else {
          let errorMsg = "Google Sign-In Button Error: The provided button container element is invalid, not a function, or not attached to the DOM right before rendering.";
          if (!buttonDiv) {
            errorMsg = "Google Sign-In Button Error: The 'buttonContainerElement' was null or undefined when attempting to render.";
          } else if (typeof buttonDiv.appendChild !== 'function') {
            errorMsg = `Google Sign-In Button Error: The provided button container element is not a valid DOM element (appendChild not a function). Type: ${typeof buttonDiv}`;
          } else if (!document.body.contains(buttonDiv)) {
            errorMsg = "Google Sign-In Button Error: The provided button container element is not attached to the document body.";
          }
          console.error(`AuthContext: signInWithGoogleAuth - ${errorMsg}`, buttonDiv);
          currentGoogleSignInPromiseActions.current = null; // Release lock
          const containerError = new Error(errorMsg);
          containerError.allowRetry = true; // Allow retry for container errors
          rejectOuter(containerError);
        }
      } catch (error) { // Catches errors from loadGoogleScript, GSI init, client ID checks, etc.
        console.error("AuthContext: ERROR in signInWithGoogleAuth setup phase (before renderButton call). Error message:", error.message, "Stack:", error.stack);
        currentGoogleSignInPromiseActions.current = null; // Release lock
        error.allowRetry = true; // Allow retry for most setup errors
        rejectOuter(error); // Reject the promise for this specific call
      }
      // If try block completes successfully (renderButton called), lock remains.
      // It's released by handleGoogleCredentialResponse or if renderButton itself fails.
    });
  }, [loadGoogleScript, handleGoogleCredentialResponse]);

  // --- New functions for User Management API calls ---
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
    if (!user || user.role !== ROLES.HEAD_ADMIN) {
      const errorMsg = "Unauthorized to update user approval.";
      showErrorToast("Access Denied", "You don't have permission to update user approval status.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log(`AuthContext: Updating approval for user ${userIdToUpdate} to ${newApprovalStatus}`);

      // Ensure the payload is correct
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

  const clearAuthCache = useCallback(async () => {
    console.log("🧹 clearAuthCache: Clearing all authentication cache...");
    setIsLoading(true);

    try {
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        console.log("🧹 clearAuthCache: Removed cedo_user from localStorage");

        // Clear cookies
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        console.log("🧹 clearAuthCache: Cleared cedo_token cookie");
      }

      // Clear API header
      delete internalApi.defaults.headers.common["Authorization"];
      console.log("🧹 clearAuthCache: Cleared Authorization header");

      // Reset user state
      setUser(null);
      console.log("🧹 clearAuthCache: Reset user state to null");

      // Force re-verification
      await verifyCurrentUser();
      console.log("🧹 clearAuthCache: Re-verification completed");

    } catch (error) {
      console.error("🧹 clearAuthCache: Error during cache clear:", error);
      setUser(null);
      setIsLoading(false);
    }
  }, [verifyCurrentUser]);

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
    clearAuthCache,
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