// frontend/src/app/(auth)/sign-in/page.jsx
"use client"; // Necessary for using client-side features like hooks and browser APIs

// --- Imports ---
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context"; // Ensure this path is correct
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useEffect, useState } from "react";

// ShadCN UI & Lucide Icon Imports (ensure these match your project)
import { LogoSimple } from "@/components/logo"; // Assuming this is your logo component
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
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"; // Added Loader2
import Link from "next/link";

export default function SignInPage() {
  const { signIn, signInWithGoogleAuth, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();

  const searchParams = useSearchParams(); // To get redirect query parameter

  console.log("SignInPage Auth State:", { isLoading, isInitialized, user });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Standardized roles (ensure these match your global constants, middleware, and layouts)
  const ROLES = {
    HEAD_ADMIN: "Head Admin",
    STUDENT: "Student",
    MANAGER: "Manager", // Add if you have this role and a specific dashboard
  };

  const redirectBasedOnRole = (loggedInUser, showToastAndDelay = true) => {
    if (!loggedInUser || !loggedInUser.role) {
      console.warn(
        "SignInPage redirectBasedOnRole: called without user data or role."
      );
      if (showToastAndDelay) {
        toast({
          title: "Redirection Issue",
          description: "User data or role not available for redirection.",
          variant: "destructive",
        });
      }
      // Fallback to a generic dashboard or stay on page if role is unknown
      // router.replace("/dashboard"); // Or handle error appropriately
      return;
    }

    console.log(
      `SignInPage redirectBasedOnRole: Redirecting user "${loggedInUser.name
      }" with role "${loggedInUser.role}".`
    );

    // Determine target path based on role
    let targetPath;
    const redirectQueryParam = searchParams.get("redirect");

    if (redirectQueryParam) {
      // If a redirect query param exists from middleware, prioritize it,
      // but still ensure the role matches if it's a protected route.
      // This logic can be complex; for now, we'll assume if middleware sent them here with a redirect,
      // the login will grant them access to that redirect path.
      targetPath = redirectQueryParam;
      console.log(`SignInPage: Using redirect query param: ${targetPath}`);
    } else {
      // Default redirection logic if no redirect query param
      switch (loggedInUser.role) {
        case ROLES.HEAD_ADMIN:
          targetPath = "/admin-dashboard";
          break;
        case ROLES.STUDENT:
          targetPath = "/student-dashboard";
          break;
        // Add case for ROLES.MANAGER if applicable
        // case ROLES.MANAGER:
        //   targetPath = "/manager-dashboard";
        //   break;
        default:
          console.warn(`SignInPage: Unknown role "${loggedInUser.role}", redirecting to generic dashboard.`);
          targetPath = "/dashboard"; // A generic fallback
          break;
      }
    }


    console.log(`SignInPage: Determined targetPath: ${targetPath}`);

    if (showToastAndDelay) {
      setTimeout(() => {
        router.replace(targetPath);
      }, 500);
    } else {
      router.replace(targetPath);
    }
  };

  // Effect for redirection if user is already authenticated when page loads
  // This might happen if the user navigates back to /sign-in or if AuthContext initializes with an existing session.
  useEffect(() => {
    console.log("SignInPage useEffect for initial redirection check. Auth State:", {
      isInitialized,
      user,
    });
    if (isInitialized && user) {
      console.log(
        "SignInPage: User is already authenticated (from context). Redirecting..."
      );
      redirectBasedOnRole(user, false); // Redirect immediately
    } else if (isInitialized && !user) {
      console.log(
        "SignInPage: Auth context initialized, no user. Sign-in form will be shown."
      );
    }
    // No "else" needed here as the loading spinner handles the !isInitialized case
  }, [isInitialized, user]); // Removed router from deps as redirectBasedOnRole doesn't depend on it directly for this effect's purpose

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("SignInPage handleSubmit: Attempting email/password sign in...");
    try {
      const userData = await signIn(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      if (userData) {
        // AuthContext's signIn should have updated the context's user state
        // and set the cookie. The useEffect above will then handle redirection.
        toast({
          title: "Signed In Successfully!",
          description: `Welcome back, ${userData.name || "user"}! Redirecting...`,
        });
        // No direct call to redirectBasedOnRole here; let the useEffect handle it
        // based on the updated user state from AuthContext.
        // This prevents potential race conditions.
      } else {
        // This case might be hit if signIn resolves but returns no data without an error.
        // Ideally, signIn should always return user data on success or throw an error.
        console.error(
          "SignInPage handleSubmit: signIn resolved but no userData returned."
        );
        toast({
          title: "Sign In Issue",
          description:
            "Login process completed but user details are missing. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("SignInPage handleSubmit: Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description:
          error.message ||
          "An unexpected error occurred. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    console.log("SignInPage handleGoogleSignIn: Attempting Google sign in...");
    try {
      const userData = await signInWithGoogleAuth();
      if (userData) {
        toast({
          title: "Signed in with Google",
          description: `Welcome back, ${userData.name || "user"
            }! Redirecting...`,
        });
        // Let useEffect handle redirection based on updated AuthContext state
      } else {
        console.error(
          "SignInPage handleGoogleSignIn: signInWithGoogleAuth resolved but no userData."
        );
        toast({
          title: "Google Sign In Issue",
          description:
            "Google sign-in process completed but user details are missing. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        "SignInPage handleGoogleSignIn: Google sign in error:",
        error
      );
      let descriptiveError =
        error.message || "Google sign in failed. Please try again.";
      if (
        error.message &&
        error.message.toLowerCase().includes("account pending approval")
      ) {
        descriptiveError =
          "Your account (found via Google) is awaiting administrative approval. Please check back later.";
      }
      toast({
        title: "Google Sign In Failed",
        description: descriptiveError,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Conditional Rendering Logic ---
  // 1. Show loading spinner while AuthContext is initializing OR if global isLoading is true.
  //    isLoading from useAuth() indicates that AuthContext is performing an async operation (e.g. validating a token).
  //    !isInitialized indicates AuthContext hasn't completed its initial setup.
  if (isLoading || !isInitialized) {
    console.log(
      "SignInPage: Rendering loading spinner because isLoading=" +
      isLoading +
      " or !isInitialized=" +
      !isInitialized
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // 2. If AuthContext is initialized AND a user object exists, the user is already logged in.
  //    The useEffect hook will handle the redirection. Render a "Redirecting..." message or null.
  if (isInitialized && user) {
    console.log(
      "SignInPage: User is authenticated (user object exists in context), rendering redirecting message."
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600">Already signed in, redirecting...</p>
        </div>
      </div>
    );
  }

  // 3. If AuthContext is initialized and NO user is found, render the sign-in form.
  console.log(
    "SignInPage: Rendering sign-in form (isInitialized=true, user=null)."
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
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="mr-2"
              >
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
              <span className="bg-background px-2 text-sm text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
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
                    disabled={isSubmitting}
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
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Demo Accounts:
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <p>
                  <strong>Head Admin:</strong> (Role: 'Head Admin')
                </p>
                <p>Email: admin@cedo.gov.ph</p>
                <p>Password: admin123</p>
              </div>
              <div>
                <p>
                  <strong>System Manager:</strong> (Role: 'Manager')
                </p>
                <p>Email: manager@cedo.gov.ph</p>
                <p>Password: manager123</p>
              </div>
              <div>
                <p>
                  <strong>Student:</strong> (Role: 'Student')
                </p>
                <p>Email: student@example.com</p>
                <p>Password: student123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
