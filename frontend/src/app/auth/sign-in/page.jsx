"use client";

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import { AuthLoadingScreen } from "@/components/auth/loading-screen";
import { LogoSimple } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { getInternalApi, ROLES, useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRememberMe } from "@/hooks/use-remember-me";
import { generateDebugReport, quickDiagnostic } from "@/lib/config-debugger";
import { getAppConfig, loadConfig } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Dynamic import for Google reCAPTCHA with optimized loading
const ReCAPTCHAComponent = dynamicImport(() => import("react-google-recaptcha"), {
  ssr: false,
  loading: () => <div className="flex justify-center my-4"><div className="text-sm text-muted-foreground">Loading security verification...</div></div>
});

// Form validation schema
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

// Loading fallback for sign-in content
function SignInContentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md animate-pulse">
        <CardContent className="space-y-4 p-6">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    </div>
  );
}

const isTest = process.env.NODE_ENV === 'test';

// Component that uses useSearchParams
function SignInContent() {
  const {
    signIn,
    signInWithGoogleAuth,
    user,
    isLoading: authProviderLoading,
    isInitialized,
    googleError,
    clearGoogleError
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const recaptchaRef = useRef(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState("An unexpected error occurred. Please try again.");
  const errorDialogTitleId = "error-dialog-title";
  const errorDialogDescriptionId = "error-dialog-description";

  // Remember Me functionality
  const {
    isRememberMeSupported,
    rememberMeStatus,
    handleRememberMeLogin,
    handleRememberMeLogout,
    getStoredPreferences,
    hasRememberMeEnabled
  } = useRememberMe();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(false);
  const [googleButtonRetryCount, setGoogleButtonRetryCount] = useState(0);

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const GOOGLE_BUTTON_CONTAINER_ID = "google-signin-button-container";

  const isMobile = useIsMobile();

  // Initialize React Hook Form with enhanced "Remember Me" functionality
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Enhanced "Remember Me" functionality - Load saved credentials with security checks
  useEffect(() => {
    const loadSavedCredentials = () => {
      try {
        // Use our Remember Me utilities
        const preferences = getStoredPreferences();

        if (preferences && preferences.email && preferences.rememberMe) {
          form.setValue('email', preferences.email);
          form.setValue('rememberMe', true);
          console.log('✅ SignIn: Loaded saved credentials for remember me');
        }
      } catch (error) {
        console.warn('⚠️ SignIn: Failed to load saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, [form, getStoredPreferences]);

  const openErrorDialog = useCallback((message, errorDetails = null) => {
    setErrorDialogMessage(message);
    setIsErrorDialogOpen(true);
  }, []);

  // Effect to handle Google Sign-In errors from the context
  useEffect(() => {
    if (googleError) {
      openErrorDialog(googleError.description);
      clearGoogleError();
    }
  }, [googleError, clearGoogleError, openErrorDialog]);

  // ✅ CRITICAL: Handle account_not_found error from URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    if (errorParam === 'account_not_found') {
      const errorMessage = messageParam || 'Your account was not found. Please sign in again.';
      console.log('🔐 Account not found error detected:', errorMessage);

      // Show the error dialog
      openErrorDialog(errorMessage);

      // Clear the URL parameters to avoid showing the error again
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, openErrorDialog]);

  // Optimized reCAPTCHA configuration with better error handling
  useEffect(() => {
    if (isTest) {
      setRecaptchaSiteKey('test-site-key');
      setIsConfigLoaded(true);
      return;
    }

    let isMounted = true; // Prevent state updates on unmounted component

    async function initializeConfig() {
      try {
        console.log('[reCAPTCHA] Initializing configuration...');

        // Use enhanced loadConfig with retry logic
        await loadConfig(3); // 3 retries

        if (!isMounted) return; // Component unmounted, don't update state

        const config = getAppConfig();
        let key = config.recaptchaSiteKey;

        if (!key) {
          key = process.env.RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
          if (key) {
            console.warn('[reCAPTCHA] Using fallback key from environment');
          } else {
            console.error('[reCAPTCHA] No site key found in config or environment');
          }
        } else {
          console.log('[reCAPTCHA] Using site key from config');
        }

        if (isMounted) {
          setRecaptchaSiteKey(key);
          setIsConfigLoaded(true);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('[reCAPTCHA] Config fetch failed:', error.message);

        // Enhanced error handling with specific error types
        if (error.message.includes('Failed to fetch')) {
          console.error('[reCAPTCHA] Network error - backend may not be running');
          // Run quick diagnostic
          const diagnostic = quickDiagnostic();
          console.log('[reCAPTCHA] Quick diagnostic:', diagnostic);
        } else if (error.message.includes('timeout')) {
          console.error('[reCAPTCHA] Request timeout - backend is slow to respond');
        } else if (error.message.includes('CORS')) {
          console.error('[reCAPTCHA] CORS error - check backend configuration');
        }

        // Generate comprehensive debug report in development
        if (process.env.NODE_ENV === 'development') {
          try {
            const debugReport = await generateDebugReport();
            console.log('[reCAPTCHA] Debug report:', debugReport);
          } catch (debugError) {
            console.error('[reCAPTCHA] Debug report failed:', debugError);
          }
        }

        // Fallback to environment variables
        const key = process.env.RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (key) {
          console.warn('[reCAPTCHA] Using fallback key from environment');
        } else {
          console.error('[reCAPTCHA] No fallback key available');
        }

        if (isMounted) {
          setRecaptchaSiteKey(key);
          setIsConfigLoaded(true);
        }
      }
    }

    initializeConfig();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []);

  const resetGoogleButtonState = useCallback((reason = "unknown") => {
    console.log(`🔄 SignIn: Resetting Google button state due to: ${reason}`);
    setIsGoogleButtonRendered(false);
    setIsGoogleAuthProcessing(false);
  }, []);

  // Reset Google button when user becomes null and is initialized
  useEffect(() => {
    if (isInitialized && !user) {
      console.log("🔄 SignIn: User is null and initialized, resetting Google button state");
      resetGoogleButtonState("user is null");
      setGoogleButtonRetryCount(prev => prev + 1);
    }
  }, [isInitialized, user, resetGoogleButtonState]);

  const handleSignInConflict = useCallback(() => {
    setIsGoogleAuthProcessing(false);
    setIsGoogleButtonRendered(false);
    setTimeout(() => {
      setGoogleButtonRetryCount(prev => prev + 1);
    }, 2000);
  }, []);

  const handleAuthenticatedUserRedirect = useCallback(() => {
    if (!user || !isInitialized) {
      return;
    }

    let targetPath = "/";
    const redirectQueryParam = searchParams.get("redirect");

    // Priority 1: Specific role-based redirects
    if (user.role === ROLES.STUDENT) {
      targetPath = "/student-dashboard";
    } else if (redirectQueryParam && redirectQueryParam !== pathname) {
      // Priority 2: Query parameter redirect
      targetPath = redirectQueryParam;
    } else if (user.dashboard) {
      // Priority 3: User's pre-defined dashboard from JWT
      targetPath = user.dashboard;
    } else if (user.role) {
      // Priority 4: General role-based redirects
      switch (user.role) {
        case ROLES.HEAD_ADMIN:
        case ROLES.MANAGER:
          targetPath = "/admin-dashboard";
          break;
        case ROLES.PARTNER:
        case ROLES.REVIEWER:
          targetPath = user.dashboard || (user.role === ROLES.PARTNER ? "/student-dashboard" : "/admin-dashboard");
          break;
        default:
          targetPath = "/";
      }
    }

    if (pathname !== targetPath) {
      router.replace(targetPath);
    } else if (pathname === "/sign-in" && targetPath === "/sign-in") {
      router.replace("/");
    }
  }, [user, isInitialized, router, pathname, searchParams, ROLES]);

  // Enhanced effect for authenticated user redirect
  useEffect(() => {
    if (isInitialized && user) {
      handleAuthenticatedUserRedirect();
    }
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);

  // Additional effect to handle cases where user data changes
  useEffect(() => {
    if (user && isInitialized && pathname === "/sign-in") {
      const timeoutId = setTimeout(() => {
        handleAuthenticatedUserRedirect();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [user, isInitialized, pathname, handleAuthenticatedUserRedirect]);

  useEffect(() => {
    let timer;
    if (isErrorDialogOpen) {
      timer = setTimeout(() => setIsErrorDialogOpen(false), 6000);
    }
    return () => clearTimeout(timer);
  }, [isErrorDialogOpen]);

  // Cleanup effect for Google button container
  useEffect(() => {
    return () => {
      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Simplified effect to handle post-sign-out delay detection
  useEffect(() => {
    if (isInitialized && !user && typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp) {
      const timeSinceSignOut = Date.now() - window.__cedoGoogleSignOutTimestamp;
      if (timeSinceSignOut < 1000) {
        const remainingDelay = 1000 - timeSinceSignOut;
        console.log(`⏳ SignIn: Recent sign-out detected, waiting ${remainingDelay}ms before Google button`);

        const silentDelay = setTimeout(() => {
          delete window.__cedoGoogleSignOutTimestamp;
          console.log("✅ SignIn: Sign-out delay completed, ready for Google button");
          setGoogleButtonRetryCount(prev => prev + 1);
        }, remainingDelay);

        return () => clearTimeout(silentDelay);
      } else {
        delete window.__cedoGoogleSignOutTimestamp;
        console.log("✅ SignIn: Sign-out delay period already completed");
      }
    }
  }, [isInitialized, user]);

  // Optimized Google button initialization with better error handling
  useEffect(() => {
    if (isInitialized && !user && !isGoogleButtonRendered) {
      let isMounted = true; // Prevent state updates on unmounted component

      const initGoogleButton = async () => {
        const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
        if (!container) {
          console.warn("⚠️ SignIn: Google button container not found, will retry.");
          if (isMounted) {
            setTimeout(() => setGoogleButtonRetryCount(prev => prev + 1), 500);
          }
          return;
        }

        console.log("🚀 SignIn: Starting Google button initialization");
        if (isMounted) {
          setIsGoogleAuthProcessing(true);
        }

        try {
          // Add timeout for Google auth initialization
          const authPromise = signInWithGoogleAuth(container);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Google auth timeout')), 10000)
          );

          await Promise.race([authPromise, timeoutPromise]);

          if (isMounted) {
            console.log("✅ SignIn: Google button render successful.");
            setIsGoogleButtonRendered(true);
          }
        } catch (error) {
          if (isMounted) {
            console.error("❌ SignIn: Failed to render Google button:", error.message);
            // Only show error dialog for non-timeout errors
            if (!error.message.includes('timeout')) {
              openErrorDialog("Failed to sign in with Google. Please try again.");
            }
          }
        } finally {
          if (isMounted) {
            setIsGoogleAuthProcessing(false);
            console.log("✅ SignIn: Google button initialization process completed.");
          }
        }
      };

      const timeoutId = setTimeout(initGoogleButton, 300);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
  }, [isInitialized, user, isGoogleButtonRendered, signInWithGoogleAuth, openErrorDialog, googleButtonRetryCount]);

  // Track when the sign-in page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__cedoSignInPageLoadTime = Date.now();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    form.setValue(name, type === "checkbox" ? checked : value);
  };

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    if (recaptchaRef.current && typeof recaptchaRef.current.reset === 'function') {
      recaptchaRef.current.reset();
    }
  }, []);

  const handleCaptchaVerify = useCallback((token) => {
    if (token) {
      setCaptchaToken(token);
    } else {
      console.warn("reCAPTCHA verification returned null or empty token. Resetting.");
      resetCaptcha();
    }
  }, [resetCaptcha]);

  const handleCaptchaError = useCallback(() => {
    toast({
      title: "CAPTCHA Error",
      description: "There was an error with the reCAPTCHA service. Please try refreshing.",
      variant: "destructive",
    });
    resetCaptcha();
  }, [toast, resetCaptcha]);

  const handleSubmit = async (data) => {
    console.log("🚀 SignIn: handleSubmit called with data:", { ...data, password: '[HIDDEN]' });

    if (isSubmittingEmail || isSubmittingGoogle) {
      console.log("⚠️ SignIn: Already submitting, returning early");
      return;
    }

    if (!captchaToken && recaptchaSiteKey) {
      console.log("⚠️ SignIn: CAPTCHA required but not completed");
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "warning",
      });
      return;
    }

    console.log("✅ SignIn: Starting sign-in process");
    setIsSubmittingEmail(true);

    try {
      console.log("🔍 SignIn: Checking backend connectivity...");
      const internalApi = getInternalApi();

      // Add timeout for health check
      const healthPromise = internalApi.get('/health');
      const healthTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      );

      try {
        await Promise.race([healthPromise, healthTimeoutPromise]);
        console.log("✅ SignIn: Backend is reachable");
      } catch (healthError) {
        console.error("❌ SignIn: Backend connectivity check failed:", healthError.message);
        openErrorDialog("Backend server is not responding. Please check if the server is running.");
        return;
      }

      console.log("📞 SignIn: Calling signIn function");

      // Add timeout for sign-in request
      const signInPromise = signIn(data.email, data.password, data.rememberMe, captchaToken);
      const signInTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timeout')), 15000)
      );

      const userData = await Promise.race([signInPromise, signInTimeoutPromise]);
      console.log("✅ SignIn: signIn function returned:", userData);

      if (userData) {
        console.log("🎉 SignIn: Sign-in successful, showing success toast");

        // Enhanced "Remember Me" functionality - Save credentials if requested with security
        const rememberMe = data.rememberMe;
        try {
          if (rememberMe) {
            // Use our Remember Me utilities for secure storage
            await handleRememberMeLogin(userData, true);
            console.log('✅ SignIn: Saved credentials for remember me with secure storage');
          } else {
            // Clear saved credentials if user doesn't want to be remembered
            await handleRememberMeLogout();
            console.log('✅ SignIn: Cleared saved credentials');
          }
        } catch (error) {
          console.warn('⚠️ SignIn: Failed to save/clear credentials:', error);
        }

        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
          variant: "success",
        });
      } else {
        console.error("❌ SignIn: signIn returned null/undefined");
        openErrorDialog("Authentication failed. Please check your email and password.");
        resetCaptcha();
      }
    } catch (error) {
      // Clean error handling - only log unexpected errors verbosely
      const isExpectedError =
        error.message?.includes("Invalid") ||
        error.message?.includes("credentials") ||
        error.message?.includes("pending approval") ||
        error.message?.includes("timeout");

      if (!isExpectedError) {
        console.error("❌ SignIn: Unexpected error during sign-in:", {
          message: error.message,
          status: error.response?.status,
          isNetworkError: error.code === "NETWORK_ERROR" || error.message.includes("Network Error"),
          isTimeoutError: error.code === "ECONNABORTED" || error.message.includes("timeout")
        });
      } else {
        console.log("🔐 SignIn: Authentication failed:", error.message);
      }

      // ✅ ENHANCED: Better error message extraction
      let errorMessage = "An unexpected error occurred during sign in. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.originalError?.message) {
        errorMessage = error.originalError.message;
      } else if (error.details?.message) {
        errorMessage = error.details.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // ✅ ENHANCED: Specific error handling based on error type
      if (errorMessage.toLowerCase().includes("pending approval")) {
        openErrorDialog("Your account is currently pending approval. Please contact an administrator to activate your account.");
      } else if (errorMessage.toLowerCase().includes("invalid credentials")) {
        openErrorDialog("Invalid email or password. Please check your credentials and try again.");
      } else if (errorMessage.toLowerCase().includes("network error")) {
        openErrorDialog("Network error. Please check your internet connection and try again.");
      } else if (errorMessage.toLowerCase().includes("timeout")) {
        openErrorDialog("Request timeout. The server is taking too long to respond. Please try again.");
      } else if (errorMessage.toLowerCase().includes("recaptcha")) {
        openErrorDialog("CAPTCHA validation failed. Please refresh the page and try again.");
      } else if (errorMessage.toLowerCase().includes("server error")) {
        openErrorDialog("Server error. Please try again later or contact support.");
      } else if (errorMessage.toLowerCase().includes("access denied")) {
        openErrorDialog("Access denied. Please contact an administrator for assistance.");
      } else {
        openErrorDialog(errorMessage);
      }

      resetCaptcha();
    } finally {
      console.log("🏁 SignIn: Setting isSubmittingEmail to false");
      setIsSubmittingEmail(false);
    }
  };

  if (authProviderLoading || !isInitialized) {
    return <AuthLoadingScreen message="Initializing session..." />;
  }

  if (user && isInitialized) {
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!isConfigLoaded) {
    return <AuthLoadingScreen message="Loading configuration..." />;
  }

  if (!recaptchaSiteKey) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly or the site key is missing.<br />
          Please contact support or check your backend /api/config endpoint and environment variables.<br />
          <span className="text-xs">(No site key found in /api/config or environment)</span>
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-neutral-950
          ${isMobile ? 'h-[100dvh] px-1' : 'h-screen px-2 sm:px-4 md:px-6'}
        `}
      >
        <div className={
          `w-full max-w-md ` +
          (isMobile ? 'p-1' : 'p-2 sm:p-4')
        }>
          <div className="mb-6 flex flex-col items-center justify-center">
            <div className="flex justify-center w-full mt-0 mb-0">
              {LogoSimple ? <LogoSimple /> : <div className="text-destructive">Logo Error</div>}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-cedo-blue dark:text-blue-500 text-center whitespace-nowrap">City Education and Development Office</h1>
            <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400 text-center">Sign in to your account to continue</p>
          </div>

          <Card className={
            `border-0 shadow-lg dark:bg-neutral-900 dark:border-neutral-700 ` +
            (isMobile ? 'rounded-lg' : '')
          }>
            <CardContent className={
              `pt-6 ` +
              (isMobile ? 'p-2' : '')
            }>
              {isGoogleAuthProcessing && (
                <div className="mb-4 w-full min-h-[40px] flex justify-center items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading Google Sign-In...</span>
                </div>
              )}
              <div
                id={GOOGLE_BUTTON_CONTAINER_ID}
                className="mb-4 w-full min-h-[40px] flex justify-center items-center"
                style={{ display: isGoogleAuthProcessing ? 'none' : 'flex' }}
              >
              </div>

              <div className="relative my-4">
                <Separator className="dark:bg-neutral-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card dark:bg-neutral-900 px-2 text-sm text-muted-foreground dark:text-gray-400">or continue with email</span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                            <Input
                              placeholder="your.email@example.com"
                              type="email"
                              autoComplete="email"
                              className="pl-10 pr-2 w-full dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-600"
                              disabled={isSubmittingEmail || isSubmittingGoogle}
                              {...field}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="dark:text-gray-300">Password</FormLabel>
                          <Link href="/forgot-password" tabIndex={-1} className="text-xs text-cedo-blue hover:underline dark:text-blue-400">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                            <Input
                              placeholder="••••••••"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              className="pl-10 pr-10 w-full dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-600"
                              disabled={isSubmittingEmail || isSubmittingGoogle}
                              {...field}
                              value={field.value || ''}
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent dark:text-gray-400 dark:hover:bg-neutral-700"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isSubmittingEmail || isSubmittingGoogle}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                data-testid="show-password-toggle"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {recaptchaSiteKey && (
                    <div className="flex justify-center my-4" data-testid="recaptcha-container">
                      <Suspense fallback={
                        <div className="flex justify-center items-center p-4">
                          <div className="text-sm text-muted-foreground">Loading security verification...</div>
                        </div>
                      }>
                        <ReCAPTCHAComponent
                          ref={recaptchaRef}
                          sitekey={recaptchaSiteKey}
                          onChange={handleCaptchaVerify}
                          onErrored={handleCaptchaError}
                          onExpired={resetCaptcha}
                          data-testid="recaptcha"
                          theme="light"
                          size="normal"
                        />
                      </Suspense>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmittingEmail || isSubmittingGoogle}
                              className="dark:border-neutral-600"
                              data-testid="remember-me-checkbox"
                            />
                          </FormControl>
                          <FormLabel
                            className="text-sm font-normal cursor-pointer dark:text-gray-300"
                            title="Save your email for faster future logins. Your password is never saved."
                          >
                            Remember me
                          </FormLabel>
                        </div>
                        {/* Clear saved data option */}
                        {localStorage.getItem('cedo_remember_me') === 'true' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => {
                              try {
                                localStorage.removeItem('cedo_remembered_email');
                                localStorage.removeItem('cedo_remember_me');
                                localStorage.removeItem('cedo_remember_timestamp');
                                form.setValue('rememberMe', false);
                                toast({
                                  title: "Cleared",
                                  description: "Saved login information has been cleared.",
                                  variant: "default",
                                });
                                console.log('✅ SignIn: Manually cleared saved credentials');
                              } catch (error) {
                                console.warn('⚠️ SignIn: Failed to clear saved credentials:', error);
                              }
                            }}
                            disabled={isSubmittingEmail || isSubmittingGoogle}
                          >
                            Clear saved
                          </Button>
                        )}
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isSubmittingEmail || isSubmittingGoogle || (recaptchaSiteKey && !captchaToken)}>
                    {isSubmittingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingEmail ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300 ease-out" />
          <DialogContent
            className="fixed top-1/2 left-1/2 w-full max-w-sm transform -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby={errorDialogTitleId}
            aria-describedby={errorDialogDescriptionId}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col space-y-4"
            >
              <DialogHeader>
                <DialogTitle id={errorDialogTitleId} className="text-xl font-bold text-red-600 dark:text-red-500">
                  Sign In Failed
                </DialogTitle>
              </DialogHeader>
              <DialogDescription id={errorDialogDescriptionId} className="text-sm text-gray-700 dark:text-gray-300">
                {errorDialogMessage}
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/30 transition-colors duration-150"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

// Main page component with Suspense wrapper
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInContentLoading />}>
      <AuthErrorBoundary>
        <SignInContent />
      </AuthErrorBoundary>
    </Suspense>
  );
}
