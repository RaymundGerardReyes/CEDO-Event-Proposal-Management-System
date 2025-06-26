import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// JWT verification function
const verifyAuthToken = async (token) => {
    if (!token) return null;

    try {
        // Use the same JWT secret as your backend
        const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;

        const secretKey = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secretKey);

        // Extract user data from payload (adjust based on your JWT structure)
        return payload.user || payload;
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
};

// Backend API helper function
const callBackendAPI = async (endpoint, options = {}) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${backendUrl}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Backend API call failed for ${endpoint}:`, error);
        throw error;
    }
};

export async function GET(request) {
    try {
        console.log('📱 Profile API: Starting user data fetch...');

        // Get user data from middleware headers (preferred)
        let userId = request.headers.get('x-user-id');
        let userRole = request.headers.get('x-user-role');
        let userData = null;

        // Try to parse user data from headers
        try {
            const userDataHeader = request.headers.get('x-user-data');
            if (userDataHeader) {
                userData = JSON.parse(userDataHeader);
                userId = userData.id || userData.accountid || userId;
                userRole = userData.role || userData.accountType || userRole;
            }
        } catch (parseError) {
            console.log('Could not parse user data from headers, continuing with token verification');
        }

        // Fallback to cookie-based authentication
        if (!userId) {
            console.log('🔄 No user ID from middleware, trying cookie authentication...');

            const cookieStore = await cookies();
            const token = cookieStore.get('cedo_token')?.value || cookieStore.get('session')?.value;

            if (!token) {
                return NextResponse.json(
                    { error: 'No authentication token found' },
                    { status: 401 }
                );
            }

            // Verify JWT token
            const authData = await verifyAuthToken(token);

            if (!authData) {
                return NextResponse.json(
                    { error: 'Invalid authentication token' },
                    { status: 401 }
                );
            }

            userId = authData.id || authData.accountid;
            userRole = authData.role || authData.accountType;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID not found in authentication data' },
                { status: 401 }
            );
        }

        console.log(`📊 Fetching data for user ID: ${userId}, Role: ${userRole}`);

        // Call backend API instead of direct database connection
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('cedo_token')?.value || cookieStore.get('session')?.value;

            const backendUserData = await callBackendAPI('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log(`✅ User data retrieved from backend: ${backendUserData.user.name} (${backendUserData.user.email})`);

            // Return user data with field restrictions based on your requirements
            const responseData = {
                id: backendUserData.user.id,
                name: backendUserData.user.name,
                email: backendUserData.user.email,
                password: "••••••••", // Never return actual password
                role: backendUserData.user.role,
                organization: backendUserData.user.organization,
                organization_type: backendUserData.user.organization_type,
                avatar: backendUserData.user.avatar,
                is_approved: backendUserData.user.is_approved,
                password_reset_required: backendUserData.user.password_reset_required,
                last_login: backendUserData.user.last_login,
                created_at: backendUserData.user.createdAt,
                updated_at: backendUserData.user.updated_at,

                // Field editability metadata based on your requirements
                fieldRestrictions: {
                    id: { editable: false, reason: "Primary key" },
                    name: { editable: false, reason: "Display only" },
                    email: { editable: false, reason: "Protected field" },
                    password: { editable: true, reason: "User can update" },
                    role: { editable: false, reason: "Admin controlled" },
                    organization: { editable: true, reason: "User editable" }
                }
            };

            return NextResponse.json(responseData, { status: 200 });

        } catch (backendError) {
            console.error('❌ Backend API call failed:', backendError);
            return NextResponse.json(
                { error: 'Failed to fetch user data from backend' },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('❌ Profile API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        console.log('📝 Profile API: Starting user data update...');

        // Get user data from middleware headers
        let userId = request.headers.get('x-user-id');
        let userRole = request.headers.get('x-user-role');

        // Fallback to cookie-based authentication
        if (!userId) {
            const cookieStore = await cookies();
            const token = cookieStore.get('cedo_token')?.value || cookieStore.get('session')?.value;

            if (!token) {
                return NextResponse.json(
                    { error: 'No authentication token found' },
                    { status: 401 }
                );
            }

            const authData = await verifyAuthToken(token);

            if (!authData) {
                return NextResponse.json(
                    { error: 'Invalid authentication token' },
                    { status: 401 }
                );
            }

            userId = authData.id || authData.accountid;
            userRole = authData.role || authData.accountType;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID not found in authentication data' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { field, value } = body;

        // Validate field restrictions
        const allowedFields = ['organization', 'password'];
        if (!allowedFields.includes(field)) {
            return NextResponse.json(
                { error: `Field '${field}' is not editable` },
                { status: 400 }
            );
        }

        console.log(`📝 Updating ${field} for user ${userId}`);

        // Call backend API for update instead of direct database connection
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('cedo_token')?.value || cookieStore.get('session')?.value;

            // For password changes, use the backend password change endpoint
            if (field === 'password') {
                const result = await callBackendAPI('/api/users/change-password', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        currentPassword: body.currentPassword,
                        newPassword: value
                    }),
                });

                return NextResponse.json({
                    success: true,
                    message: 'Password updated successfully',
                    field,
                }, { status: 200 });
            }

            // For other fields, use a generic update endpoint
            const result = await callBackendAPI(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    [field]: value
                }),
            });

            console.log(`✅ Field ${field} updated successfully for user ${userId}`);

            return NextResponse.json({
                success: true,
                message: `${field} updated successfully`,
                field,
                value,
            }, { status: 200 });

        } catch (backendError) {
            console.error('❌ Backend API update failed:', backendError);
            return NextResponse.json(
                { error: 'Failed to update user data via backend' },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('❌ Profile API Update Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
} 