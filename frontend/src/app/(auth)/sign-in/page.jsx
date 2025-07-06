<<<<<<< HEAD
"use client";

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

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
import { ROLES, useAuth } from "@/contexts/auth-context"; // Ensure ROLES are correctly imported if used here
import { useIsMobile } from "@/hooks/use-mobile";
import { config } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Dynamic import for Google reCAPTCHA
const ReCAPTCHAComponent = dynamicImport(() => import("react-google-recaptcha"), { ssr: false });

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
        <CardHeader className="space-y-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </CardHeader>
        <CardContent className="space-y-4">
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

// Component that uses useSearchParams
function SignInContent() {
  const { signIn, signInWithGoogleAuth, user, isLoading: authProviderLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const recaptchaRef = useRef(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState("An unexpected error occurred. Please try again.");
  const errorDialogTitleId = "error-dialog-title";
  const errorDialogDescriptionId = "error-dialog-description";

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(false);
  const [googleButtonRetryCount, setGoogleButtonRetryCount] = useState(0); // Track retry attempts

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const recaptchaSiteKey = config.recaptchaSiteKey;
  const GOOGLE_BUTTON_CONTAINER_ID = "google-signin-button-container";

  const isMobile = useIsMobile();

  // Initialize React Hook Form
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Reset Google button state for retry attempts
  const resetGoogleButtonState = useCallback((reason = "error") => {
    console.log(`🔄 SignIn: Resetting Google button state due to: ${reason}`);
    setIsGoogleButtonRendered(false);
    setIsGoogleAuthProcessing(false);
    // Increment retry count to force useEffect to run again
    setGoogleButtonRetryCount(prev => prev + 1);
  }, []);

  // Enhanced effect to reset Google button state when user becomes null (after sign-out)
  useEffect(() => {
    if (isInitialized && !user) {
      console.log("🔄 SignIn: User is null and initialized, resetting Google button state");
      setIsGoogleButtonRendered(false);
      setIsGoogleAuthProcessing(false);
      setIsErrorDialogOpen(false); // Close any error dialogs

      // Add a small delay to ensure any ongoing Google operations are fully cleaned up
      const cleanupDelay = setTimeout(() => {
        console.log("✅ SignIn: Cleanup delay completed, ready for Google button initialization");
        setGoogleButtonRetryCount(prev => prev + 1); // Force re-render
      }, 1000); // 1 second delay to ensure cleanup is complete

      return () => clearTimeout(cleanupDelay);
    }
  }, [isInitialized, user]);

  const openErrorDialog = useCallback((message, error = null) => {
    console.log("⚠️ SignIn: Opening error dialog:", message);

    // Check if this is a pending approval error
    if (error?.isPendingApproval || (message && message.toLowerCase().includes("pending approval"))) {
      setErrorDialogMessage("Your account is currently pending approval. Please contact an administrator to activate your account.");
    } else if (error?.isAccountNotFound || (message && message.toLowerCase().includes("account not found"))) {
      setErrorDialogMessage("Account not found. Please contact an administrator to create your account first.");
    } else if (message && (message.toLowerCase().includes("already in progress") || message.toLowerCase().includes("initializing"))) {
      // Special handling for the "already in progress" and delay errors
      setErrorDialogMessage("Google Sign-In is initializing. Please wait a moment and try again.");
      console.log("🔄 SignIn: Google Sign-In operation conflict detected, will reset after delay");

      // Auto-close this dialog and reset state after a short delay
      setTimeout(() => {
        setIsErrorDialogOpen(false);
        resetGoogleButtonState("operation_conflict");
      }, 2000);

      setIsErrorDialogOpen(true);
      return; // Exit early to prevent the normal retry logic
    } else {
      setErrorDialogMessage(message || "The email or password you entered is incorrect. Please check your credentials or try again.");
    }
    setIsErrorDialogOpen(true);

    // Reset Google button state to allow retry if the error allows it
    if (error?.allowRetry !== false) { // Default to allow retry unless explicitly disabled
      // Small delay to allow error dialog to show first
      setTimeout(() => {
        resetGoogleButtonState("authentication_error");
      }, 500);
    }
  }, [resetGoogleButtonState]);

  const handleAuthenticatedUserRedirect = useCallback(() => {
    console.log("🔄 handleAuthenticatedUserRedirect: Starting redirect check...");
    console.log("🔄 User:", user ? "Present" : "Not present");
    console.log("🔄 IsInitialized:", isInitialized);
    console.log("🔄 Current pathname:", pathname);

    if (!user || !isInitialized) {
      console.log("❌ handleAuthenticatedUserRedirect: No user or not initialized. Skipping redirect.");
      return;
    }

    console.log("✅ handleAuthenticatedUserRedirect: User data:", JSON.stringify(user, null, 2));
    let targetPath = "/";
    const redirectQueryParam = searchParams.get("redirect");
    console.log("🔄 Redirect query param:", redirectQueryParam);

    // Priority 1: Specific role-based redirects (e.g., student always to student-dashboard)
    if (user.role === ROLES.STUDENT) { // Assuming ROLES.STUDENT is "student"
      targetPath = "/student-dashboard";
      console.log("🎯 Student role detected, target:", targetPath);
    } else if (redirectQueryParam && redirectQueryParam !== pathname) {
      // Priority 2: Query parameter redirect
      targetPath = redirectQueryParam;
      console.log("🎯 Using redirect query param:", targetPath);
    } else if (user.dashboard) {
      // Priority 3: User's pre-defined dashboard from JWT
      targetPath = user.dashboard;
      console.log("🎯 Using user dashboard:", targetPath);
    } else if (user.role) {
      // Priority 4: General role-based redirects
      switch (user.role) {
        case ROLES.HEAD_ADMIN: // "head_admin"
        case ROLES.MANAGER:    // "manager"
          targetPath = "/admin-dashboard";
          console.log("🎯 Admin role detected, target:", targetPath);
          break;
        // ROLES.STUDENT is handled in Priority 1
        case ROLES.PARTNER: // "partner" - assuming they go to student dashboard
        case ROLES.REVIEWER: // "reviewer" - assuming they go to admin dashboard or a specific one
          targetPath = user.dashboard || (user.role === ROLES.PARTNER ? "/student-dashboard" : "/admin-dashboard");
          console.log("🎯 Partner/Reviewer role detected, target:", targetPath);
          break;
        default:
          targetPath = "/";
          console.log("🎯 Default role fallback, target:", targetPath);
      }
    }

    console.log(`🚀 Final targetPath determined: ${targetPath} for user role: ${user.role}`);
    console.log(`🚀 Current pathname: ${pathname}`);

    if (pathname !== targetPath) {
      console.log(`🚀 Redirecting from ${pathname} to ${targetPath}`);
      router.replace(targetPath);
    } else if (pathname === "/sign-in" && targetPath === "/sign-in") {
      // Avoid redirect loop if somehow target is sign-in page itself
      console.log("⚠️ Avoiding redirect loop, redirecting to home");
      router.replace("/");
    } else {
      console.log("✅ Already on correct path:", pathname);
    }
  }, [user, isInitialized, router, pathname, searchParams, ROLES]);

  // Enhanced effect for authenticated user redirect with immediate execution
  useEffect(() => {
    console.log("🔄 Redirect useEffect triggered");
    console.log("🔄 isInitialized:", isInitialized, "user:", !!user);

    if (isInitialized && user) {
      console.log("🚀 Calling handleAuthenticatedUserRedirect immediately");
      handleAuthenticatedUserRedirect();
    }
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);

  // Additional effect to handle cases where user data changes
  useEffect(() => {
    console.log("🔄 User change effect triggered");
    if (user && isInitialized && pathname === "/sign-in") {
      console.log("🚀 User exists on sign-in page, forcing redirect");
      // Force immediate redirect if we're on sign-in page with authenticated user
      const timeoutId = setTimeout(() => {
        handleAuthenticatedUserRedirect();
      }, 100); // Small delay to ensure state is settled

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
      // Cleanup Google button container on unmount
      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
      if (container) {
        try {
          // Only clear Google-generated content
          const googleButtons = container.querySelectorAll('.g_id_signin, .g-signin2, [data-client_id]');
          googleButtons.forEach(button => {
            if (button.parentNode === container) {
              container.removeChild(button);
            }
          });
        } catch (cleanupError) {
          console.warn("Error during Google button cleanup:", cleanupError.message);
        }
      }
    };
  }, []);

  // Separate effect to handle post-sign-out delay detection
  useEffect(() => {
    if (isInitialized && !user && typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp) {
      const timeSinceSignOut = Date.now() - window.__cedoGoogleSignOutTimestamp;
      if (timeSinceSignOut < 3000) {
        const remainingDelay = 3000 - timeSinceSignOut;
        console.log(`⏳ SignIn: Recent sign-out detected, silently waiting ${remainingDelay}ms before Google button`);

        // Show loading state during delay
        setIsGoogleAuthProcessing(true);

        const silentDelay = setTimeout(() => {
          delete window.__cedoGoogleSignOutTimestamp;
          console.log("✅ SignIn: Silent delay completed, ready for Google button");
          setIsGoogleAuthProcessing(false);
          setGoogleButtonRetryCount(prev => prev + 1); // Trigger Google button initialization
        }, remainingDelay);

        return () => clearTimeout(silentDelay);
      } else {
        // Clear the timestamp if enough time has passed
        delete window.__cedoGoogleSignOutTimestamp;
        console.log("✅ SignIn: Sign-out delay period already completed");
      }
    }
  }, [isInitialized, user]); // Removed isGoogleAuthProcessing from dependencies

  useEffect(() => {
    console.log("🔄 SignIn: Google button useEffect triggered", {
      isInitialized,
      hasUser: !!user,
      isGoogleButtonRendered,
      isGoogleAuthProcessing,
      hasWindow: typeof window !== 'undefined',
      hasSignInWithGoogleAuth: !!signInWithGoogleAuth,
      retryCount: googleButtonRetryCount,
      hasSignOutTimestamp: !!(typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp)
    });

    // Only initialize Google button if we're not in a delay period
    if (isInitialized && !user && !isGoogleButtonRendered && !isGoogleAuthProcessing && typeof window !== 'undefined' && signInWithGoogleAuth) {

      // Skip if we're still in sign-out delay period
      if (typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp) {
        const timeSinceSignOut = Date.now() - window.__cedoGoogleSignOutTimestamp;
        if (timeSinceSignOut < 3000) {
          console.log("⏭️ SignIn: Still in sign-out delay period, skipping Google button initialization");
          return;
        }
      }

      // Check if we just signed out (user was null for less than 2 seconds) - secondary check
      const timeSinceInitialized = Date.now() - (window.__cedoSignInPageLoadTime || Date.now());
      if (timeSinceInitialized < 2000) {
        console.log("⏳ SignIn: Recently initialized, adding delay before Google button");
        const initDelay = setTimeout(() => {
          setGoogleButtonRetryCount(prev => prev + 1); // Trigger re-evaluation
        }, 1500);
        return () => clearTimeout(initDelay);
      }

      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);

      if (container) {
        console.log("🚀 SignIn: Starting Google button initialization");
        // Set a UI loading state. This state should NOT be in the dependency array
        // if its only purpose is to show a spinner during this specific operation.
        setIsGoogleAuthProcessing(true); // For UI feedback, like showing your Loader2

        signInWithGoogleAuth(container)
          .then((userData) => {
            // This will be called when the user successfully authenticates with Google
            setIsGoogleButtonRendered(true); // Mark that rendering was initiated successfully
            console.log("✅ SignIn: Google Sign-In successful:", userData);
            // The auth context will handle the redirect, so we don't need to do anything here
          })
          .catch((error) => {
            console.log("❌ SignIn: Google Sign-In error:", error.message);

            // Only show error dialogs for actual user-initiated failures, not system delays
            if (error.isDelay) {
              console.log("⏭️ SignIn: Delay error detected, will retry silently");
              // Don't show error dialog for delay errors, just retry
              setTimeout(() => {
                setIsGoogleButtonRendered(false);
                setIsGoogleAuthProcessing(false);
                setGoogleButtonRetryCount(prev => prev + 1);
              }, 1000);
            } else if (error.isPendingApproval) {
              openErrorDialog(error.message, error);
            } else if (error.message && error.message.toLowerCase().includes("already in progress")) {
              // Still handle the old error message format
              console.log("⏭️ SignIn: 'Already in progress' error, will retry silently");
              setTimeout(() => {
                setIsGoogleButtonRendered(false);
                setIsGoogleAuthProcessing(false);
                setGoogleButtonRetryCount(prev => prev + 1);
              }, 1000);
            } else {
              // For other actual errors (button initialization or other auth errors)
              openErrorDialog(error.message || "Failed to sign in with Google. Please try again.");
            }

            setIsGoogleButtonRendered(true); // Prevent loop
          })
          .finally(() => {
            // Ensure the page-level UI processing flag is reset regardless of outcome.
            setIsGoogleAuthProcessing(false);
            console.log("✅ SignIn: Google button initialization completed");
          });
      } else {
        console.warn("⚠️ SignIn: Google button container not found");
      }
    } else {
      console.log("⏭️ SignIn: Skipping Google button initialization due to conditions not met");
    }

    // CRITICAL CHANGE: Removed `isGoogleAuthProcessing` from the dependency array.
    // Ensure `openErrorDialog` is stable (e.g., useCallback with empty or truly stable dependencies).
    // `signInWithGoogleAuth` from `useAuth` should already be stable if defined with `useCallback` in the context.
  }, [isInitialized, user, isGoogleButtonRendered, signInWithGoogleAuth, openErrorDialog, googleButtonRetryCount]);

  // Track when the sign-in page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__cedoSignInPageLoadTime = Date.now();
      console.log("📝 SignIn: Page load time recorded");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    form.setValue(name, type === "checkbox" ? checked : value);
  };

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
    console.log("reCAPTCHA reset and token cleared.");
  }, []);

  const handleCaptchaVerify = useCallback((token) => {
    if (token) {
      console.log("reCAPTCHA verified, token obtained:", token);
      setCaptchaToken(token);
    } else {
      console.warn("reCAPTCHA verification returned null or empty token. Resetting.");
      resetCaptcha(); // Call resetCaptcha to ensure UI and state are clean
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
    if (isSubmittingEmail || isSubmittingGoogle) return;

    console.log("handleSubmit: Checking CAPTCHA token. Current token:", captchaToken);
    if (!captchaToken && recaptchaSiteKey) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "warning",
      });
      return;
    }

    console.log("Attempting sign-in. Email:", data.email, "CAPTCHA Token being sent:", captchaToken);

    setIsSubmittingEmail(true);
    try {
      const userData = await signIn(data.email, data.password, data.rememberMe, captchaToken);

      if (userData) {
        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
          variant: "success",
        });
        // Redirect logic is handled by useEffect watching `user` state.
      } else {
        // This 'else' block might not be hit if signIn throws an error for auth failure.
        // The catch block is more likely to handle failed sign-in attempts.
        openErrorDialog("Authentication failed. Please check your email and password.");
        resetCaptcha();
      }
    } catch (error) {
      // Check if this is a pending approval error
      if (error.message && error.message.toLowerCase().includes("pending approval")) {
        openErrorDialog("Your account is currently pending approval. Please contact an administrator to activate your account.");
      } else {
        openErrorDialog(error.message || "An unexpected error occurred during sign in. Please try again.");
      }

      resetCaptcha();
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (authProviderLoading || !isInitialized) {
    return <AuthLoadingScreen message="Initializing session..." />;
  }

  if (user && isInitialized) {
    // Already signed in, redirect is handled by useEffect. Show loading until redirect happens.
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!recaptchaSiteKey && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive container: full viewport height, centered content, no scroll */}
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
            {/* Center the logo and add margin below */}
            <div className="flex justify-center w-full mt-0 mb-0">
              {LogoSimple ? <LogoSimple /> : <div className="text-destructive">Logo Error</div>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-cedo-blue dark:text-blue-400 text-center">Welcome back</h1>
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
              <div
                id={GOOGLE_BUTTON_CONTAINER_ID}
                key={`google-button-${isGoogleButtonRendered ? 'rendered' : 'pending'}`}
                className="mb-4 w-full min-h-[40px] flex justify-center items-center"
                aria-live="polite"
                role="status"
              >
                {isGoogleAuthProcessing && !isGoogleButtonRendered && (
                  <div className="flex items-center justify-center p-2 text-sm text-muted-foreground dark:text-gray-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading Google Sign-In...</span>
                  </div>
                )}
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
                            />
                            {/* Only show the toggle button if there is a password value */}
                            {field.value && (
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent dark:text-gray-400 dark:hover:bg-neutral-700" onClick={() => setShowPassword(!showPassword)} disabled={isSubmittingEmail || isSubmittingGoogle} aria-label={showPassword ? "Hide password" : "Show password"}>
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
                    <div className="flex justify-center my-4">
                      <ReCAPTCHAComponent
                        ref={recaptchaRef}
                        sitekey={recaptchaSiteKey}
                        onChange={handleCaptchaVerify}
                        onErrored={handleCaptchaError}
                        onExpired={resetCaptcha}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmittingEmail || isSubmittingGoogle}
                            className="dark:border-neutral-600"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer dark:text-gray-300">
                          Remember me
                        </FormLabel>
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
            aria-labelledby={errorDialogTitleId}
            aria-describedby={errorDialogDescriptionId} // Add this
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col space-y-4"
            >
              <DialogHeader>
                {/* Add id to DialogTitle */}
                <DialogTitle id={errorDialogTitleId} className="text-xl font-bold text-red-600 dark:text-red-500">
                  Sign In Failed
                </DialogTitle>
              </DialogHeader>
              {/* Add id to DialogDescription */}
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
      <SignInContent />
    </Suspense>
  );
}
=======
"use client";

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

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
import { ROLES, useAuth } from "@/contexts/auth-context"; // Ensure ROLES are correctly imported if used here
import { useIsMobile } from "@/hooks/use-mobile";
import { config, loadConfig } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Dynamic import for Google reCAPTCHA
const ReCAPTCHAComponent = dynamicImport(() => import("react-google-recaptcha"), { ssr: false });

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
        <CardHeader className="space-y-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </CardHeader>
        <CardContent className="space-y-4">
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

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(false);
  const [googleButtonRetryCount, setGoogleButtonRetryCount] = useState(0); // Track retry attempts

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);
  const GOOGLE_BUTTON_CONTAINER_ID = "google-signin-button-container";

  const isMobile = useIsMobile();

  // Initialize React Hook Form
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const openErrorDialog = useCallback((message, errorDetails = null) => {
    // console.log("⚠️ SignIn: Opening error dialog:", message);
    setErrorDialogMessage(message);
    // setErrorDialogDetails(errorDetails); // This state was not defined, removing for now
    setIsErrorDialogOpen(true);
  }, []);

  // Effect to handle Google Sign-In errors from the context
  useEffect(() => {
    if (googleError) {
      openErrorDialog(googleError.description);
      // Clear the error in the context so the dialog doesn't re-appear on re-renders
      clearGoogleError();
    }
  }, [googleError, clearGoogleError, openErrorDialog]);

  // Effect to load config on component mount
  useEffect(() => {
    async function initializeConfig() {
      await loadConfig();
      setRecaptchaSiteKey(config.recaptchaSiteKey);
    }
    initializeConfig();
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

      // Immediate retry without delay
      setGoogleButtonRetryCount(prev => prev + 1);
    }
  }, [isInitialized, user, resetGoogleButtonState]);

  const handleSignInConflict = useCallback(() => {
    // console.log("🔄 SignIn: Google Sign-In operation conflict detected, will reset after delay");
    setIsGoogleAuthProcessing(false);
    setIsGoogleButtonRendered(false);

    // Add a longer delay for conflict resolution
    setTimeout(() => {
      setGoogleButtonRetryCount(prev => prev + 1);
    }, 2000);
  }, []);

  const handleAuthenticatedUserRedirect = useCallback(() => {
    // console.log("🔄 handleAuthenticatedUserRedirect: Starting redirect check...");
    // console.log("🔄 User:", user ? "Present" : "Not present");
    // console.log("🔄 IsInitialized:", isInitialized);
    // console.log("🔄 Current pathname:", pathname);

    if (!user || !isInitialized) {
      // console.log("❌ handleAuthenticatedUserRedirect: No user or not initialized. Skipping redirect.");
      return;
    }

    // console.log("✅ handleAuthenticatedUserRedirect: User authenticated");
    let targetPath = "/";
    const redirectQueryParam = searchParams.get("redirect");
    // console.log("🔄 Redirect query param:", redirectQueryParam);

    // Priority 1: Specific role-based redirects (e.g., student always to student-dashboard)
    if (user.role === ROLES.STUDENT) { // Assuming ROLES.STUDENT is "student"
      targetPath = "/student-dashboard";
      // console.log("🎯 Student role detected, target:", targetPath);
    } else if (redirectQueryParam && redirectQueryParam !== pathname) {
      // Priority 2: Query parameter redirect
      targetPath = redirectQueryParam;
      // console.log("🎯 Using redirect query param:", targetPath);
    } else if (user.dashboard) {
      // Priority 3: User's pre-defined dashboard from JWT
      targetPath = user.dashboard;
      // console.log("🎯 Using user dashboard:", targetPath);
    } else if (user.role) {
      // Priority 4: General role-based redirects
      switch (user.role) {
        case ROLES.HEAD_ADMIN: // "head_admin"
        case ROLES.MANAGER:    // "manager"
          targetPath = "/admin-dashboard";
          // console.log("🎯 Admin role detected, target:", targetPath);
          break;
        // ROLES.STUDENT is handled in Priority 1
        case ROLES.PARTNER: // "partner" - assuming they go to student dashboard
        case ROLES.REVIEWER: // "reviewer" - assuming they go to admin dashboard or a specific one
          targetPath = user.dashboard || (user.role === ROLES.PARTNER ? "/student-dashboard" : "/admin-dashboard");
          // console.log("🎯 Partner/Reviewer role detected, target:", targetPath);
          break;
        default:
          targetPath = "/";
        // console.log("🎯 Default role fallback, target:", targetPath);
      }
    }

    // console.log(`🚀 Final targetPath determined: ${targetPath} for user role: ${user.role}`);
    // console.log(`🚀 Current pathname: ${pathname}`);

    if (pathname !== targetPath) {
      // console.log(`🚀 Redirecting from ${pathname} to ${targetPath}`);
      router.replace(targetPath);
    } else if (pathname === "/sign-in" && targetPath === "/sign-in") {
      // Avoid redirect loop if somehow target is sign-in page itself
      // console.log("⚠️ Avoiding redirect loop, redirecting to home");
      router.replace("/");
    } else {
      // console.log("✅ Already on correct path:", pathname);
    }
  }, [user, isInitialized, router, pathname, searchParams, ROLES]);

  // Enhanced effect for authenticated user redirect with immediate execution
  useEffect(() => {
    // console.log("🔄 Redirect useEffect triggered");
    // console.log("🔄 isInitialized:", isInitialized, "user:", !!user);

    if (isInitialized && user) {
      // console.log("🚀 Calling handleAuthenticatedUserRedirect immediately");
      handleAuthenticatedUserRedirect();
    }
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);

  // Additional effect to handle cases where user data changes
  useEffect(() => {
    // console.log("🔄 User change effect triggered");
    if (user && isInitialized && pathname === "/sign-in") {
      // console.log("🚀 User exists on sign-in page, forcing redirect");
      // Force immediate redirect if we're on sign-in page with authenticated user
      const timeoutId = setTimeout(() => {
        handleAuthenticatedUserRedirect();
      }, 100); // Small delay to ensure state is settled

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
      // Cleanup Google button container on unmount
      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
      if (container) {
        // Use innerHTML = '' for a safer cleanup that is less likely to
        // conflict with React's own DOM management.
        container.innerHTML = '';
      }
    };
  }, []);

  // Simplified effect to handle post-sign-out delay detection
  useEffect(() => {
    if (isInitialized && !user && typeof window !== 'undefined' && window.__cedoGoogleSignOutTimestamp) {
      const timeSinceSignOut = Date.now() - window.__cedoGoogleSignOutTimestamp;
      if (timeSinceSignOut < 1000) { // Reduced delay to 1 second
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

  useEffect(() => {
    console.log("🔄 SignIn: Google button useEffect triggered", {
      isInitialized,
      hasUser: !!user,
      isGoogleButtonRendered,
      isGoogleAuthProcessing,
    });

    if (isInitialized && !user && !isGoogleButtonRendered) {
      const initGoogleButton = async () => {
        const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
        if (!container) {
          console.warn("⚠️ SignIn: Google button container not found, will retry.");
          // Retry if container not found initially
          setTimeout(() => setGoogleButtonRetryCount(prev => prev + 1), 500);
          return;
        }

        console.log("🚀 SignIn: Starting Google button initialization");
        setIsGoogleAuthProcessing(true);

        try {
          // This function now just handles rendering the button.
          // It throws an error if setup fails.
          await signInWithGoogleAuth(container);
          console.log("✅ SignIn: Google button render successful.");
          setIsGoogleButtonRendered(true);
        } catch (error) {
          console.error("❌ SignIn: Failed to render Google button:", error);
          toast({
            title: "Google Sign-In Error",
            description: "Could not initialize the Google Sign-In button. Please refresh the page.",
            variant: "destructive",
          });
          // Stop retrying if there's a setup error
        } finally {
          setIsGoogleAuthProcessing(false);
          console.log("✅ SignIn: Google button initialization process completed.");
        }
      };

      // Use a small delay to ensure the DOM is ready
      const timeoutId = setTimeout(initGoogleButton, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isInitialized, user, isGoogleButtonRendered, signInWithGoogleAuth, toast, googleButtonRetryCount]);

  // Track when the sign-in page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__cedoSignInPageLoadTime = Date.now();
      // console.log("📝 SignIn: Page load time recorded");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    form.setValue(name, type === "checkbox" ? checked : value);
  };

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
    // console.log("reCAPTCHA reset and token cleared.");
  }, []);

  const handleCaptchaVerify = useCallback((token) => {
    if (token) {
      // console.log("reCAPTCHA verified, token obtained:", token);
      setCaptchaToken(token);
    } else {
      console.warn("reCAPTCHA verification returned null or empty token. Resetting.");
      resetCaptcha(); // Call resetCaptcha to ensure UI and state are clean
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
    if (isSubmittingEmail || isSubmittingGoogle) return;

    // console.log("handleSubmit: Checking CAPTCHA token. Current token:", captchaToken);
    if (!captchaToken && recaptchaSiteKey) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "warning",
      });
      return;
    }

    // console.log("Attempting sign-in. CAPTCHA Token being sent:", !!captchaToken);

    setIsSubmittingEmail(true);
    try {
      const userData = await signIn(data.email, data.password, data.rememberMe, captchaToken);

      if (userData) {
        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
          variant: "success",
        });
        // Redirect logic is handled by useEffect watching `user` state.
      } else {
        // This 'else' block might not be hit if signIn throws an error for auth failure.
        // The catch block is more likely to handle failed sign-in attempts.
        openErrorDialog("Authentication failed. Please check your email and password.");
        resetCaptcha();
      }
    } catch (error) {
      // Check if this is a pending approval error
      if (error.message && error.message.toLowerCase().includes("pending approval")) {
        openErrorDialog("Your account is currently pending approval. Please contact an administrator to activate your account.");
      } else {
        openErrorDialog(error.message || "An unexpected error occurred during sign in. Please try again.");
      }

      resetCaptcha();
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (authProviderLoading || !isInitialized) {
    return <AuthLoadingScreen message="Initializing session..." />;
  }

  if (user && isInitialized) {
    // Already signed in, redirect is handled by useEffect. Show loading until redirect happens.
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!recaptchaSiteKey && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive container: full viewport height, centered content, no scroll */}
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
            {/* Center the logo and add margin below */}
            <div className="flex justify-center w-full mt-0 mb-0">
              {LogoSimple ? <LogoSimple /> : <div className="text-destructive">Logo Error</div>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-cedo-blue dark:text-blue-400 text-center">Welcome back</h1>
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
              {/* 
                This section is structured to prevent React DOM conflicts with the Google GSI library.
                1. A separate div is used for the loading indicator, managed by React state.
                2. The Google button container is always in the DOM but hidden/shown with CSS.
                   It has NO React children, so React doesn't try to manage its contents.
              */}
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
                {/* This container is exclusively for the Google GSI button and has no React children */}
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
                            />
                            {/* Only show the toggle button if there is a password value */}
                            {field.value && (
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent dark:text-gray-400 dark:hover:bg-neutral-700" onClick={() => setShowPassword(!showPassword)} disabled={isSubmittingEmail || isSubmittingGoogle} aria-label={showPassword ? "Hide password" : "Show password"}>
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
                    <div className="flex justify-center my-4">
                      <ReCAPTCHAComponent
                        ref={recaptchaRef}
                        sitekey={recaptchaSiteKey}
                        onChange={handleCaptchaVerify}
                        onErrored={handleCaptchaError}
                        onExpired={resetCaptcha}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmittingEmail || isSubmittingGoogle}
                            className="dark:border-neutral-600"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer dark:text-gray-300">
                          Remember me
                        </FormLabel>
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
            aria-labelledby={errorDialogTitleId}
            aria-describedby={errorDialogDescriptionId} // Add this
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col space-y-4"
            >
              <DialogHeader>
                {/* Add id to DialogTitle */}
                <DialogTitle id={errorDialogTitleId} className="text-xl font-bold text-red-600 dark:text-red-500">
                  Sign In Failed
                </DialogTitle>
              </DialogHeader>
              {/* Add id to DialogDescription */}
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
      <SignInContent />
    </Suspense>
  );
}
>>>>>>> 4336112 (Refactor and enhance backend and frontend components)
