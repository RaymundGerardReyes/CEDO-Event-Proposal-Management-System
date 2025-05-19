// frontend/src/app/(main)/layout.js
"use client";

import { AppSidebar } from "@/components/dashboard/student/app-sidebar"; // Your sidebar component
import { SidebarProvider } from "@/components/dashboard/student/ui/sidebar"; // Assuming this is your context provider for the sidebar
import { useAuth } from "@/contexts/auth-context"; // Your auth context
import { Loader2 } from "lucide-react"; // Loading icon
import { usePathname, useRouter } from "next/navigation"; // Added usePathname
import { useEffect, useState } from "react";
import "../globals.css"; // Adjust the path as necessary

export default function MainLayout({ children }) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // This state helps prevent rendering children until client-side hydration is complete
  // and initial auth status from context is somewhat settled.
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
    console.log("MainLayout: Client mounted, isLoading=", isLoading, ", isInitialized=", isInitialized, ", user=", user ? "exists" : "null");
  }, []);

  // Standardized roles (ensure these match your global constants and middleware)
  const ROLES = {
    HEAD_ADMIN: 'Head Admin',
    STUDENT: 'Student',
    MANAGER: 'Manager',
  };

  useEffect(() => {
    if (!isClientMounted) {
      console.log("MainLayout: Not client mounted yet, waiting...");
      return;
    }

    if (!isInitialized) {
      console.log("MainLayout: Auth not initialized yet, waiting...");
      return;
    }

    if (!isLoading && !user) {
      // Auth check complete, no user found.
      console.log("MainLayout: Client-side: Auth initialized, no user found. Redirecting to sign-in.");
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Optional: Client-side role checks
    if (user) {
      console.log("MainLayout: User authenticated, checking role-based access for path:", pathname);
      if (pathname.startsWith("/admin-dashboard") && user.role !== ROLES.HEAD_ADMIN && user.role !== ROLES.MANAGER) {
        console.warn("MainLayout: Client-side: User without Head Admin/Manager role on /admin-dashboard. Redirecting.");
        router.replace(user.role === ROLES.STUDENT ? "/student-dashboard" : "/");
      }
      if (pathname.startsWith("/student-dashboard") && user.role !== ROLES.STUDENT) {
        console.warn("MainLayout: Client-side: User without Student role on /student-dashboard. Redirecting.");
        router.replace(user.role === ROLES.HEAD_ADMIN || user.role === ROLES.MANAGER ? "/admin-dashboard" : "/");
      }
    }

  }, [user, isLoading, isInitialized, isClientMounted, router, pathname, ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.STUDENT]);

  // CRITICAL SECTION FOR PREVENTING PREMATURE RENDERS:
  // If ANY of these conditions are true, show loading and prevent children from rendering
  if (!isClientMounted || !isInitialized || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-lg text-cedo-blue">Loading dashboard...</p>
          <p className="text-sm text-gray-500">
            {!isClientMounted ? "Initializing..." : !isInitialized ? "Checking authentication..." : "Loading user data..."}
          </p>
        </div>
      </div>
    );
  }

  // After all checks and we STILL don't have a user, render redirect message
  if (!user) {
    console.log("MainLayout: Client-side: Auth initialized, not loading, but no user. Rendering redirect message.");
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue" />
          <p className="text-lg text-cedo-blue">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated AND all checks passed, render the main layout with its children
  console.log("MainLayout: All checks passed, rendering main layout with user:", user.name);
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
