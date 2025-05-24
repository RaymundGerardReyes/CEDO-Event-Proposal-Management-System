// src/contexts/auth-context.js
"use client";

import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
const SESSION_TIMEOUT_DURATION = 500 * 1000; // 10 seconds in milliseconds

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
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentSearchParams = new URLSearchParams(window.location.search);
      setSearchParams(currentSearchParams);

      const handleRouteChange = () => {
        setSearchParams(new URLSearchParams(window.location.search));
      }
      window.addEventListener("popstate", handleRouteChange);
      return () => {
        window.removeEventListener("popstate", handleRouteChange);
      };
    }
  }, [pathname]);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // For Google Sign-In promise management
  const currentGoogleSignInPromiseActions = useRef(null);


  const performRedirect = useCallback(
    (loggedInUser) => {
      const currentRedirectParam = searchParams.get("redirect");
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
    [router, searchParams, pathname],
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
      console.warn("AuthContext [verifyCurrentUser]: Error verifying current user or token invalid.", error.message);
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
          return commonSignInSuccess(token, userData, rememberMe);
        }
        throw new Error("Login failed: No token or user data received from server.");
      } catch (error) {
        let errorMessage = "An unexpected error occurred during sign-in.";
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message ||
            (Array.isArray(error.response?.data?.errors) && error.response?.data?.errors.map(e => e.msg).join(", ")) ||
            `Server error (${error.response?.status}). Please try again.` ||
            error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        await commonSignOutLogicWithDependencies(false);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    [commonSignInSuccess, commonSignOutLogicWithDependencies],
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

      // It's good practice to clear the ref once we've retrieved the actions,
      // or at least ensure it's cleared in a finally block.
      // For this pattern, clearing in finally is more robust.

      try {
        if (googleResponse.error || !googleResponse?.credential) {
          // Map Google's error naming if necessary, or use a generic message
          let errMsg = "Google Sign-In failed or was cancelled by the user.";
          if (googleResponse.error_description) {
            errMsg = googleResponse.error_description;
          } else if (googleResponse.error) {
            // Common GSI errors: "popup_closed", "user_cancelled", "idpiframe_initialization_failed", etc.
            errMsg = `Google Sign-In error: ${googleResponse.error}`;
          }
          throw new Error(errMsg);
        }

        // Send Google token to your backend for verification and app token issuance
        const backendResponse = await internalApi.post("/auth/google", { token: googleResponse.credential });
        const { token, user: userDataFromBackend } = backendResponse.data;

        if (token && userDataFromBackend) {
          commonSignInSuccess(token, userDataFromBackend, false); // Your existing app sign-in success logic
          promiseActions.resolve(userDataFromBackend); // Resolve the promise from signInWithGoogleAuth with your app's user data
        } else {
          throw new Error("Google Sign-In failed: No valid token or user data received from backend server.");
        }
      } catch (error) {
        let errorMessage = "An unexpected error occurred during Google Sign-In processing.";
        if (axios.isAxiosError(error) && error.response) {
          // Customize based on backend error structure for Google Sign-In
          errorMessage = error.response.data?.message || `Backend error (${error.response.status}) during Google Sign-In.`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error("AuthContext: Google Sign-In Error in handleGoogleCredentialResponse:", errorMessage, error);
        promiseActions.reject(new Error(errorMessage)); // Reject the promise from signInWithGoogleAuth
      } finally {
        console.log("AuthContext (handleGoogleCredentialResponse): Clearing currentGoogleSignInPromiseActions.current. Old value:", currentGoogleSignInPromiseActions.current);
        currentGoogleSignInPromiseActions.current = null; // Crucial cleanup
        console.log("AuthContext (handleGoogleCredentialResponse): currentGoogleSignInPromiseActions.current is now null.");
      }
    },
    [commonSignInSuccess] // Dependency: commonSignInSuccess for app-level sign-in
  );

  // Corrected signInWithGoogleAuth
  const signInWithGoogleAuth = useCallback(async (elementIdToRenderButtonIn, buttonOptions = {}) => {
    console.log("AuthContext: signInWithGoogleAuth CALLED. Checking lock...");
    return new Promise(async (resolveOuter, rejectOuter) => {
      if (currentGoogleSignInPromiseActions.current) {
        console.error("AuthContext: LOCK ENGAGED. Another Google Sign-In operation is already in progress. currentGoogleSignInPromiseActions.current:", currentGoogleSignInPromiseActions.current);
        rejectOuter(new Error("Another Google Sign-In operation is already in progress. Please wait."));
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
          buttonDiv.innerHTML = ''; // Clear previous button to ensure fresh render
          const defaultRenderOptions = {
            theme: "outline", size: "large", type: "standard", text: "signin_with",
          };
          const mergedOptions = { ...defaultRenderOptions, ...buttonOptions };
          window.google.accounts.id.renderButton(buttonDiv, mergedOptions);
          console.log(`AuthContext: signInWithGoogleAuth - Google button rendered in ${elementIdToRenderButtonIn}. Waiting for callback...`);
          // Promise is now waiting for handleGoogleCredentialResponse
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
        // Ensure we reject the promise associated with *this* attempt and clear the lock.
        const promiseActionsForThisAttempt = currentGoogleSignInPromiseActions.current;
        if (promiseActionsForThisAttempt && promiseActionsForThisAttempt.reject === rejectOuter) {
          console.log("AuthContext: signInWithGoogleAuth catch - Rejecting promise for this attempt.");
          promiseActionsForThisAttempt.reject(error);
        } else if (promiseActionsForThisAttempt) {
          console.warn("AuthContext: signInWithGoogleAuth catch - Mismatch in promise actions. This might indicate a race condition or stale state. Current promiseActions' initiatedAt:", promiseActionsForThisAttempt.initiatedAt);
          // Still attempt to reject the original promise if it's the one we have.
          rejectOuter(error);
        } else {
          console.warn("AuthContext: signInWithGoogleAuth catch - No promise actions found in currentGoogleSignInPromiseActions.current. The promise might have been cleared by another process.");
          // Reject the promise for this call anyway, as it failed.
          rejectOuter(error);
        }
        console.log("AuthContext: signInWithGoogleAuth catch - Releasing LOCK by setting currentGoogleSignInPromiseActions.current to null. Old value:", currentGoogleSignInPromiseActions.current);
        currentGoogleSignInPromiseActions.current = null; // Crucial cleanup
        console.log("AuthContext: signInWithGoogleAuth catch - LOCK RELEASED. currentGoogleSignInPromiseActions.current is now null.");
      }
    });
  }, [loadGoogleScript, handleGoogleCredentialResponse]);


  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signInWithGoogleAuth,
    ROLES,
    redirect: searchParams.get("redirect") || "/",
    searchParams,
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