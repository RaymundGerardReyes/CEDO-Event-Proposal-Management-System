// frontend/src/app/(auth)/sign-in/page.jsx
"use client";

import { useToast } from "@/components/ui/use-toast";
// Import ROLES from the AuthContext to ensure consistency
import { ROLES, useAuth } from "@/contexts/auth-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LogoSimple } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  //isLoading and isInitialized are from AuthProvider's general state
  //isSubmitting is a local state for the form submission process on this page
  const {
    signIn,
    signInWithGoogleAuth,
    user,
    isLoading: authProviderLoading, // isLoading from AuthProvider
    isInitialized,
  } = useAuth();

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  console.log("SignInPage Auth State (from AuthProvider):", {
    authProviderLoading,
    isInitialized,
    user,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state for form submission
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Centralized redirect logic for this page if user is already authenticated on load
  const handleAuthenticatedUserRedirect = useCallback(() => {
    if (!user || !user.role) {
      console.warn(
        "SignInPage handleAuthenticatedUserRedirect: No user or role for redirection."
      );
      // Should not happen if user object is valid
      return;
    }

    const redirectQueryParam = searchParams.get("redirect");
    let targetPath;

    // If middleware provided a redirect param and the user is *already* authenticated
    // when landing on /sign-in, it might mean their session was still valid.
    // Prioritize their default dashboard in this scenario rather than a potentially stale redirect.
    if (redirectQueryParam && redirectQueryParam !== pathname) {
      console.log(
        `SignInPage (already authenticated): Found redirect query param "${redirectQueryParam}". Deciding whether to use it or default dashboard.`
      );
      // It's generally safer to send an already authenticated user to their default dashboard
      // if they land on /sign-in, as the redirect param might be from a previous attempt.
      // However, if the business logic requires honoring it, that can be adjusted here.
      // For now, let's prioritize default dashboard to avoid potential confusion.
    }

    // Determine default dashboard based on user object or role
    if (user.dashboard) {
      targetPath = user.dashboard;
    } else {
      switch (user.role) {
        case ROLES.HEAD_ADMIN:
        case ROLES.MANAGER:
          targetPath = "/admin-dashboard";
          break;
        case ROLES.STUDENT:
        case ROLES.PARTNER:
          targetPath = "/student-dashboard";
          break;
        default:
          console.warn(
            `SignInPage handleAuthenticatedUserRedirect: Unknown role "${user.role}", redirecting to /.`
          );
          targetPath = "/"; // Fallback to main redirector page
          break;
      }
    }

    console.log(
      `SignInPage (already authenticated): Redirecting user "${user.name}" with role "${user.role}" to ${targetPath}.`
    );

    if (pathname !== targetPath) {
      router.replace(targetPath);
    } else if (pathname === "/sign-in") {
      // If somehow still on /sign-in after all checks, force to a non-auth page.
      router.replace(targetPath === "/sign-in" ? "/" : targetPath);
    }
  }, [user, router, searchParams, pathname]); // Added all dependencies

  // Effect for redirection if user is already authenticated when page loads.
  // This is a client-side check. Middleware should ideally handle this first.
  useEffect(() => {
    console.log(
      "SignInPage useEffect: Checking if user is already authenticated.",
      { isInitialized, user }
    );
    if (isInitialized && user) {
      handleAuthenticatedUserRedirect();
    } else if (isInitialized && !user) {
      console.log(
        "SignInPage: Auth context initialized, no user. Sign-in form will be shown."
      );
    }
    // The main loading spinner handles the !isInitialized case.
  }, [isInitialized, user, handleAuthenticatedUserRedirect]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true); // Use local submitting state for UI feedback on this page
    console.log("SignInPage handleSubmit: Attempting email/password sign in...");
    try {
      const userData = await signIn(formData.email, formData.password, formData.rememberMe);

      // AuthContext's `commonSignInSuccess` (called by `signIn`) will handle:
      // 1. Updating the user state in AuthContext.
      // 2. Setting cookies/localStorage.
      // 3. Calling `performRedirect` (from AuthContext) which handles the query param and role-based redirection.
      // The useEffect in this page is primarily for users already logged in when the page loads.

      if (userData) { // signIn from context should return userData on success
        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
        });
      } else {
        // This block should ideally not be reached if signIn in context throws an error on failure.
        console.error(
          "SignInPage handleSubmit: signIn resolved but no userData returned (unexpected)."
        );
        toast({
          title: "Sign In Issue",
          description: "Login completed but user details are missing. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("SignInPage handleSubmit: Sign in error caught in page:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "An unexpected error occurred. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("SignInPage handleGoogleSignIn: Attempting Google sign in...");
    try {
      await loadGoogleScript();
      // Initialize Google sign-in
      const userData = await signInWithGoogleAuth(); // from AuthContext
      // Similar to email/password, AuthContext's `commonSignInSuccess` handles redirection.
      if (userData) {
        toast({
          title: "Signed in with Google!",
          description: `Welcome, ${userData.name || "user"}! Redirecting...`,
        });
      } else {
        console.error(
          "SignInPage handleGoogleSignIn: signInWithGoogleAuth resolved but no userData (unexpected)."
        );
        toast({
          title: "Google Sign In Issue",
          description: "Google sign-in completed but user details are missing.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        title: "Sign-in Error",
        description: "An error occurred during Google sign-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Conditional Rendering Logic for Loading States ---
  // 1. Show main loading spinner if AuthProvider is still initializing or performing a global auth operation.
  if (authProviderLoading || !isInitialized) {
    console.log(
      "SignInPage: Rendering AUTH PROVIDER loading spinner. AuthProvider isLoading=" +
      authProviderLoading +
      ", isInitialized=" +
      isInitialized
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-sm text-gray-600">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  // 2. If AuthContext is initialized AND a user object exists, the user is ALREADY logged in.
  //    The `useEffect` hook will handle the redirection. Render a "Redirecting..." message.
  if (isInitialized && user) {
    console.log(
      "SignInPage: User is authenticated (user object exists). Rendering REDIRECTING message..."
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-sm text-gray-600">Already signed in, redirecting...</p>
        </div>
      </div>
    );
  }

  // 3. If AuthContext is initialized, no user, and AuthProvider not loading, render the sign-in form.
  //    Local `isSubmitting` will handle loading state for the form buttons.
  console.log(
    "SignInPage: Rendering sign-in form (isInitialized=true, user=null, authProviderLoading=false)."
  );
  return (
    <div className="w-full max-w-md p-4">
      <div className="mb-8 text-center">
        <LogoSimple />
        <h1 className="mt-4 text-2xl font-bold text-cedo-blue">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="mr-2"
              >
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
              <span className="bg-background px-2 text-sm text-muted-foreground">
                or continue with email
              </span>
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
                  <Link
                    href="/forgot-password"
                    className="text-xs text-cedo-blue hover:underline"
                  >
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, rememberMe: !!checked }))
                    }
                    disabled={isSubmitting} // Disable during any submission
                  />
                </FormControl>
                <FormLabel
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </FormLabel>
              </FormItem>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && ( // Show loader only if this specific action is submitting
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {/* Demo Accounts - Keep as is or remove for production */}
          <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Demo Accounts:
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div><p><strong>Head Admin:</strong> admin@cedo.gov.ph / admin123</p></div>
              <div><p><strong>System Manager:</strong> manager@cedo.gov.ph / manager123</p></div>
              <div><p><strong>Student:</strong> student@example.com / student123</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}