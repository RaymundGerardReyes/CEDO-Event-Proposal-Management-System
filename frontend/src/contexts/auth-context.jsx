// src/contexts/auth-context.js
"use client";

import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ✅ ENHANCED: Better environment variable handling
const getEnvironmentConfig = () => {
  const config = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000",
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV || "development"
  };

  console.log("🔧 AuthContext: Environment config loaded:", {
    API_URL: config.API_URL,
    BACKEND_URL: config.BACKEND_URL,
    hasGoogleClientId: !!config.GOOGLE_CLIENT_ID,
    NODE_ENV: config.NODE_ENV
  });

  return config;
};

// --- SESSION TIMEOUT DURATION ---
// Use env var (ms), fallback to 30 min
export const SESSION_TIMEOUT_DURATION =
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SESSION_TIMEOUT_DURATION
    ? parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_DURATION, 10)
    : 30 * 60 * 1000);

// Dependency injection for testability
let _internalApi = null;
let _baseURL = null;

function getInternalApi() {
  // ✅ ENHANCED: Use environment config
  const envConfig = getEnvironmentConfig();
  const baseURL = _baseURL || envConfig.API_URL;
  console.log("🔧 AuthContext: Creating API client with baseURL:", baseURL);

  if (
    !_internalApi ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
    (_internalApi && _internalApi.defaults && _internalApi.defaults.baseURL !== baseURL)
  ) {
    console.log("🔄 AuthContext: Creating new axios instance");
    _internalApi = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Add request interceptor for debugging
    _internalApi.interceptors.request.use(
      (config) => {
        // ✅ FIX: Ensure auth endpoints use the correct path
        if (config.url && config.url.startsWith('/auth/') && !config.url.startsWith('/api/auth/')) {
          config.url = config.url.replace('/auth/', '/api/auth/');
          console.log("🔧 AuthContext: Fixed auth endpoint URL:", config.url);
        }

        console.log("📤 AuthContext: API Request:", {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
          hasAuth: !!config.headers?.Authorization
        });
        return config;
      },
      (error) => {
        console.error("❌ AuthContext: API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    _internalApi.interceptors.response.use(
      (response) => {
        console.log("📥 AuthContext: API Response:", {
          status: response.status,
          url: response.config.url,
          hasData: !!response.data
        });
        return response;
      },
      (error) => {
        // Only log unexpected errors, not authentication failures
        const isExpectedError =
          error.response?.status === 401 || // Invalid credentials - expected
          error.response?.status === 403 || // Forbidden - expected
          error.response?.status === 400;   // Bad request - expected

        if (!isExpectedError) {
          console.error("❌ AuthContext: Unexpected API Error:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            url: error.config?.url,
            method: error.config?.method
          });
        } else {
          // Log authentication errors quietly - these are expected user errors
          if (typeof window !== 'undefined' && window.console && window.console.debug) {
            window.console.debug("🔐 AuthContext: Authentication response:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              url: error.config?.url
            });
          }
        }

        // ✅ ENHANCED: Specific handling for Google email verification errors
        if (error.response?.status === 403 && error.response?.data?.reason === 'GOOGLE_EMAIL_NOT_VERIFIED') {
          console.warn("📧 AuthContext: Google email verification required");
          // This will be handled by the calling function to show user-friendly message
        }

        // Additional context for network errors
        if (error.code === "NETWORK_ERROR" || error.message.includes("Network Error")) {
          console.error("🌐 AuthContext: Network error detected - check backend connectivity");
        }

        // Additional context for timeout errors
        if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
          console.error("⏰ AuthContext: Request timeout - backend may be slow or unresponsive");
        }

        // ✅ REDUCED: Only log full error details for unexpected errors
        if (process.env.NODE_ENV === 'development') {
          // Don't log full details for expected errors (401, 403 auth errors)
          const isExpectedError = error.response?.status === 401 ||
            error.response?.status === 403 ||
            error.response?.status === 400;

          if (!isExpectedError) {
            console.error("🔍 AuthContext: Full error details:", error);
          } else {
            console.log("🔍 AuthContext: Expected error:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              reason: error.response?.data?.reason
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  return _internalApi;
}

// For test injection
export function _setInternalApiForTests(mockApi, baseURL) {
  _internalApi = mockApi;
  _baseURL = baseURL;
}

// Simple error handler without health checks
export async function handleAuthError(error, context = "Authentication") {
  console.error(`❌ ${context} Error:`, error);
  return error;
}

export const ROLES = {
  HEAD_ADMIN: 'head_admin',
  MANAGER: 'manager',
  STUDENT: 'student',
  PARTNER: 'partner',
  REVIEWER: 'reviewer',
};

const AuthContext = createContext(undefined); // Use undefined for strict provider check

// REMOVE global sessionTimeoutId; use sessionTimeoutIdRef in provider and helpers
let gsiClientInitialized = false;

// --- TEST STATE SINGLETON FOR TEST HELPERS ---
const _testState = {
  user: null,
  isLoading: true,
  isInitialized: false,
  googleError: null,
  router: null,
  pathname: null,
  toast: null,
};

// --- TEST HELPERS ALWAYS AVAILABLE ---
const _testHelpers = {
  // State accessors
  getUser: () => _testState.user,
  getIsLoading: () => _testState.isLoading,
  getIsInitialized: () => _testState.isInitialized,
  getGoogleError: () => _testState.googleError,
  // State mutators
  setUser: (val) => { _testState.user = val; },
  setIsLoading: (val) => { _testState.isLoading = val; },
  setIsInitialized: (val) => { _testState.isInitialized = val; },
  setGoogleError: (val) => { _testState.googleError = val; },
  // Reset all state
  resetAll: () => {
    _testState.user = null;
    _testState.isLoading = true;
    _testState.isInitialized = false;
    _testState.googleError = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cedo_user');
      document.cookie = 'cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
    }
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
  },
  // Inject mock router, pathname, toast
  injectRouter: (mockRouter) => { _testState.router = mockRouter; },
  injectPathname: (mockPathname) => { _testState.pathname = mockPathname; },
  injectToast: (mockToast) => { _testState.toast = mockToast; },
  // Simulate session timeout
  simulateSessionTimeout: () => {
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    sessionTimeoutId = setTimeout(() => { }, 0);
  },
  // Simulate localStorage/cookie state
  setLocalStorageUser: (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('cedo_user', JSON.stringify(val));
  },
  setCookieToken: (val) => {
    if (typeof window !== 'undefined') document.cookie = `cedo_token=${val}`;
  },
  // Simulate API errors/success
  simulateApiError: (fn, error) => {
    try { fn(); } catch (e) { return error; }
  },
  simulateApiSuccess: (fn, result) => {
    try { return fn(); } catch (e) { return result; }
  },
  // Simulate user roles
  setUserRole: (role) => {
    _testState.user = { ...(_testState.user || {}), role };
  },
  // Simulate redirect
  simulateRedirect: (target) => {
    if (_testState.router && _testState.router.replace) _testState.router.replace(target);
  },
  // Simulate Google Sign-In
  simulateGoogleSignIn: (credential) => {
    handleGoogleCredentialResponse({ credential });
  },
  // Simulate fetchAllUsers/updateUserApproval
  simulateFetchAllUsers: () => fetchAllUsers(),
  simulateUpdateUserApproval: (id, status) => updateUserApproval(id, status),
  // Simulate clearAuthCache
  simulateClearAuthCache: () => clearAuthCache(),
  // Simulate verifyCurrentUser
  simulateVerifyCurrentUser: () => verifyCurrentUser(),
  // Simulate signIn/signOut
  simulateSignIn: (email, password, rememberMe, captchaToken) => signIn(email, password, rememberMe, captchaToken),
  simulateSignOut: () => signOut(),
  // Simulate signInWithGoogleAuth
  simulateSignInWithGoogleAuth: (elOrOpts) => signInWithGoogleAuth(elOrOpts),
  // Simulate handleGoogleCredentialResponse
  simulateHandleGoogleCredentialResponse: (resp) => handleGoogleCredentialResponse(resp),
  // Simulate loadGoogleScript
  simulateLoadGoogleScript: () => loadGoogleScript(),
  // Simulate showErrorToast/showSuccessToast
  simulateShowErrorToast: (title, desc, variant) => showErrorToast(title, desc, variant),
  simulateShowSuccessToast: (title, desc) => showSuccessToast(title, desc),
  // Simulate handleAuthError
  simulateHandleAuthError: (err, ctx) => handleAuthError(err, ctx),
  // Simulate performRedirect
  simulatePerformRedirect: (user) => performRedirect(user),
  // Simulate getDefaultDashboardForRole
  simulateGetDefaultDashboardForRole: (role) => getDefaultDashboardForRole(role),
  // Simulate resetSessionTimeout
  simulateResetSessionTimeout: () => resetSessionTimeout(),
  // Simulate safeDeleteAuthHeader
  simulateSafeDeleteAuthHeader: () => safeDeleteAuthHeader(),
  // Simulate commonSignOutLogicWithDependencies
  simulateCommonSignOutLogicWithDependencies: (redirect, path) => commonSignOutLogicWithDependencies(redirect, path),
  // Simulate commonSignInSuccess
  simulateCommonSignInSuccess: (token, user, rememberMe) => commonSignInSuccess(token, user, rememberMe),
};
export { _testHelpers };


export function AuthProvider({ children }) {
  // Use a ref for session timeout to avoid closure issues and timer leaks
  const sessionTimeoutIdRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParamsHook = useSearchParams();
  const { toast } = useToast();

  // --- Initial state: isLoading true, isInitialized false ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Initial state: isInitialized false until verifyCurrentUser completes
  const [isInitialized, setIsInitialized] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  // --- Always create axios instance on mount for testability ---
  // Move this outside useEffect so it's always called on first render
  getInternalApi();

  // Expose setUser for test injection (sync for test reliability)
  if (typeof window !== 'undefined') {
    window.__setAuthUserForTest = (u) => {
      setUser(u);
    };
    window.__getAuthUserForTest = () => user;
  }

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
    if (sessionTimeoutIdRef.current) {
      clearTimeout(sessionTimeoutIdRef.current);
      sessionTimeoutIdRef.current = null;
    }
    // Only set a new timeout if there is an active user session.
    if (user) {
      sessionTimeoutIdRef.current = setTimeout(() => {
        console.log(`Session timed out due to inactivity (${SESSION_TIMEOUT_DURATION / 1000} seconds).`);
        if (commonSignOutLogicWithDependencies) {
          commonSignOutLogicWithDependencies(true, `/sign-in?reason=session_timeout_activity&redirect=${encodeURIComponent(pathname)}`);
        }
      }, SESSION_TIMEOUT_DURATION);
    }
  }, [user, pathname]);

  // Defensive: ensure internalApi.defaults and .headers exist before use
  const safeDeleteAuthHeader = () => {
    const internalApi = getInternalApi();
    if (
      internalApi &&
      internalApi.defaults &&
      internalApi.defaults.headers &&
      internalApi.defaults.headers.common
    ) {
      delete internalApi.defaults.headers.common["Authorization"];
    }
  };

  commonSignOutLogicWithDependencies = useCallback(
    async (redirect = true, redirectPath = "/sign-in") => {
      console.log("🚪 AuthContext: Starting sign-out process. Redirect:", redirect, "Path:", redirectPath);
      setIsLoading(true);
      if (sessionTimeoutIdRef.current) {
        clearTimeout(sessionTimeoutIdRef.current);
        sessionTimeoutIdRef.current = null;
      }
      const internalApi = getInternalApi();

      try {
        // Check if we have a valid token before making the logout call
        let hasValidToken = false;
        if (typeof document !== "undefined") {
          const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
          if (cookieValue) {
            const token = cookieValue.split("=")[1];
            hasValidToken = token && token.length > 0;
          }
        }

        if (hasValidToken && internalApi && internalApi.post) {
          console.log("🔐 AuthContext: Valid token found, calling backend logout");
          await internalApi.post("/auth/logout");
          console.log("✅ AuthContext: Backend logout successful");
        } else {
          console.log("⚠️ AuthContext: No valid token found, skipping backend logout call");
        }
      } catch (error) {
        console.error("❌ AuthProvider [signOut]: Error during backend logout:", error);
        // Don't throw the error, just log it and continue with local cleanup
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

        // Defensive: clear API authorization header safely
        safeDeleteAuthHeader();
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

  // --- Session timeout effect: set timer only when user is present ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Always clear timer and listeners first
    window.removeEventListener("mousemove", resetSessionTimeout);
    window.removeEventListener("keypress", resetSessionTimeout);
    if (sessionTimeoutIdRef.current) {
      clearTimeout(sessionTimeoutIdRef.current);
      sessionTimeoutIdRef.current = null;
    }
    if (!user) return;
    resetSessionTimeout();
    window.addEventListener("mousemove", resetSessionTimeout);
    window.addEventListener("keypress", resetSessionTimeout);
    return () => {
      window.removeEventListener("mousemove", resetSessionTimeout);
      window.removeEventListener("keypress", resetSessionTimeout);
      if (sessionTimeoutIdRef.current) {
        clearTimeout(sessionTimeoutIdRef.current);
        sessionTimeoutIdRef.current = null;
      }
    };
  }, [user, resetSessionTimeout]);

  // --- Cleanup all timers on unmount (for test reliability) ---
  useEffect(() => {
    return () => {
      if (sessionTimeoutIdRef.current) {
        clearTimeout(sessionTimeoutIdRef.current);
        sessionTimeoutIdRef.current = null;
      }
      window.removeEventListener("mousemove", resetSessionTimeout);
      window.removeEventListener("keypress", resetSessionTimeout);
    };
  }, []);

  const commonSignInSuccess = useCallback(
    (token, userData, rememberMe = false) => {
      console.log("🎉 AuthContext: commonSignInSuccess called with:", {
        hasToken: !!token,
        hasUserData: !!userData,
        userRole: userData?.role,
        rememberMe
      });

      if (typeof document !== "undefined") {
        let cookieOptions = "path=/; SameSite=Lax; Secure";
        if (rememberMe) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          cookieOptions += `; expires=${expiryDate.toUTCString()}`;
        }
        document.cookie = `cedo_token=${token}; ${cookieOptions}`;
        localStorage.setItem("cedo_user", JSON.stringify(userData));
        console.log("💾 AuthContext: Token and user data stored in browser");
      }

      const internalApi = getInternalApi();
      if (internalApi && internalApi.defaults && internalApi.defaults.headers) {
        internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("🔑 AuthContext: Authorization header set");
      }

      console.log("👤 AuthContext: Setting user state to:", userData);
      setUser(userData);
      setIsLoading(false);

      console.log("🔄 AuthContext: Calling performRedirect with user data");
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
        const internalApi = getInternalApi();
        if (internalApi && internalApi.defaults && internalApi.defaults.headers) {
          internalApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const storedUser = localStorage.getItem("cedo_user");
        let currentUserData = null;
        if (storedUser) {
          currentUserData = JSON.parse(storedUser);
        } else {
          if (internalApi && internalApi.get) {
            const { data: meData } = await internalApi.get("/auth/me");
            if (meData && meData.user) {
              currentUserData = meData.user;
              localStorage.setItem("cedo_user", JSON.stringify(meData.user));
            } else {
              throw new Error("No user data from /auth/me despite having a token.");
            }
          }
        }
        setUser(currentUserData);
        performRedirect(currentUserData);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cedo_user");
        document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
      }
      safeDeleteAuthHeader();
      setUser(null);
    } finally {
      setIsLoading(false);
      // Do not set isInitialized here; let the effect below do it after verifyCurrentUser completes
    }
  }, []);

  // --- Only set isInitialized after verifyCurrentUser completes ---
  // Only set isInitialized after verifyCurrentUser completes
  useEffect(() => {
    let didCancel = false;
    if (!isInitialized) {
      (async () => {
        await verifyCurrentUser();
        if (!didCancel) setIsInitialized(true);
      })();
    }
    return () => { didCancel = true; };
  }, [isInitialized, verifyCurrentUser]);


  const signIn = useCallback(
    async (email, password, rememberMe = false, captchaToken = null) => {
      console.log("🚀 AuthContext: signIn called with email:", email);
      setIsLoading(true);
      try {
        const payload = { email, password };
        if (captchaToken) payload.captchaToken = captchaToken;
        console.log("📤 AuthContext: Sending payload:", { ...payload, password: '[HIDDEN]' });

        const internalApi = getInternalApi();
        let response = null;

        // ✅ ENHANCED: Better error handling and debugging
        if (!internalApi || !internalApi.post) {
          const error = new Error("API client not available - check backend connectivity");
          console.log("🔧 AuthContext: API client not available:", error.message);
          throw error;
        }

        console.log("🔗 AuthContext: Making request to /api/auth/login");
        response = await internalApi.post("/api/auth/login", payload);

        console.log("✅ AuthContext: Backend response received:", {
          status: response.status,
          hasData: !!response.data,
          hasToken: !!response.data?.token,
          hasUser: !!response.data?.user
        });

        const { token, user: userData } = response.data;
        console.log("🔍 AuthContext: Extracted data:", {
          hasToken: !!token,
          hasUserData: !!userData,
          userRole: userData?.role
        });

        if (token && userData) {
          console.log("✅ AuthContext: Valid token and user data found, calling commonSignInSuccess");
          showSuccessToast("Sign-In Successful", `Welcome back, ${userData.name}!`);
          return commonSignInSuccess(token, userData, rememberMe);
        }
        console.log("🔐 AuthContext: Invalid response - missing token or user data");
        throw new Error("Login failed: No token or user data received from server.");
      } catch (error) {
        // ✅ ENHANCED: Comprehensive error logging with structured data
        const errorDetails = {
          message: error.message || "Unknown error",
          name: error.name || "Error",
          stack: error.stack,
          response: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
          },
          request: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers
          },
          code: error.code,
          isAxiosError: error.isAxiosError,
          isNetworkError: error.code === "NETWORK_ERROR" || error.message.includes("Network Error"),
          isTimeoutError: error.code === "ECONNABORTED" || error.message.includes("timeout")
        };

        // Only log unexpected errors verbosely
        if (error.response?.status === 500 || error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
          console.error("❌ AuthContext: Unexpected error in signIn:", {
            status: error.response?.status,
            message: error.message,
            code: error.code,
            url: error.config?.url
          });
        } else {
          console.log("🔐 AuthContext: Sign-in failed:", error.response?.data?.message || error.message);
        }

        // ✅ ENHANCED: More specific error messages and handling
        let errorMessage = "Sign-in failed. Please try again.";

        if (error.response?.status === 400) {
          const errorText = error.response?.data?.message || '';
          if (errorText.includes('reCAPTCHA')) {
            errorMessage = "reCAPTCHA validation failed. Please refresh the page and try again.";
          } else if (errorText.includes('Email and password are required')) {
            errorMessage = "Please provide both email and password.";
          } else {
            errorMessage = errorText || "Invalid request. Please check your input.";
          }
        } else if (error.response?.status === 401) {
          const errorText = error.response?.data?.message || '';
          if (errorText.includes('User account not found') || errorText.includes('USER_NOT_FOUND')) {
            errorMessage = "Your account was not found. Please sign in again.";
            // Clear invalid authentication data and redirect
            await commonSignOutLogicWithDependencies(true, "/sign-in");
            setIsLoading(false);
            throw new Error(errorMessage);
          } else if (errorText.includes('Invalid credentials')) {
            errorMessage = "Invalid email or password. Please check your credentials.";
          } else {
            errorMessage = "Authentication failed. Please check your credentials.";
          }
        } else if (error.response?.status === 403) {
          const errorText = error.response?.data?.message || '';
          if (errorText.includes('pending approval')) {
            errorMessage = "Account pending approval. Please contact an administrator.";
          } else {
            errorMessage = errorText || "Access denied. Please contact an administrator.";
          }
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.isNetworkError) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.isTimeoutError) {
          errorMessage = "Request timeout. Please try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        const errorInfo = handleAuthError(error, "Sign-In");
        await commonSignOutLogicWithDependencies(false);
        setIsLoading(false);

        // ✅ ENHANCED: Throw a structured error with all details
        const structuredError = new Error(errorMessage);
        structuredError.originalError = error;
        structuredError.details = errorDetails;
        throw structuredError;
      }
    },
    [commonSignInSuccess, commonSignOutLogicWithDependencies, handleAuthError, showSuccessToast]
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

  // Enhanced handleGoogleCredentialResponse with better error handling
  const handleGoogleCredentialResponse = useCallback(
    async (googleResponse) => {
      console.log("🚀 AuthContext: handleGoogleCredentialResponse called with:", {
        hasError: !!googleResponse.error,
        hasCredential: !!googleResponse?.credential,
        errorType: googleResponse.error,
        errorDescription: googleResponse.error_description
      });

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

        console.log("🔑 AuthContext: Google credential received, calling backend...");
        const internalApi = getInternalApi();

        if (!internalApi || !internalApi.post) {
          throw new Error("API client not available");
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000';
        console.log("🌐 AuthContext: Backend URL:", backendUrl);

        const response = await internalApi.post("/api/auth/google", {
          token: googleResponse.credential,
          rememberMe: false // Default to false for Google auth, can be enhanced later
        });

        console.log("✅ AuthContext: Backend response received:", {
          status: response.status,
          hasData: !!response.data,
          hasToken: !!response.data?.token,
          hasUser: !!response.data?.user
        });

        const { token, user: userDataFromBackend } = response.data;

        if (token && userDataFromBackend) {
          console.log("🎉 AuthContext: Valid response, calling commonSignInSuccess");
          commonSignInSuccess(token, userDataFromBackend, false);
          showSuccessToast("Sign-In Successful", `Welcome back, ${userDataFromBackend.name}!`);
        } else {
          throw new Error("Google Sign-In failed: No valid token or user data received from backend server.");
        }
      } catch (error) {
        console.error("❌ AuthContext: Google Sign-In error:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        });

        // ✅ ENHANCED: Specific error handling for Google authentication
        if (error.response?.status === 403) {
          const reason = error.response.data?.reason;
          if (reason === "GOOGLE_EMAIL_NOT_VERIFIED") {
            showErrorToast("Email Verification Required", "Please verify your email address with Google and try again. Check your Google account settings to verify your email.");
          } else if (reason === "USER_NOT_FOUND") {
            showErrorToast("Account Not Found", "Your account was not found. Please contact an administrator to create your account.");
          } else if (reason === "USER_NOT_APPROVED") {
            showErrorToast("Account Pending Approval", "Your account is pending approval. Please contact an administrator.");
          } else {
            showErrorToast("Access Denied", error.response.data?.message || "You don't have permission to access this resource.");
          }
        } else if (error.response?.status === 401) {
          showErrorToast("Authentication Failed", "Invalid Google credentials. Please try again.");
        } else if (error.response?.status === 500) {
          showErrorToast("Server Error", "A server error occurred. Please try again later.");
        } else if (error.message.includes("Network Error") || error.code === "NETWORK_ERROR") {
          showErrorToast("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.");
        } else {
          const errorInfo = handleAuthError(error, "Google Sign-In");
          setGoogleError(errorInfo);
        }
      }
    },
    [commonSignInSuccess, handleAuthError, showSuccessToast]
  );

  const signInWithGoogleAuth = useCallback(
    async (elementOrOptions) => {
      console.log("🚀 AuthContext: signInWithGoogleAuth CALLED.");

      try {
        let parentElement;
        let renderOptions = { theme: "outline", size: "large", type: "standard", text: "signin_with" };

        if (!elementOrOptions) {
          throw new Error("A parentElement (DOM node) or an options object with parentElementId is required.");
        }

        // Check if the argument is a DOM element or an options object
        if (typeof elementOrOptions.nodeType === 'number') {
          parentElement = elementOrOptions;
        } else if (elementOrOptions.parentElementId) {
          parentElement = document.getElementById(elementOrOptions.parentElementId);
          renderOptions = { ...renderOptions, ...elementOrOptions };
        } else {
          throw new Error("Invalid argument: Pass a DOM element or an options object with a `parentElementId` property.");
        }

        if (!parentElement) {
          throw new Error("Could not find the Google Sign-In button's parent element in the DOM.");
        }

        await loadGoogleScript();

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          throw new Error("Google Client ID (GOOGLE_CLIENT_ID) is not configured in environment variables.");
        }

        // `initialize` can be called multiple times; it will just update the config.
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          cancel_on_tap_outside: true,
          context: "signin",
        });

        if (document.body.contains(parentElement)) {
          // Clear any previous button from the container to ensure a clean render.
          parentElement.innerHTML = '';

          window.google.accounts.id.renderButton(parentElement, renderOptions);
          console.log(`AuthContext: Google button render initiated in #${parentElement.id}. Waiting for user interaction.`);
        } else {
          throw new Error(`Google Sign-In container #${parentElement.id} not found in the DOM.`);
        }
      } catch (error) {
        console.error("AuthContext: ERROR during signInWithGoogleAuth setup phase:", error);
        // Re-throw the error so the calling component can handle it
        throw error;
      }
    },
    [handleGoogleCredentialResponse, loadGoogleScript]
  );

  // --- New functions for User Management API calls ---
  const fetchAllUsers = useCallback(async () => {
    // Always get latest user from state for test reliability
    const currentUser = typeof window !== 'undefined' && window.__getAuthUserForTest
      ? window.__getAuthUserForTest() : user;
    if (!currentUser || currentUser.role !== ROLES.HEAD_ADMIN) {
      const errorMsg = "Unauthorized to fetch users.";
      showErrorToast("Access Denied", "You don't have permission to view user data.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log("AuthContext: Fetching all users...");
      const internalApi = getInternalApi();
      let response = null;
      if (internalApi && internalApi.get) {
        response = await internalApi.get("/users");
      } else {
        throw new Error("API client not available");
      }
      return response.data;
    } catch (error) {
      // Use the new error handling system
      const errorInfo = handleAuthError(error, "User Data Fetch");
      if (process.env.NODE_ENV === 'development') {
        console.error("AuthContext: Error in fetchAllUsers:", error);
      }
      throw error;
    }
  }, [user, handleAuthError, showErrorToast]);

  const updateUserApproval = useCallback(async (userIdToUpdate, newApprovalStatus) => {
    // Always get latest user from state for test reliability
    const currentUser = typeof window !== 'undefined' && window.__getAuthUserForTest
      ? window.__getAuthUserForTest() : user;
    if (!currentUser || currentUser.role !== ROLES.HEAD_ADMIN) {
      const errorMsg = "Unauthorized to update user approval.";
      showErrorToast("Access Denied", "You don't have permission to update user approval status.");
      return Promise.reject(new Error(errorMsg));
    }
    try {
      console.log(`AuthContext: Updating approval for user ${userIdToUpdate} to ${newApprovalStatus}`);
      const internalApi = getInternalApi();
      let response = null;
      if (internalApi && internalApi.put) {
        response = await internalApi.put(`/users/${userIdToUpdate}/approval`, { is_approved: newApprovalStatus });
      } else {
        throw new Error("API client not available");
      }
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
  // --- TESTING UTILITY: Expose setUser for test injection ---
  // --- TESTING UTILITY: Expose setUser for test injection ---
  const _setAuthUserForTest = (u) => {
    if (typeof window !== 'undefined' && typeof window.__setAuthUserForTest === 'function') {
      window.__setAuthUserForTest(u);
    }
  };
  // --- TESTING UTILITY: Expose getUser for test assertions ---
  const _getAuthUserForTest = () => {
    // Not directly accessible, but can be improved if needed
    return null;
  };
  // export { _setAuthUserForTest, _getAuthUserForTest }; // (Commented out for Jest CJS compatibility)
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

      // Defensive: clear API header safely
      safeDeleteAuthHeader();
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
    user: user ?? null,
    isLoading: isLoading ?? true,
    isInitialized: isInitialized ?? false,
    signIn,
    signOut,
    signInWithGoogleAuth,
    ROLES,
    googleError: googleError ?? null,
    clearGoogleError: () => setGoogleError(null),
    redirect: currentSearchParamsHook.get("redirect") || "/",
    searchParams: currentSearchParamsHook,
    fetchAllUsers,
    updateUserApproval,
    clearAuthCache,
    // For test use only:
    setUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export context for direct import in tests
export { AuthContext };
// --- TESTING UTILITY: Reset axios instance between tests ---
// Call this in test setup/teardown to ensure clean mocks
export function _resetInternalApiInstanceForTests() {
  _internalApi = null;
  _baseURL = null;
}

// --- TESTING UTILITY: Force axios instance creation for test coverage ---
function _forceCreateInternalApiForTest(baseURL) {
  _internalApi = null;
  _baseURL = baseURL || null;
  return getInternalApi();
}

// Export getInternalApi for use in components
export { getInternalApi };

