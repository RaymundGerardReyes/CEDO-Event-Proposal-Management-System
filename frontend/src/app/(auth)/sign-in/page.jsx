<<<<<<< HEAD
<<<<<<< HEAD
"use client";

import { AuthLoadingScreen } from "@/components/auth/loading-screen";
import { LogoSimple } from "@/components/logo";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, useAuth } from "@/contexts/auth-context";
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// UI Components
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
  DialogPortal, // Ensure DialogPortal is imported if not already (it's part of your new structure)
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Icons
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

// Next.js specific
import Link from "next/link";

// ReCAPTCHA
import ReCAPTCHA from "react-google-recaptcha";

export default function SignInPage() {
  const { signIn, signInWithGoogleAuth, user, isLoading: authProviderLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Kept searchParams as it's initialized, though not used in redirect
  const pathname = usePathname();
  const recaptchaRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
=======
// frontend/src/app/(auth)/sign-in/page.jsx
"use client"
=======
"use client";
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)

import { AuthLoadingScreen } from "@/components/auth/loading-screen";
import { LogoSimple } from "@/components/logo";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, useAuth } from "@/contexts/auth-context";
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// UI Components
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
  DialogPortal, // Ensure DialogPortal is imported if not already (it's part of your new structure)
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Icons
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

// Next.js specific
import Link from "next/link";

// ReCAPTCHA
import ReCAPTCHA from "react-google-recaptcha";

export default function SignInPage() {
  const { signIn, signInWithGoogleAuth, user, isLoading: authProviderLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Kept searchParams as it's initialized, though not used in redirect
  const pathname = usePathname();
  const recaptchaRef = useRef(null);

<<<<<<< HEAD
  const { toast } = useToast()

  console.log("SignInPage Auth State (from AuthProvider):", {
    authProviderLoading,
    isInitialized,
    user,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Local loading state for form submission
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("An unexpected error occurred. Please try again.");
  const [error, setError] = useState(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
<<<<<<< HEAD
=======
  })
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)

  const handleAuthenticatedUserRedirect = useCallback(() => {
<<<<<<< HEAD
    if (!user || !isInitialized) return;

    let targetPath = "/";

=======
    if (!user || !user.role) {
      console.warn("SignInPage handleAuthenticatedUserRedirect: No user or role for redirection.")
      // Should not happen if user object is valid
      return
    }
=======

  const handleAuthenticatedUserRedirect = useCallback(() => {
    if (!user || !isInitialized) return;
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)

    let targetPath = "/";

<<<<<<< HEAD
    // If middleware provided a redirect param and the user is *already* authenticated
    // when landing on /sign-in, it might mean their session was still valid.
    // Prioritize their default dashboard in this scenario rather than a potentially stale redirect.
    if (redirectQueryParam && redirectQueryParam !== pathname) {
      console.log(
        `SignInPage (already authenticated): Found redirect query param "${redirectQueryParam}". Deciding whether to use it or default dashboard.`,
      )
      // It's generally safer to send an already authenticated user to their default dashboard
      // if they land on /sign-in, as the redirect param might be from a previous attempt.
      // However, if the business logic requires honoring it, that can be adjusted here.
      // For now, let's prioritize default dashboard to avoid potential confusion.
    }

    // Determine default dashboard based on user object or role
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    if (user.dashboard) {
      targetPath = user.dashboard;
    } else {
      switch (user.role) {
        case ROLES.HEAD_ADMIN:
        case ROLES.MANAGER:
<<<<<<< HEAD
<<<<<<< HEAD
        case ROLES.REVIEWER:
          targetPath = "/admin-dashboard";
          break;
=======
          targetPath = "/admin-dashboard"
          break
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
        case ROLES.REVIEWER:
          targetPath = "/admin-dashboard";
          break;
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
        case ROLES.STUDENT:
        case ROLES.PARTNER:
          targetPath = "/student-dashboard";
          break;
        default:
<<<<<<< HEAD
<<<<<<< HEAD
          console.warn(`SignInPage: Unknown user role "${user.role}". Redirecting to default path.`);
          targetPath = "/";
          break;
      }
    }

=======
          console.warn(`SignInPage handleAuthenticatedUserRedirect: Unknown role "${user.role}", redirecting to /.`)
          targetPath = "/" // Fallback to main redirector page
          break
      }
    }

    console.log(
      `SignInPage (already authenticated): Redirecting user "${user.name}" with role "${user.role}" to ${targetPath}.`,
    )

>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
          console.warn(`SignInPage: Unknown user role "${user.role}". Redirecting to default path.`);
          targetPath = "/";
          break;
      }
    }

>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    if (pathname !== targetPath) {
      router.replace(targetPath);
    } else if (pathname === "/sign-in") {
<<<<<<< HEAD
<<<<<<< HEAD
      router.replace(targetPath === "/sign-in" ? "/" : targetPath);
    }
  }, [user, isInitialized, router, pathname]);
