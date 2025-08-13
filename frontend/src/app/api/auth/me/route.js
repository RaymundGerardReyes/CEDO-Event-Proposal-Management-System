// /api/auth/me - Returns the authenticated user's info (profile)
// Purpose: Provide a RESTful endpoint for the current user's profile, using JWT/cookie authentication.
// Approach: Reuse logic from /api/user/route.js for verifying JWT and extracting user info.

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// JWT verification helper
const verifyAuthToken = async (token) => {
    if (!token) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
        const secretKey = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secretKey);
        return payload.user || payload;
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
};

export async function GET(request) {
    // Try to get user info from headers (if middleware is used)
    let userId = request.headers.get('x-user-id');
    let userRole = request.headers.get('x-user-role');
    let userData = null;
    try {
        const userDataHeader = request.headers.get('x-user-data');
        if (userDataHeader) {
            userData = JSON.parse(userDataHeader);
            userId = userData.id || userData.accountid || userId;
            userRole = userData.role || userData.accountType || userRole;
        }
    } catch (parseError) {
        // Ignore parse error, fallback to cookie
    }

    // Fallback to cookie-based authentication
    if (!userId) {
        const cookieStore = await cookies();
        const token = cookieStore.get('cedo_token')?.value || cookieStore.get('session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
        }
        const authData = await verifyAuthToken(token);
        if (!authData) {
            return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
        }
        userId = authData.id || authData.accountid;
        userRole = authData.role || authData.accountType;
        userData = authData;
    }

    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Return user info (omit sensitive fields)
    return NextResponse.json({
        id: userId,
        role: userRole,
        ...userData,
    });
} 