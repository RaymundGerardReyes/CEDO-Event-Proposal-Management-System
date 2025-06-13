"use client";

import { ROLES, useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
    const router = useRouter();
    const { user, isInitialized, isLoading } = useAuth();

    useEffect(() => {
        if (isInitialized && user) {
            // Redirect to the appropriate dashboard based on user role
            console.log("User detected, redirecting based on role:", user.role);

            if (user.role === ROLES.STUDENT) {
                router.replace('/student-dashboard');
            } else if (user.role === ROLES.HEAD_ADMIN || user.role === ROLES.MANAGER) {
                router.replace('/admin-dashboard');
            } else if (user.dashboard) {
                // Use user's predefined dashboard
                router.replace(user.dashboard);
            } else {
                // Default redirect based on role
                switch (user.role) {
                    case ROLES.PARTNER:
                        router.replace('/student-dashboard');
                        break;
                    case ROLES.REVIEWER:
                        router.replace('/admin-dashboard');
                        break;
                    default:
                        router.replace('/sign-in');
                }
            }
        } else if (isInitialized && !user) {
            // No user, redirect to sign-in
            console.log("No user detected, redirecting to sign-in");
            router.replace('/sign-in');
        }
    }, [isInitialized, user, router]);

    // Show loading state while auth is initializing
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">CEDO Partnership Management</h2>
                    <p className="text-gray-600">Initializing application...</p>
                </div>
            </div>
        );
    }

    // Show loading state during redirect
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">CEDO Partnership Management</h2>
                <p className="text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
} 