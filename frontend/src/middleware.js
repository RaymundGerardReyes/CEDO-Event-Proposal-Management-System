import { jwtVerify } from "jose";
import { cookies } from 'next/headers';
import { NextResponse } from "next/server";

// Define user role types matching your database schema
export const UserRoles = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer"
};

// JWT Secret for verification (should match your backend)
const JWT_SECRET = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;

// Create TextEncoder for JWT verification
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

// Cache for preventing repeated redirects
const redirectCache = new Map();
const CACHE_TTL = 1000; // 1 second

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of redirectCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      redirectCache.delete(key);
    }
  }
}, 5000);

// Verify JWT token and extract user data
async function verifyAuthToken(token) {
  if (!token || !secretKey) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload.user || payload; // Adjust based on your JWT structure
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return null;
  }
}

// Define route access patterns
const routeConfig = {
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/login",
    "/sign-in",
    "/signup",
    "/sign-up",
    "/forgot-password",
    "/about",
    "/contact"
  ],

  // Routes that should redirect authenticated users away
  authOnlyRoutes: [
    "/login",
    "/sign-in",
    "/signup",
    "/sign-up"
  ],

  // Admin-only routes
  adminRoutes: [
    "/admin-dashboard"
  ],

  // Student/Partner routes  
  studentRoutes: [
    "/student-dashboard"
  ],

  // Protected API routes
  protectedApiRoutes: [
    "/api/user",
    "/api/admin",
    "/api/student"
  ]
};

// Get appropriate dashboard based on user role
function getDashboardForRole(role) {
  switch (role) {
    case UserRoles.HEAD_ADMIN:
    case UserRoles.MANAGER:
      return "/admin-dashboard";
    case UserRoles.STUDENT:
    case UserRoles.PARTNER:
    case UserRoles.REVIEWER:
      return "/student-dashboard";
    default:
      return "/student-dashboard"; // Default fallback
  }
}

// Check if user has access to a specific route
function hasRouteAccess(pathname, userRole) {
  // Admin routes
  if (routeConfig.adminRoutes.some(route => pathname.startsWith(route))) {
    return userRole === UserRoles.HEAD_ADMIN || userRole === UserRoles.MANAGER;
  }

  // Student routes  
  if (routeConfig.studentRoutes.some(route => pathname.startsWith(route))) {
    return [UserRoles.STUDENT, UserRoles.PARTNER, UserRoles.REVIEWER].includes(userRole);
  }

  return true; // Allow access to other routes
}

// Build absolute URL for redirects
function buildUrl(path, origin) {
  return new URL(path, origin).toString();
}

export default async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // Skip middleware for static assets and Next.js internals
  const isPublicAsset = pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.includes("."); // Files with extensions

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // Get token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("cedo_token")?.value || cookieStore.get("session")?.value;

  // Check cache to prevent repeated redirects
  const cacheKey = `${pathname}-${!!token}`;
  const cachedResult = redirectCache.get(cacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.response;
  }

  // Verify token and get user data
  const userData = await verifyAuthToken(token);
  const isAuthenticated = !!userData;
  const userRole = userData?.role || userData?.accountType;

  console.log(`Middleware: ${pathname} | Auth: ${isAuthenticated} | Role: ${userRole}`);

  // Handle authenticated users
  if (isAuthenticated && userRole) {
    const correctDashboard = getDashboardForRole(userRole);

    // Redirect away from auth-only routes when authenticated
    if (routeConfig.authOnlyRoutes.includes(pathname)) {
      console.log(`Redirecting authenticated user from ${pathname} to ${correctDashboard}`);
      const response = NextResponse.redirect(buildUrl(correctDashboard, origin));
      redirectCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }

    // Redirect from root to appropriate dashboard
    if (pathname === "/") {
      console.log(`Redirecting from root to ${correctDashboard} for role ${userRole}`);
      const response = NextResponse.redirect(buildUrl(correctDashboard, origin));
      redirectCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }

    // Check role-based access control
    if (!hasRouteAccess(pathname, userRole)) {
      console.log(`Access denied to ${pathname} for role ${userRole}. Redirecting to ${correctDashboard}`);
      const response = NextResponse.redirect(buildUrl(correctDashboard, origin));
      redirectCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }

    // Add user context to API requests
    if (pathname.startsWith("/api/")) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userData.id || userData.accountid || '');
      requestHeaders.set('x-user-role', userRole);
      requestHeaders.set('x-user-data', JSON.stringify(userData));

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      redirectCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }

    // Allow access to permitted routes
    console.log(`Access granted to ${pathname} for role ${userRole}`);
    const response = NextResponse.next();
    redirectCache.set(cacheKey, { response, timestamp: Date.now() });
    return response;
  }

  // Handle unauthenticated users
  const isPublicRoute = routeConfig.publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // Allow API routes to pass through (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected routes without authentication
  if (!isPublicRoute) {
    console.log(`Unauthenticated access to ${pathname}. Redirecting to /login`);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);
    // Clear invalid token if present
    if (token) {
      response.cookies.set("cedo_token", "", { path: "/", expires: new Date(0) });
      response.cookies.set("session", "", { path: "/", expires: new Date(0) });
    }
    redirectCache.set(cacheKey, { response, timestamp: Date.now() });
    return response;
  }

  // Allow access to public routes
  console.log(`Allowing unauthenticated access to public route: ${pathname}`);
  const response = NextResponse.next();
  redirectCache.set(cacheKey, { response, timestamp: Date.now() });
  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$).*)',
  ],
}