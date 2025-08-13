"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import DashboardLayout from "./layouts/DashboardLayout"

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isLoading, ROLES } = useAuth()

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
            case ROLES.head_admin:
            case ROLES.manager:
                return <Navigate to="/admin-dashboard" replace />;
            case ROLES.student:
            case ROLES.partner:
                return <Navigate to="/student-dashboard" replace />;
            default:
                // Fallback for any other roles or if a role doesn't have a specific dashboard here
                return <Navigate to="/" replace />;
        }
    }

    // Render the protected content within the dashboard layout
    return <DashboardLayout>{children}</DashboardLayout>
}

export default ProtectedRoute
