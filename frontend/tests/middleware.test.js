import { jest } from '@jest/globals'; // Ensure jest is imported for mocking
import { SignJWT, jwtVerify } from 'jose'; // Used for creating test tokens and mocking
import { NextResponse } from 'next/server';
import { middleware } from './middleware'; // Adjust path to your middleware.js file

// --- Mocks and Setup ---
const MOCK_JWT_SECRET = 'test-super-secret-key-minimum-32-characters-long';
const textEncoder = new TextEncoder();
const secretKey = textEncoder.encode(MOCK_JWT_SECRET);

// Helper to create a JWT for testing
const createTestToken = async (payload, expirationTime = '1h') => {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secretKey);
};

// Mock process.env
const originalEnv = process.env;

// Mock NextResponse methods
jest.mock('next/server', () => {
    const actualNextServer = jest.requireActual('next/server');
    return {
        ...actualNextServer,
        NextResponse: {
            ...actualNextServer.NextResponse,
            next: jest.fn(() => ({ type: 'next', headers: new Headers(), cookies: { set: jest.fn(), delete: jest.fn() } })),
            redirect: jest.fn((url) => ({ type: 'redirect', url: url.toString(), headers: new Headers(), cookies: { set: jest.fn(), delete: jest.fn() } })),
            json: jest.fn((body, init) => ({ type: 'json', body, status: init?.status, headers: new Headers(), cookies: { set: jest.fn(), delete: jest.fn() } })),
        },
    };
});


// Mock jose's jwtVerify
jest.mock('jose', () => {
    const originalJose = jest.requireActual('jose');
    return {
        ...originalJose,
        jwtVerify: jest.fn(),
    };
});

// Roles definition (mirror from middleware)
const ROLES = {
    HEAD_ADMIN: "head_admin",
    STUDENT: "student",
    MANAGER: "manager",
    PARTNER: "partner",
    REVIEWER: "reviewer",
};

