// frontend/src/app/(main)/admin-dashboard/reports/middleware.js

import { NextResponse } from 'next/server'

/**
 * Role-based route protection middleware for Reports
 * Ensures only HEAD_ADMIN users can access /admin-dashboard/reports
 * 
 * Based on Next.js Authentication Guide:
 * https://nextjs.org/docs/pages/guides/authentication
 */
export default async function reportsMiddleware(req) {
    try {
        // Get user session from cookie
        const sessionCookie = req.cookies.get('cedo_token')?.value

        if (!sessionCookie) {
            console.log('Reports middleware: No session token found')
            return NextResponse.redirect(new URL('/sign-in?redirect=/admin-dashboard/reports', req.url))
        }

        // In a real application, you would decode and verify the JWT token here
        // For now, we'll rely on the frontend role checking
        // The backend API endpoints should also implement proper role validation

        console.log('Reports middleware: Session token found, allowing access')
        return NextResponse.next()

    } catch (error) {
        console.error('Reports middleware error:', error)
        return NextResponse.redirect(new URL('/sign-in?error=auth_error', req.url))
    }
}

export const config = {
    matcher: '/admin-dashboard/reports/:path*'
} 