=======
      // If somehow still on /sign-in after all checks, force to a non-auth page.
      router.replace(targetPath === "/sign-in" ? "/" : targetPath)
    }
  }, [user, router, searchParams, pathname]) // Added all dependencies
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)

  useEffect(() => {
<<<<<<< HEAD
    if (isInitialized && user) {
      handleAuthenticatedUserRedirect();
    }
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);
=======
    console.log("SignInPage useEffect: Checking if user is already authenticated.", { isInitialized, user })
=======
      router.replace(targetPath === "/sign-in" ? "/" : targetPath);
    }
  }, [user, isInitialized, router, pathname]);

  useEffect(() => {
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    if (isInitialized && user) {
      handleAuthenticatedUserRedirect();
    }
<<<<<<< HEAD
    // The main loading spinner handles the !isInitialized case.
  }, [isInitialized, user, handleAuthenticatedUserRedirect])
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)

  // Auto-close for error dialog
  useEffect(() => {
    let timer;
    if (isErrorDialogOpen) {
      timer = setTimeout(() => {
        setIsErrorDialogOpen(false);
      }, 6000); // 6 seconds
    }
    return () => {
      clearTimeout(timer); // Cleanup timer
    };
  }, [isErrorDialogOpen]);


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

  const openErrorDialog = (message) => {
    setErrorDialogMessage(message || "The email or password you entered is incorrect. Please check your credentials or try again.");
    setIsErrorDialogOpen(true);
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

  const openErrorDialog = (message) => {
    setErrorDialogMessage(message || "The email or password you entered is incorrect. Please check your credentials or try again.");
    setIsErrorDialogOpen(true);
  };

  const handleSubmit = async (e) => {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    e.preventDefault();
    if (isSubmittingEmail || isSubmittingGoogle) return;

    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "warning",
      });
      return;
    }

    setIsSubmittingEmail(true);
<<<<<<< HEAD
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
      console.error("SignInPage handleSubmit Error:", error);
      openErrorDialog(error.message || "An unexpected error occurred during sign in. Please try again.");
      resetCaptcha();
    } finally {
      setIsSubmittingEmail(false);
=======
    e.preventDefault()
    if (isSubmitting) return // Prevent double submission
    setIsSubmitting(true) // Use local submitting state for UI feedback on this page
    console.log("SignInPage handleSubmit: Attempting email/password sign in...")
=======
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
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
      console.error("SignInPage handleSubmit Error:", error);
      openErrorDialog(error.message || "An unexpected error occurred during sign in. Please try again.");
      resetCaptcha();
    } finally {
<<<<<<< HEAD
      setIsSubmitting(false)
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
      setIsSubmittingEmail(false);
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    }
  };

  const handleGoogleSignIn = async () => {
<<<<<<< HEAD
<<<<<<< HEAD
    if (isSubmittingEmail || isSubmittingGoogle) return;
    setIsSubmittingGoogle(true);
    try {
      const userData = await signInWithGoogleAuth();
=======
    if (isSubmitting) return
    setIsSubmitting(true)
    console.log("SignInPage handleGoogleSignIn: Attempting Google sign in...")
    try {
      await loadGoogleScript()
      // Initialize Google sign-in
      const userData = await signInWithGoogleAuth() // from AuthContext
      // Similar to email/password, AuthContext's `commonSignInSuccess` handles redirection.
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
    if (isSubmittingEmail || isSubmittingGoogle) return;
    setIsSubmittingGoogle(true);
    try {
      const userData = await signInWithGoogleAuth();
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
      if (userData) {
        toast({
          title: "Signed in with Google!",
          description: `Welcome, ${userData.name || "user"}! Redirecting...`,
<<<<<<< HEAD
<<<<<<< HEAD
          variant: "success",
        });
      } else {
        openErrorDialog("An issue occurred after Google sign-in. Please try again.");
      }
    } catch (error) {
      console.error("SignInPage handleGoogleSignIn Error:", error);
      openErrorDialog(error.message || "An error occurred during Google sign-in. Please try again.");
    } finally {
      setIsSubmittingGoogle(false);
=======
        })
=======
          variant: "success",
        });
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
      } else {
        openErrorDialog("An issue occurred after Google sign-in. Please try again.");
      }
    } catch (error) {
      console.error("SignInPage handleGoogleSignIn Error:", error);
      openErrorDialog(error.message || "An error occurred during Google sign-in. Please try again.");
    } finally {
<<<<<<< HEAD
      setIsSubmitting(false)
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
      setIsSubmittingGoogle(false);
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    }
  };

  if (authProviderLoading || !isInitialized) {
<<<<<<< HEAD
<<<<<<< HEAD
    return <AuthLoadingScreen message="Initializing session..." />;
  }

  if (user) {
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!recaptchaSiteKey) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly.
          <br />
          Please contact support or ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set.
        </p>
=======
    console.log(
      "SignInPage: Rendering AUTH PROVIDER loading spinner. AuthProvider isLoading=" +
      authProviderLoading +
      ", isInitialized=" +
      isInitialized,
    )
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-sm text-gray-600">Initializing Authentication...</p>
        </div>
      </div>
    )
