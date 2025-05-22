"use client";

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
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, useAuth } from "@/contexts/auth-context";
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignInPage() {
  const { signIn, signInWithGoogleAuth, user, isLoading: authProviderLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const recaptchaRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  // isSubmittingGoogle is kept as it's used to disable other form elements during any Google sign-in attempt.
  // The auth-context should ideally manage this state when the SDK's Google sign-in process is active.
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // States for Google SDK button rendering
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("An unexpected error occurred. Please try again.");

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const GOOGLE_BUTTON_CONTAINER_ID = "google-signin-button-container";

  const openErrorDialog = useCallback((message) => {
    setErrorDialogMessage(message || "The email or password you entered is incorrect. Please check your credentials or try again.");
    setIsErrorDialogOpen(true);
  }, [setErrorDialogMessage, setIsErrorDialogOpen]);

  const handleAuthenticatedUserRedirect = useCallback(() => {
    if (!user || !isInitialized) {
      console.log("handleAuthenticatedUserRedirect: No user or not initialized. Skipping redirect.");
      return;
    }

    // For debugging:
    console.log("handleAuthenticatedUserRedirect: User data:", JSON.stringify(user, null, 2));
    console.log("handleAuthenticatedUserRedirect: Current pathname:", pathname);
    console.log("handleAuthenticatedUserRedirect: Search params redirect:", searchParams.get("redirect"));

    let targetPath = "/"; // Default target path

    // --- **PRIORITY 1: Specific role-based redirects** ---
    // Ensure students are always directed to their specific dashboard
    if (user.role === ROLES.student) {
      targetPath = "/student-dashboard";
      console.log(`Role is student, setting targetPath to /student-dashboard`);
    }
    // Add other high-priority role redirects here if needed, e.g.:
    // else if (user.role === ROLES.some_other_specific_role) {
    //   targetPath = "/specific-other-dashboard";
    // }
    else {
      // --- **PRIORITY 2: Query parameter redirect** ---
      const redirectQueryParam = searchParams.get("redirect");
      if (redirectQueryParam && redirectQueryParam !== pathname) {
        targetPath = redirectQueryParam;
        console.log(`Using redirectQueryParam, setting targetPath to ${targetPath}`);
      }
      // --- **PRIORITY 3: User's pre-defined dashboard (if not overridden by specific role logic above)** ---
      else if (user.dashboard) {
        targetPath = user.dashboard;
        console.log(`Using user.dashboard, setting targetPath to ${targetPath}`);
      }
      // --- **PRIORITY 4: General role-based redirects (for roles not handled in PRIORITY 1)** ---
      else if (user.role) {
        console.log(`Evaluating role ${user.role} for general redirection.`);
        switch (user.role) {
          case ROLES.head_admin:
          case ROLES.manager:
            targetPath = "/admin-dashboard";
            break;
          // ROLES.student is handled above, so it won't be re-evaluated here.
          default:
            targetPath = "/"; // Default for other authenticated roles
            break;
        }
        console.log(`General role switch set targetPath to ${targetPath}`);
      }
      // --- **PRIORITY 5: Absolute fallback** ---
      else {
        targetPath = "/"; // Fallback if no role and no other conditions met
        console.log(`No specific conditions met, defaulting targetPath to /`);
      }
    }

    console.log(`Final targetPath determined: ${targetPath}`);

    if (pathname !== targetPath) {
      console.log(`Attempting to redirect from ${pathname} to ${targetPath} (User role: ${user.role})`);
      router.replace(targetPath);
    } else if (pathname === "/sign-in") {
      // If already on sign-in, and targetPath is also /sign-in (which shouldn't happen with proper logic),
      // redirect to a sensible default like "/" to avoid a loop.
      const finalRedirectPath = targetPath === "/sign-in" ? "/" : targetPath;
      console.log(`Attempting to redirect from ${pathname} (sign-in page) to ${finalRedirectPath} (User role: ${user.role})`);
      router.replace(finalRedirectPath);
    } else {
      console.log(`No redirection needed. Pathname ${pathname} is already targetPath ${targetPath}. (User role: ${user.role})`);
    }
  }, [user, isInitialized, router, pathname, searchParams, ROLES]);

  useEffect(() => {
    if (isInitialized && user) {
      handleAuthenticatedUserRedirect();
    }
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);

  useEffect(() => {
    let timer;
    if (isErrorDialogOpen) {
      timer = setTimeout(() => {
        setIsErrorDialogOpen(false);
      }, 6000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isErrorDialogOpen]);

  useEffect(() => {
    // This effect handles the rendering of the Google Sign-In button via the SDK
    if (isInitialized && !user && !isGoogleButtonRendered && typeof window !== 'undefined' && signInWithGoogleAuth) {
      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
      if (container) {
        // Ensure the container is empty before attempting to render the button
        // This check might be too simplistic if the SDK modifies the container in a way that innerHTML doesn't capture well.
        // Or if the button rendering itself is idempotent.
        if (container.innerHTML.trim() === "" || !isGoogleAuthProcessing) {
          setIsGoogleAuthProcessing(true);
          // setIsSubmittingGoogle(true); // Optionally set this if signInWithGoogleAuth also initiates the flow

          signInWithGoogleAuth(GOOGLE_BUTTON_CONTAINER_ID)
            .then(() => {
              setIsGoogleButtonRendered(true);
              setIsGoogleAuthProcessing(false);
              // setIsSubmittingGoogle(false); // Reset if set above
            })
            .catch((error) => {
              setIsGoogleAuthProcessing(false);
              // setIsSubmittingGoogle(false); // Reset if set above
              // Avoid opening dialog if button is already rendered by another attempt or previous state
              if (!isGoogleButtonRendered) {
                openErrorDialog(error.message || "Failed to render Google Sign-In button. Please try refreshing.");
              }
              console.error("Google Sign-In button rendering error:", error);
            });
        } else if (container.innerHTML.trim() !== "") {
          // If container has content, assume button is already rendered or being rendered.
          setIsGoogleButtonRendered(true);
          setIsGoogleAuthProcessing(false);
        }
      }
    }
    // Dependencies:
    // - isInitialized, user, isGoogleButtonRendered: Control when the effect runs.
    // - signInWithGoogleAuth: Function from context (assumed stable or memoized).
    // - openErrorDialog: Memoized error handler.
    // - setIsGoogleButtonRendered, setIsGoogleAuthProcessing: State setters.
  }, [isInitialized, user, isGoogleButtonRendered, signInWithGoogleAuth, openErrorDialog, setIsGoogleButtonRendered, setIsGoogleAuthProcessing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  }, []);

  const handleCaptchaVerify = useCallback((token) => {
    if (token) {
      setCaptchaToken(token);
    } else {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingEmail || isSubmittingGoogle) return;

    if (!captchaToken && recaptchaSiteKey) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "warning",
      });
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const userData = await signIn(formData.email, formData.password, formData.rememberMe, captchaToken);
      if (userData) {
        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
          variant: "success",
        });
      } else {
        openErrorDialog("Authentication failed. Please check your email and password.");
        resetCaptcha();
      }
    } catch (error) {
      openErrorDialog(error.message || "An unexpected error occurred during sign in. Please try again.");
      resetCaptcha();
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // handleGoogleSignIn function is removed as the SDK button handles its own click.
  // The isSubmittingGoogle state should be managed by the auth context during the actual sign-in flow.

  if (authProviderLoading || !isInitialized) {
    return <AuthLoadingScreen message="Initializing session..." />;
  }

  if (user && isInitialized) {
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!recaptchaSiteKey && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly.
          <br />
          Please contact support.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-gray-50 dark:bg-neutral-950">
        <div className="w-full max-w-md p-4">
          <div className="mb-8 text-center">
            {LogoSimple ? <LogoSimple /> : <div className="text-destructive">Logo Error</div>}
            <h1 className="mt-4 text-2xl font-bold text-cedo-blue dark:text-blue-400">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <Card className="border-0 shadow-lg dark:bg-neutral-900 dark:border-neutral-700">
            <CardContent className="pt-6">
              {/* Container for the Google Sign-In button, to be populated by the SDK */}
              {/* Added min-h-[40px] and flex centering for better visibility of the loader and button area */}
              <div
                id={GOOGLE_BUTTON_CONTAINER_ID}
                className="mb-4 w-full min-h-[40px] flex justify-center items-center"
                aria-live="polite" // For screen readers to announce changes (loader, button)
              >
                {/* Show a loading indicator while Google button is processing/rendering and not yet rendered */}
                {isGoogleAuthProcessing && !isGoogleButtonRendered && (
                  <div className="flex items-center justify-center p-2 text-sm text-muted-foreground dark:text-gray-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading Google Sign-In...</span>
                  </div>
                )}
                {/* Google's button will be rendered here by the SDK. */}
                {/* If isGoogleButtonRendered is true, the SDK should have placed its button. */}
                {/* If !isGoogleAuthProcessing and !isGoogleButtonRendered and !user, it means an attempt to render might be needed or failed silently. */}
              </div>

              <div className="relative my-4">
                <Separator className="dark:bg-neutral-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card dark:bg-neutral-900 px-2 text-sm text-muted-foreground dark:text-gray-400">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel htmlFor="email" className="dark:text-gray-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                        <Input id="email" placeholder="your.email@example.com" type="email" autoComplete="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-600" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="password" className="dark:text-gray-300">Password</FormLabel>
                      <Link href="/forgot-password" tabIndex={-1} className="text-xs text-cedo-blue hover:underline dark:text-blue-400">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                        <Input id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="current-password" name="password" value={formData.password} onChange={handleChange} className="pl-10 dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-600" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent dark:text-gray-400 dark:hover:bg-neutral-700" onClick={() => setShowPassword(!showPassword)} disabled={isSubmittingEmail || isSubmittingGoogle} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  {recaptchaSiteKey && (
                    <div className="flex justify-center my-4">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={recaptchaSiteKey}
                        onChange={handleCaptchaVerify}
                        onErrored={handleCaptchaError}
                        onExpired={resetCaptcha}
                      />
                    </div>
                  )}

                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox id="rememberMe" name="rememberMe" checked={formData.rememberMe} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: !!checked }))} disabled={isSubmittingEmail || isSubmittingGoogle} className="dark:border-neutral-600" />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer dark:text-gray-300">
                      Remember me
                    </FormLabel>
                  </FormItem>

                  <Button type="submit" className="w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isSubmittingEmail || isSubmittingGoogle || (recaptchaSiteKey && !captchaToken)}>
                    {isSubmittingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingEmail ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-3 bg-muted/50 dark:bg-neutral-800/50 rounded-md border dark:border-neutral-700">
                <h3 className="text-sm font-medium text-foreground/80 dark:text-gray-300 mb-2">Demo Accounts:</h3>
                <div className="space-y-2 text-xs text-muted-foreground dark:text-gray-400">
                  <div><p><strong>Head Admin:</strong> admin@cedo.gov.ph / admin123</p></div>
                  <div><p><strong>System Manager:</strong> manager@cedo.gov.ph / manager123</p></div>
                  <div><p><strong>Student:</strong> student@example.com / student123</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300 ease-out" />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-sm transform -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-500">
                  Sign In Failed
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-sm text-gray-700 dark:text-gray-300">
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
