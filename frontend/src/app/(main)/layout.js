// frontend/src/app/(main)/layout.js
"use client";

import { AppSidebar } from "@/components/app-sidebar"; // Your sidebar component
import { SidebarProvider } from "@/components/ui/sidebar"; // Assuming this is your context provider for the sidebar
import { useAuth } from "@/contexts/auth-context"; // Your auth context
import { Loader2 } from "lucide-react"; // Loading icon
import { usePathname, useRouter } from "next/navigation"; // Added usePathname
import { useEffect, useState } from "react";

export default function MainLayout({ children }) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // This state helps prevent rendering children until client-side hydration is complete
  // and initial auth status from context is somewhat settled.
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Standardized roles (ensure these match your global constants and middleware)
  const ROLES = {
    HEAD_ADMIN: 'Head Admin',
    STUDENT: 'Student',
    MANAGER: 'Manager',
  };

  useEffect(() => {
    // This effect primarily acts as a client-side safeguard or handles cases
    // where the session might expire while the user is on the page.
    // The middleware should handle the initial redirect if not authenticated.
    if (isClientMounted && isInitialized && !isLoading && !user) {
      console.log("(MainLayout) Client-side: No authenticated user found, redirecting to sign-in.");
      // Redirect to sign-in, preserving the current path for redirection after login
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }

    // Optional: Client-side role check if needed for specific UI adjustments
    // or as an additional layer of defense. Middleware is primary for page access.
    if (isClientMounted && isInitialized && user) {
      if (pathname.startsWith("/admin-dashboard") && user.role !== ROLES.HEAD_ADMIN) {
        console.warn("(MainLayout) Client-side: User without Head Admin role on /admin-dashboard. Middleware should have caught this. Redirecting.");
        // This redirect should ideally be handled by middleware.
        // If it happens here, it's a fallback.
        router.replace(user.role === ROLES.STUDENT ? "/student-dashboard" : "/");
      }
      // Add other client-side role-based logic if necessary, e.g., for minor UI tweaks
      // not warranting a full page redirect handled by middleware.
    }

  }, [user, isLoading, isInitialized, isClientMounted, router, pathname]); // Added pathname

  // Show loading state while checking authentication or if client hasn't mounted yet
  // isInitialized from useAuth is key here.
  if (!isClientMounted || isLoading || !isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-lg text-cedo-blue">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If auth check is complete, client is mounted, but still no user,
  // it means a redirect is (or should be) in progress by the useEffect or middleware.
  // Render null or a minimal "Redirecting..." message to avoid flashing main layout.
  if (isClientMounted && isInitialized && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <p className="text-lg text-cedo-blue">Redirecting to sign-in...</p>
      </div>
    );
  }

  // If user is authenticated and all checks passed, render the main layout.
  // Ensure `user` is not null before trying to access `user.role` for any UI logic here.
  if (user) {
    // Example: Check if user should even see this layout based on role,
    // though middleware should be the primary gatekeeper for the entire (main) group.
    // This is more for if (main) had sub-sections with different general roles.
    // For `/admin-dashboard` vs `/student-dashboard`, middleware is better.
    // const isAdminDashboardPath = pathname.startsWith('/admin-dashboard');
    // if (isAdminDashboardPath && user.role !== ROLES.HEAD_ADMIN) {
    //   // This should have been caught by middleware or the useEffect above.
    //   // Render a generic "Access Denied" or redirect.
    //   return (
    //       <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
    //           <p className="text-lg text-red-500">Access Denied. You are being redirected.</p>
    //       </div>
    //   );
    // }

    return (
      <SidebarProvider defaultOpen={true}> {/* Ensure SidebarProvider is correctly implemented */}
        <div className="flex min-h-screen bg-gray-100"> {/* Added a default background */}
          <AppSidebar /> {/* Your sidebar component */}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"> {/* Added some padding to main */}
            {children}
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Fallback, should ideally not be reached if logic above is correct.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
      <p className="text-lg text-red-500">An unexpected error occurred with authentication.</p>
    </div>
  );
}