=======
    return <AuthLoadingScreen message="Initializing session..." />;
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
  }

  if (user) {
    return <AuthLoadingScreen message="Already signed in, redirecting..." />;
  }

  if (!recaptchaSiteKey) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          The ReCAPTCHA service is not configured correctly.
          <br />
          Please contact support or ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set.
        </p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="w-full max-w-md p-4">
      <div className="mb-8 text-center">
        <LogoSimple />
        <h1 className="mt-4 text-2xl font-bold text-cedo-blue">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
      </div>
    );
  }
  return (

    <>
      <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-gray-50">
        <div className="w-full max-w-md p-4">
          <div className="mb-8 text-center">
            {LogoSimple ? <LogoSimple /> : <div className="text-destructive">Logo Error</div>}
            <h1 className="mt-4 text-2xl font-bold text-cedo-blue">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>

          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={isSubmittingGoogle || isSubmittingEmail}
              >
                {isSubmittingGoogle ? (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting} // Disable during any submission
          >
            {isSubmitting ? ( // Show loader only if this specific action is submitting
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="mr-2">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Sign in with Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      autoComplete="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={isSubmitting} // Disable during any submission
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs text-cedo-blue hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={isSubmitting} // Disable during any submission
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: !!checked }))}
                    disabled={isSubmitting} // Disable during any submission
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </FormLabel>
              </FormItem>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && ( // Show loader only if this specific action is submitting

          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={isSubmittingGoogle || isSubmittingEmail}
              >
                {isSubmittingGoogle ? (

                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="mr-2">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Sign in with Google
              </Button>

              <div className="relative my-4">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-2 text-sm text-muted-foreground">or continue with email</span>
                </div>

              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" placeholder="your.email@example.com" type="email" autoComplete="email" name="email" value={formData.email} onChange={handleChange} className="pl-10" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                      </div>
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Link href="/forgot-password" tabIndex={-1} className="text-xs text-cedo-blue hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="current-password" name="password" value={formData.password} onChange={handleChange} className="pl-10" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isSubmittingEmail || isSubmittingGoogle} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
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
                      <Checkbox id="rememberMe" name="rememberMe" checked={formData.rememberMe} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: !!checked }))} disabled={isSubmittingEmail || isSubmittingGoogle} />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                      Remember me
                    </FormLabel>
                  </FormItem>

                  <Button type="submit" className="w-full" disabled={isSubmittingEmail || isSubmittingGoogle || !captchaToken}>
                    {isSubmittingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingEmail ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-3 bg-muted/50 rounded-md border">
                <h3 className="text-sm font-medium text-foreground/80 mb-2">Demo Accounts:</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div><p><strong>Head Admin:</strong> admin@cedo.gov.ph / admin123</p></div>
                  <div><p><strong>System Manager:</strong> manager@cedo.gov.ph / manager123</p></div>
                  <div><p><strong>Student:</strong> student@example.com / student123</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Minimalistic Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogPortal>
          <DialogOverlay
            className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300 ease-out"
          />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-sm transform -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8"> {/* Adjusted padding and background for themes */}
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
                    variant="outline" // Explicitly set variant for styling consistency
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
          {/* Demo Accounts - Keep as is or remove for production */}
          <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <p>
                  <strong>Head Admin:</strong> admin@cedo.gov.ph / admin123
                </p>

 (Add client admin dashboard and iniital student dashboard)
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" placeholder="your.email@example.com" type="email" autoComplete="email" name="email" value={formData.email} onChange={handleChange} className="pl-10" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                      </div>
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Link href="/forgot-password" tabIndex={-1} className="text-xs text-cedo-blue hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="current-password" name="password" value={formData.password} onChange={handleChange} className="pl-10" disabled={isSubmittingEmail || isSubmittingGoogle} required />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isSubmittingEmail || isSubmittingGoogle} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
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
                      <Checkbox id="rememberMe" name="rememberMe" checked={formData.rememberMe} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: !!checked }))} disabled={isSubmittingEmail || isSubmittingGoogle} />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                      Remember me
                    </FormLabel>
                  </FormItem>

                  <Button type="submit" className="w-full" disabled={isSubmittingEmail || isSubmittingGoogle || !captchaToken}>
                    {isSubmittingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingEmail ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-3 bg-muted/50 rounded-md border">
                <h3 className="text-sm font-medium text-foreground/80 mb-2">Demo Accounts:</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div><p><strong>Head Admin:</strong> admin@cedo.gov.ph / admin123</p></div>
                  <div><p><strong>System Manager:</strong> manager@cedo.gov.ph / manager123</p></div>
                  <div><p><strong>Student:</strong> student@example.com / student123</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

export default function SignInPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>

      <Suspense fallback={<SignInLoading />}>
        <SignInContent />
      </Suspense>
    </div>
  )
}

async function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

      {/* Enhanced Minimalistic Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogPortal>
          <DialogOverlay
            className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300 ease-out"
          />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-sm transform -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8"> {/* Adjusted padding and background for themes */}
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
                    variant="outline" // Explicitly set variant for styling consistency
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
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
