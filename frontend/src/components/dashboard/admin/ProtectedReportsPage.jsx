"use client"

import { ROLES, useAuth } from "@/contexts/auth-context"
import { AlertTriangle, Lock, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Protected Reports Page Component
 * 
 * Implements role-based access control for the Reports section.
 * Only users with HEAD_ADMIN role can access reports functionality.
 * 
 * Features:
 * - Real-time role verification
 * - Graceful fallback for unauthorized access
 * - Loading states and error handling
 * - Professional access denied UI
 * 
 * Based on Next.js Authentication patterns:
 * https://nextjs.org/docs/pages/guides/authentication
 */
export default function ProtectedReportsPage({ children }) {
    const { user, isLoading, isInitialized } = useAuth()
    const router = useRouter()
    const [accessDenied, setAccessDenied] = useState(false)

    useEffect(() => {
        // Wait for auth to be initialized
        if (!isInitialized) return

        // Check if user is authenticated and authorized
        if (!user) {
            console.log("ProtectedReportsPage: No user found, redirecting to sign-in")
            router.replace("/sign-in?redirect=/admin-dashboard/reports")
            return
        }

        // Verify HEAD_ADMIN role access
        if (user.role !== ROLES.HEAD_ADMIN) {
            console.log(`ProtectedReportsPage: Access denied for role "${user.role}" - HEAD_ADMIN required`)
            setAccessDenied(true)

            // Redirect to appropriate dashboard after showing denial message
            setTimeout(() => {
                switch (user.role) {
                    case ROLES.MANAGER:
                    case ROLES.REVIEWER:
                    case ROLES.PARTNER:
                        router.replace("/admin-dashboard")
                        break
                    case ROLES.STUDENT:
                        router.replace("/student-dashboard")
                        break
                    default:
                        router.replace("/")
                }
            }, 3000) // Show access denied message for 3 seconds
            return
        }

        // User has proper access
        setAccessDenied(false)
        console.log("ProtectedReportsPage: Access granted for HEAD_ADMIN")
    }, [user, isInitialized, router])

    // Loading state
    if (isLoading || !isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-cedo-blue border-t-transparent mx-auto"></div>
                    <p className="text-slate-600 font-medium">Verifying access permissions...</p>
                </div>
            </div>
        )
    }

    // Access denied state
    if (accessDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-red-100 p-8 text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                        <p className="text-gray-600">
                            The Reports section is restricted to Head Administrators only.
                        </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center space-x-2 text-red-700">
                            <Lock className="w-5 h-5" />
                            <span className="font-medium">Current Role: {user?.role || 'Unknown'}</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                            Required Role: Head Administrator
                        </p>
                    </div>

                    <div className="text-sm text-gray-500">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Redirecting to your dashboard in a few seconds...
                    </div>
                </div>
            </div>
        )
    }

    // No user found
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                    <p className="text-slate-600 font-medium">Authentication required</p>
                </div>
            </div>
        )
    }

    // User has proper access - render the protected content
    return <>{children}</>
} 