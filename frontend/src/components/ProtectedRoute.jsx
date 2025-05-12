"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext_old_Text"
import DashboardLayout from "./layouts/DashboardLayout"

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isLoading } = useAuth()

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // If roles are specified and user doesn't have permission
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
            case "head_admin":
                return <Navigate to="/dashboard" replace />
            case "manager":
                return <Navigate to="/dashboard" replace />
            case "student":
                return <Navigate to="/dashboard" replace />
            default:
                return <Navigate to="/" replace />
        }
    }

    // Render the protected content within the dashboard layout
    return <DashboardLayout>{children}</DashboardLayout>
}

export default ProtectedRoute
