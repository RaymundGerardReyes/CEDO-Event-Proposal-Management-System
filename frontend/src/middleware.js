import { NextResponse } from "next/server";

// Define user role types matching your database schema
export const UserRoles = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer"
};

// Simple JWT payload extraction without verification
// The verification will be done by the backend API calls
function extractJWTPayload(token) {
  if (!token) return null;

  try {
    // JWT has three parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Handle both old and new token formats
    const user = payload.user || {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      name: payload.name
    };

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("Middleware: Token is expired");
      return null;
    }

    console.log(`Middleware JWT Extract: User ID ${user.id}, Role ${user.role}`);
    return user;
  } catch (err) {
    console.error("JWT Payload Extraction Error:", err.message);
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
    "/contact",
    "/debug-proposal",
    "/test-proposal-table"
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
  // Skip authentication logic for Link-prefetch and build manifests
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) return NextResponse.next();

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
  const token = request.cookies.get("cedo_token")?.value;

  console.log(`Middleware Cookie Debug: ${pathname} | Token exists: ${!!token}`);

  // Extract user data from token (without verification)
  const userData = extractJWTPayload(token);
  const isAuthenticated = !!userData;
  const userRole = userData?.role;

  console.log(`Middleware: ${pathname} | Auth: ${isAuthenticated} | Role: ${userRole}`);

  // Handle authenticated users
  if (isAuthenticated && userRole) {
    const correctDashboard = getDashboardForRole(userRole);

    // Redirect away from auth-only routes when authenticated
    if (routeConfig.authOnlyRoutes.includes(pathname)) {
      console.log(`Redirecting authenticated user from ${pathname} to ${correctDashboard}`);
      return NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
    }

    // Redirect from root to appropriate dashboard
    if (pathname === "/") {
      console.log(`Redirecting from root to ${correctDashboard} for role ${userRole}`);
      return NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
    }

    // Check role-based access control
    if (!hasRouteAccess(pathname, userRole)) {
      console.log(`Access denied to ${pathname} for role ${userRole}. Redirecting to ${correctDashboard}`);
      return NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
    }

    // Add user context to API requests
    if (pathname.startsWith("/api/")) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userData.id || '');
      requestHeaders.set('x-user-role', userRole);
      requestHeaders.set('x-user-data', JSON.stringify(userData));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Allow access to permitted routes
    console.log(`Access granted to ${pathname} for role ${userRole}`);
    return NextResponse.next();
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
    const loginUrl = new URL("/sign-in", origin);
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl, { status: 303 });
    // Clear invalid token if present
    if (token) {
      response.cookies.set("cedo_token", "", { path: "/", expires: new Date(0) });
    }
    return response;
  }

  // Allow access to public routes
  console.log(`Allowing unauthenticated access to public route: ${pathname}`);
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    { source: '/:path*', missing: [{ key: 'purpose', value: 'prefetch' }] },
  ],
};