import { NextResponse } from "next/server";

// Define user role types matching your database schema
export const UserRoles = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer"
};

// ✅ ENHANCED: Conditional console logging for development/production
// Custom logging function that respects environment settings
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom logging functions
const customLog = {
  log: function (...args) {
    if (isDevelopment) {
      console.log('[MIDDLEWARE]', ...args);
    }
  },
  warn: function (...args) {
    if (isDevelopment) {
      console.warn('[MIDDLEWARE WARNING]', ...args);
    }
  },
  error: function (...args) {
    // Always log errors, even in production for debugging
    console.error('[MIDDLEWARE ERROR]', ...args);
  },
  debug: function (...args) {
    if (isDevelopment) {
      console.log('[MIDDLEWARE DEBUG]', ...args);
    }
  }
};

// Override console methods for production security
if (isProduction) {
  // Suppress console.log and console.warn in production
  console.log = function () { };
  console.warn = function () { };
  // Keep console.error for critical error logging
} else {
  // Development environment - keep all console methods active
  console.log = console.log;
  console.warn = console.warn;
  console.error = console.error;
}

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
      customLog.debug("Token is expired");
      return null;
    }

    customLog.debug(`JWT Extract: User ID ${user.id}, Role ${user.role}`);
    return user;
  } catch (err) {
    customLog.error("JWT Payload Extraction Error:", err.message);
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
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/forgot-password",
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
    "/sign-up",
    "/auth/sign-in",
    "/auth/sign-up"
  ],

  // Admin-only routes
  adminRoutes: [
    "/admin-dashboard"
  ],

  // Student/Partner routes  
  studentRoutes: [
    "/student-dashboard"
  ],

  // Submit event routes (should be accessible to students)
  submitEventRoutes: [
    "/student-dashboard/submit-event"
  ],

  // UUID-based submit event routes (should be accessible to students)
  uuidSubmitEventRoutes: [
    "/student-dashboard/submit-event/[uuid]"
  ],

  // Legacy routes that should be redirected
  legacyRoutes: [
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
  // Admin routes - only admins can access
  if (routeConfig.adminRoutes.some(route => pathname.startsWith(route))) {
    return userRole === UserRoles.HEAD_ADMIN || userRole === UserRoles.MANAGER;
  }

  // Student routes - students, partners, and reviewers can access
  if (routeConfig.studentRoutes.some(route => pathname.startsWith(route))) {
    return [UserRoles.STUDENT, UserRoles.PARTNER, UserRoles.REVIEWER].includes(userRole);
  }

  // Submit event routes - students, partners, and reviewers can access
  if (routeConfig.submitEventRoutes.some(route => pathname.startsWith(route))) {
    return [UserRoles.STUDENT, UserRoles.PARTNER, UserRoles.REVIEWER].includes(userRole);
  }

  // UUID-based submit event routes - students, partners, and reviewers can access
  if (pathname.match(/^\/student-dashboard\/submit-event\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    return [UserRoles.STUDENT, UserRoles.PARTNER, UserRoles.REVIEWER].includes(userRole);
  }

  return true; // Allow access to other routes
}

// Build absolute URL for redirects
function buildUrl(path, origin) {
  return new URL(path, origin).toString();
}

export default async function middleware(request) {
  try {
    // Skip authentication logic for Link-prefetch and build manifests
    const isPrefetch =
      request.headers.get("purpose") === "prefetch" ||
      request.headers.get("x-middleware-prefetch") === "1";

    if (isPrefetch) {
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    const { pathname, origin } = request.nextUrl;

    // Skip middleware for static assets and Next.js internals
    const isPublicAsset = pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.startsWith("/favicon") ||
      pathname.includes("."); // Files with extensions

    if (isPublicAsset) {
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // ✅ ENHANCED: Better development environment handling
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Get token from cookies
    const token = request.cookies.get("cedo_token")?.value;

    customLog.debug(`Cookie Debug: ${pathname} | Token exists: ${!!token}`);

    // Extract user data from token (without verification)
    const userData = extractJWTPayload(token);
    const isAuthenticated = !!userData;
    const userRole = userData?.role;

    customLog.log(`${pathname} | Auth: ${isAuthenticated} | Role: ${userRole}`);

    // ✅ ENHANCED: Allow submit-event routes in development
    if (isDevelopment && (pathname.startsWith("/student-dashboard/submit-event") ||
      pathname.match(/^\/student-dashboard\/submit-event\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
      customLog.debug('🔄 Development: Allowing access to submit-event routes (including UUID-based)');
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // ✅ SECURITY: No development bypasses for dashboard routes
    // Dashboard routes require proper authentication in all environments

    // Redirect old auth paths to new auth paths (legacy support)
    if (pathname === "/sign-in") {
      customLog.log(`Redirecting old path ${pathname} to new path /auth/sign-in`);
      const response = NextResponse.redirect(buildUrl("/auth/sign-in", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    if (pathname === "/sign-up") {
      customLog.log(`Redirecting old path ${pathname} to new path /auth/sign-up`);
      const response = NextResponse.redirect(buildUrl("/auth/sign-up", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    if (pathname === "/login") {
      customLog.log(`Redirecting old path ${pathname} to new path /auth/sign-in`);
      const response = NextResponse.redirect(buildUrl("/auth/sign-in", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    if (pathname === "/signup") {
      customLog.log(`Redirecting old path ${pathname} to new path /auth/sign-up`);
      const response = NextResponse.redirect(buildUrl("/auth/sign-up", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // Remove legacy redirect - we now use clean paths directly

    // ✅ ENHANCED: Development mode authentication check with warning
    if (isDevelopment && !isAuthenticated && (pathname.startsWith("/student-dashboard") || pathname.startsWith("/admin-dashboard"))) {
      customLog.warn('⚠️  Development: Unauthenticated dashboard access detected. This should not happen in production!');
      customLog.warn(`⚠️  Redirecting ${pathname} to sign-in for proper authentication flow`);

      // Even in development, require authentication for dashboard routes
      const response = NextResponse.redirect(buildUrl("/auth/sign-in", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // Handle authenticated users
    if (isAuthenticated && userRole) {
      const correctDashboard = getDashboardForRole(userRole);

      customLog.debug(`User role ${userRole}, correct dashboard: ${correctDashboard}`);

      // Redirect away from auth-only routes when authenticated
      if (routeConfig.authOnlyRoutes.includes(pathname)) {
        customLog.log(`Redirecting authenticated user from ${pathname} to ${correctDashboard}`);
        const response = NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }

      // Redirect from root to appropriate dashboard
      if (pathname === "/") {
        customLog.log(`Redirecting from root to ${correctDashboard} for role ${userRole}`);
        const response = NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }



      // ✅ ENHANCED: Allow admin dashboard access for authenticated admins
      if (pathname.startsWith("/admin-dashboard")) {
        if (userRole === UserRoles.HEAD_ADMIN || userRole === UserRoles.MANAGER) {
          customLog.log(`✅ Allowing access to admin dashboard: ${pathname} for role ${userRole}`);
          const response = NextResponse.next();
          response.headers.set("x-middleware-cache", "no-cache");
          return response;
        } else {
          customLog.log(`❌ Access denied to admin dashboard for role ${userRole}. Redirecting to ${correctDashboard}`);
          const response = NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
          response.headers.set("x-middleware-cache", "no-cache");
          return response;
        }
      }

      // Check role-based access control
      if (!hasRouteAccess(pathname, userRole)) {
        customLog.log(`Access denied to ${pathname} for role ${userRole}. Redirecting to ${correctDashboard}`);
        const response = NextResponse.redirect(buildUrl(correctDashboard, origin), { status: 303 });
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }

      // Add user context to API requests
      if (pathname.startsWith("/api/")) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", userData.id);
        requestHeaders.set("x-user-role", userData.role);

        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }

      // Allow access to protected routes
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // ✅ ENHANCED: Better handling for unauthenticated users
    if (!isAuthenticated) {
      // Allow access to public routes
      if (routeConfig.publicRoutes.includes(pathname)) {
        const response = NextResponse.next();
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }

      // Check if this is a protected route that requires authentication
      const isProtectedRoute =
        routeConfig.adminRoutes.some(route => pathname.startsWith(route)) ||
        routeConfig.studentRoutes.some(route => pathname.startsWith(route)) ||
        routeConfig.protectedApiRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute) {
        customLog.log(`🔒 Access denied: Unauthenticated user trying to access protected route ${pathname}`);
        const response = NextResponse.redirect(buildUrl("/auth/sign-in", origin), { status: 303 });
        response.headers.set("x-middleware-cache", "no-cache");
        return response;
      }

      // For other routes, redirect to sign-in as well (secure by default)
      customLog.log(`Redirecting unauthenticated user from ${pathname} to /auth/sign-in`);
      const response = NextResponse.redirect(buildUrl("/auth/sign-in", origin), { status: 303 });
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // Default: allow the request to proceed (only for authenticated users)
    const response = NextResponse.next();
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  } catch (err) {
    customLog.error('❌ Middleware error:', err);
    // Optionally, redirect to a generic error page or sign-in
    const response = NextResponse.redirect('/auth/sign-in', { status: 303 });
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};