describe('Next.js Middleware', () => {
    let mockRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers(); // Use fake timers for cache TTL tests

        process.env = { ...originalEnv, JWT_SECRET_DEV: MOCK_JWT_SECRET };
        // Re-encode secretKey as process.env might have changed if modules are reset.
        // Though JWT_SECRET_DEV should be set once for the test suite.
        // The middleware itself re-encodes `secretKey` based on `process.env.JWT_SECRET_DEV`


        mockRequest = {
            nextUrl: {
                pathname: '/',
                origin: 'http://localhost:3000',
            },
            cookies: {
                get: jest.fn(),
            },
            headers: new Headers(), // Add headers for completeness
        };

        // Default successful verification
        // @ts-ignore
        jwtVerify.mockImplementation(async (token, key) => {
            if (token === 'valid-token-student') {
                return { payload: { user: { id: 'student1', role: ROLES.STUDENT, dashboard: '/student-dashboard' } } };
            }
            if (token === 'valid-token-admin') {
                return { payload: { user: { id: 'admin1', role: ROLES.HEAD_ADMIN, dashboard: '/admin-dashboard' } } };
            }
            if (token === 'valid-token-partner') {
                return { payload: { user: { id: 'partner1', role: ROLES.PARTNER } } }; // No explicit dashboard
            }
            if (token === 'valid-token-no-dashboard-role') {
                return { payload: { user: { id: 'userX', role: 'unknown_role' } } };
            }
            throw new Error('Invalid token mock');
        });

        // Clear redirectCache (not directly possible as it's module-scoped and not exported)
        // We rely on fake timers and cacheKey uniqueness for cache tests.
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.useRealTimers();
    });

    // --- JWT Secret Handling ---
    describe('JWT Secret Configuration', () => {
        test('JWT_SECRET_001: Returns 500 error response if JWT_SECRET_DEV is not set during request', async () => {
            process.env.JWT_SECRET_DEV = ''; // Unset
            // We need to re-run or re-import the module if its top-level const JWT_SECRET is what's checked first.
            // The middleware function itself also checks.

            const response = await middleware(mockRequest);
            expect(NextResponse.json).toHaveBeenCalledWith({ error: "Server configuration error" }, { status: 500 });
            expect(response.status).toBe(500);
        });
    });

    // --- Token Verification Logic (via verifyAuthToken indirectly) ---
    describe('Token Verification', () => {
        test('VERIFY_TOKEN_001: Allows access if token is valid and path is appropriate', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-student' });
            mockRequest.nextUrl.pathname = '/student-dashboard/profile';

            await middleware(mockRequest);
            expect(NextResponse.next).toHaveBeenCalled();
        });

        test('VERIFY_TOKEN_002: Redirects to /sign-in if token is invalid for a protected route', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'invalid-token' });
            // @ts-ignore
            jwtVerify.mockRejectedValueOnce(new Error('jwt malformed'));
            mockRequest.nextUrl.pathname = '/student-dashboard';

            const response = await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
                pathname: '/sign-in',
                search: '?redirect=%2Fstudent-dashboard'
            }));
            // @ts-ignore
            expect(response.cookies.set).toHaveBeenCalledWith("cedo_token", "", { path: "/", expires: expect.any(Date) });
        });

        test('VERIFY_TOKEN_003: Handles missing token for a protected route by redirecting to /sign-in', async () => {
            mockRequest.cookies.get.mockReturnValue(undefined); // No token
            mockRequest.nextUrl.pathname = '/admin-dashboard';

            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
                pathname: '/sign-in',
                search: '?redirect=%2Fadmin-dashboard'
            }));
        });
    });

    // --- Public Path and Asset Handling ---
    describe('Public Paths and Assets', () => {
        test('PUBLIC_PATH_001: Allows unauthenticated access to /sign-in', async () => {
            mockRequest.nextUrl.pathname = '/sign-in';
            await middleware(mockRequest);
            expect(NextResponse.next).toHaveBeenCalled();
        });

        test('PUBLIC_ASSET_001: Allows access to /_next/static assets', async () => {
            mockRequest.nextUrl.pathname = '/_next/static/css/main.css';
            await middleware(mockRequest);
            expect(NextResponse.next).toHaveBeenCalled();
        });
        test('PUBLIC_ASSET_002: Allows access to .ico files', async () => {
            mockRequest.nextUrl.pathname = '/favicon.ico';
            await middleware(mockRequest);
            expect(NextResponse.next).toHaveBeenCalled();
        });
    });

    // --- Authenticated User Flows ---
    describe('Authenticated User Flows', () => {
        test('AUTH_USER_001: Redirects student from /sign-in to /student-dashboard', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-student' });
            mockRequest.nextUrl.pathname = '/sign-in';

            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/student-dashboard', mockRequest.nextUrl.origin));
        });

        test('AUTH_USER_002: Redirects admin from / to /admin-dashboard', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-admin' });
            mockRequest.nextUrl.pathname = '/';

            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/admin-dashboard', mockRequest.nextUrl.origin));
        });

        test('AUTH_USER_003: Student accessing /admin-dashboard is redirected to /student-dashboard', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-student' });
            mockRequest.nextUrl.pathname = '/admin-dashboard';

            const response = await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/student-dashboard', mockRequest.nextUrl.origin));
            // No cookie clearing as it's a valid token, just wrong page
        });

        test('AUTH_USER_004: Admin accessing /student-dashboard is redirected to /admin-dashboard', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-admin' });
            mockRequest.nextUrl.pathname = '/student-dashboard';

            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/admin-dashboard', mockRequest.nextUrl.origin));
        });

        test('AUTH_USER_005: Partner (no explicit dashboard in JWT) redirected to /student-dashboard from /', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-partner' });
            mockRequest.nextUrl.pathname = '/';
            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/student-dashboard', mockRequest.nextUrl.origin));
        });

        test('AUTH_USER_006: User with unhandled role (no dashboard) accessing protected page is redirected to /sign-in', async () => {
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-no-dashboard-role' });
            mockRequest.nextUrl.pathname = '/some-protected-page'; // Not a public path
            // @ts-ignore
            jwtVerify.mockImplementationOnce(async () => ({ payload: { user: { id: 'userX', role: 'unknown_role' } } }));


            const response = await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
                pathname: '/sign-in',
                search: '?redirect=%2Fsome-protected-page'
            }));
            // @ts-ignore
            expect(response.cookies.set).toHaveBeenCalledWith("cedo_token", "", { path: "/", expires: expect.any(Date) });
        });
    });

    // --- Unauthenticated User Flows ---
    describe('Unauthenticated User Flows', () => {
        test('UNAUTH_USER_001: Redirects from protected path to /sign-in with redirect query', async () => {
            mockRequest.nextUrl.pathname = '/admin-dashboard/users';
            // No token setup, so cookies.get() returns undefined

            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
                pathname: '/sign-in',
                search: '?redirect=%2Fadmin-dashboard%2Fusers'
            }));
        });
    });

    // --- Cache Behavior ---
    describe('Cache Behavior', () => {
        test('CACHE_001: Serves cached response for the same path and token presence within TTL', async () => {
            mockRequest.nextUrl.pathname = '/some-path';
            // First call - no token, goes to sign-in
            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
            // @ts-ignore
            const firstRedirectUrl = NextResponse.redirect.mock.calls[0][0];


            // Second call immediately - should use cache
            const cachedResponse = await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(1); // Not called again
            // @ts-ignore
            expect(cachedResponse.url.toString()).toBe(firstRedirectUrl.toString());
            // @ts-ignore
            expect(cachedResponse.type).toBe('redirect');
        });

        test('CACHE_002: Does not serve cached response after TTL', async () => {
            mockRequest.nextUrl.pathname = '/another-path';
            // First call
            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
            // @ts-ignore
            const firstRedirectUrl = NextResponse.redirect.mock.calls[0][0];


            // Advance time beyond TTL (CACHE_TTL is 1000ms in middleware)
            jest.advanceTimersByTime(1500);

            // Second call - should re-process
            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(2); // Called again
            // @ts-ignore
            const secondRedirectUrl = NextResponse.redirect.mock.calls[1][0];
            expect(secondRedirectUrl.toString()).toBe(firstRedirectUrl.toString()); // Same logic, new response object
        });

        test('CACHE_003: Different cache entries for different token presence on same path', async () => {
            mockRequest.nextUrl.pathname = '/cached-test-path';

            // Call 1: No token
            await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(1); // To /sign-in
            // @ts-ignore
            const unauthRedirectUrl = NextResponse.redirect.mock.calls[0][0].toString();


            // Call 2: With token (student)
            mockRequest.cookies.get.mockReturnValue({ value: 'valid-token-student' });
            await middleware(mockRequest);
            expect(NextResponse.next).toHaveBeenCalledTimes(1); // Access granted to /student-dashboard (or .next())
            // Middleware logic for /cached-test-path with student token:
            // If /cached-test-path is not /student-dashboard, it redirects to /student-dashboard.
            // Let's assume it redirects.
            expect(NextResponse.redirect).toHaveBeenCalledTimes(2); // To /student-dashboard
            // @ts-ignore
            const authRedirectUrl = NextResponse.redirect.mock.calls[1][0].toString();
            expect(authRedirectUrl).not.toBe(unauthRedirectUrl);


            // Call 3: No token again, should hit cache for "no token" scenario
            mockRequest.cookies.get.mockReturnValue(undefined);
            const cachedResponse = await middleware(mockRequest);
            expect(NextResponse.redirect).toHaveBeenCalledTimes(2); // Not called again
            // @ts-ignore
            expect(cachedResponse.url.toString()).toBe(unauthRedirectUrl);
        });
    });
});