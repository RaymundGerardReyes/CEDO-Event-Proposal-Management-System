import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

// Define your JWT secret. THIS MUST BE THE SAME SECRET USED TO SIGN THE TOKEN.
<<<<<<< HEAD
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey" // Provide a default for development
=======
const JWT_SECRET = process.env.JWT_SECRET
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey" // Provide a default for development
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
if (!JWT_SECRET) {
  console.error(
    "CRITICAL: JWT_SECRET environment variable is not set in middleware. Service will not function correctly.",
  )
  // In a real scenario, you might want to prevent the app from running or return an error response.
  // For now, we'll let it proceed but log a critical error.
}
const secretKey = new TextEncoder().encode(JWT_SECRET)

// Define standardized roles. Ensure these strings EXACTLY match what's in your JWT payload
// and what your frontend components (like AuthContext) expect.
// These should align with ROLES in AuthContext.js
const ROLES = {
  HEAD_ADMIN: "Head Admin",
  STUDENT: "Student",
  MANAGER: "Manager",
  PARTNER: "Partner",
  REVIEWER: "Reviewer",
}

// Add a simple cache to prevent repeated redirects
const redirectCache = new Map()
const CACHE_TTL = 1000 // 1 second in milliseconds

// Clear old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of redirectCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      redirectCache.delete(key)
    }
  }
}, 5000) // Clean up every 5 seconds

async function verifyAuthToken(token) {
  if (!token || !JWT_SECRET) {
    // Check if JWT_SECRET is available
    return null
  }
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      // Specify expected algorithms if known, e.g., ['HS256']
      // algorithms: ['HS256'],
    })
    // Payload should contain user object with id, role, etc.
    // It might be nested e.g. payload.user or payload directly
    return payload.user || payload // Adjust based on your JWT structure
  } catch (err) {
    console.error(
      "Middleware: JWT Verification Error:",
      err.message,
      "(Token might be expired, malformed, or secret mismatch)",
    )
    return null
  }
}

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl
  const token = request.cookies.get("cedo_token")?.value

  // Create a cache key based on pathname and token presence
  const cacheKey = `${pathname}-${!!token}`

  // Check if we've recently processed this exact request
  const cachedResult = redirectCache.get(cacheKey)
  if (cachedResult) {
    const timeSinceLastRedirect = Date.now() - cachedResult.timestamp
    if (timeSinceLastRedirect < CACHE_TTL) {
      // If we've redirected this same path recently, just proceed
      console.log(`Middleware: Using cached result for ${pathname} (${timeSinceLastRedirect}ms ago)`)
      return cachedResult.response
    }
  }

  // console.log(`Middleware: Path: ${pathname}, Token Present: ${!!token}`);

  // Paths that are always public (don't require authentication)
  const publicPaths = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    // "/reset-password", // Add if you have this page and it's public
    // "/terms",
    // "/privacy",
  ]

  // Allow direct access to Next.js internals, specific API routes, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") || // Public auth API routes (e.g., /api/auth/login)
    pathname.startsWith("/static") || // Example: if you serve static assets from /static
    pathname.includes(".") || // Generally allow files with extensions (images, css, js in public)
    publicPaths.includes(pathname)
  ) {
    return NextResponse.next()
  }

  // For all other paths, verify authentication
  const userData = await verifyAuthToken(token)

  if (!userData) {
    // User is not authenticated or token is invalid/expired
    console.log(`Middleware: No valid user data for path "${pathname}". Redirecting to /sign-in.`)
    const signInUrl = new URL("/sign-in", origin)
    signInUrl.searchParams.set("redirect", pathname) // Preserve intended destination
    const response = NextResponse.redirect(signInUrl)

    // Cache this redirect decision
    redirectCache.set(cacheKey, {
      response: NextResponse.next(), // On subsequent requests, just proceed
      timestamp: Date.now(),
    })

    return response
  }

  // User is authenticated, userData contains { id, role, ... }
  // console.log(`Middleware: User Authenticated. Role: "${userData.role}" for path "${pathname}"`);

  // If an authenticated user tries to access auth pages (sign-in, sign-up),
  // redirect them to their appropriate dashboard or a default authenticated page.
  if (publicPaths.includes(pathname) && (pathname === "/sign-in" || pathname === "/sign-up")) {
    let dashboardUrl = "/" // Default to main redirector page app/(main)/page.jsx
    if (userData.dashboard) {
      // Prefer dashboard path from user object
      dashboardUrl = userData.dashboard
    } else {
      switch (userData.role) {
        case ROLES.HEAD_ADMIN:
        case ROLES.MANAGER: // Assuming manager also goes to admin dashboard
          dashboardUrl = "/admin-dashboard"
          break
        case ROLES.STUDENT:
        case ROLES.PARTNER: // Assuming partner goes to student dashboard
          dashboardUrl = "/student-dashboard"
          break
        // Add other roles if they have specific dashboards
      }
    }
    console.log(`Middleware: Authenticated user on auth page "${pathname}". Redirecting to ${dashboardUrl}.`)
    const response = NextResponse.redirect(new URL(dashboardUrl, origin))

    // Cache this redirect decision
    redirectCache.set(cacheKey, {
      response: NextResponse.next(), // On subsequent requests, just proceed
      timestamp: Date.now(),
    })

    return response
  }

  // Role-based access control for specific protected sections
  // This assumes your dashboard paths are structured like /admin-dashboard/*, /student-dashboard/*

  if (
    pathname.startsWith("/admin-dashboard") &&
<<<<<<< HEAD
<<<<<<< HEAD
    userData.role !== ROLES.head_admin &&
    userData.role !== ROLES.manager
  ) {
    console.log(
      `Middleware: Access Denied to "${pathname}". User role "${userData.role}" not head_admin or manager. Redirecting.`,
=======
    userData.role !== ROLES.HEAD_ADMIN &&
    userData.role !== ROLES.MANAGER
  ) {
    console.log(
      `Middleware: Access Denied to "${pathname}". User role "${userData.role}" not HEAD_ADMIN or MANAGER. Redirecting.`,
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
=======
    userData.role !== ROLES.head_admin &&
    userData.role !== ROLES.manager
  ) {
    console.log(
      `Middleware: Access Denied to "${pathname}". User role "${userData.role}" not head_admin or manager. Redirecting.`,
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
    )
    // Redirect to their default dashboard or an "access denied" page
    const fallbackDashboard =
      userData.role === ROLES.STUDENT || userData.role === ROLES.PARTNER ? "/student-dashboard" : "/"
    const response = NextResponse.redirect(new URL(fallbackDashboard, origin))

    // Cache this redirect decision
    redirectCache.set(cacheKey, {
      response: NextResponse.next(), // On subsequent requests, just proceed
      timestamp: Date.now(),
    })

    return response
  }

  if (pathname.startsWith("/student-dashboard") && userData.role !== ROLES.STUDENT && userData.role !== ROLES.PARTNER) {
    // Example: if only students/partners can access student dashboard
    console.log(
      `Middleware: Access Denied to "${pathname}". User role "${userData.role}" not STUDENT or PARTNER. Redirecting.`,
    )
    const fallbackDashboard =
      userData.role === ROLES.HEAD_ADMIN || userData.role === ROLES.MANAGER ? "/admin-dashboard" : "/"
    const response = NextResponse.redirect(new URL(fallbackDashboard, origin))

    // Cache this redirect decision
    redirectCache.set(cacheKey, {
      response: NextResponse.next(), // On subsequent requests, just proceed
      timestamp: Date.now(),
    })

    return response
  }

  // Add more specific role-based route protections as needed
  // e.g., if pathname.startsWith("/admin-dashboard/users") && userData.role !== ROLES.HEAD_ADMIN (only head admin can manage users)

  // Cache the "proceed" decision
  redirectCache.set(cacheKey, {
    response: NextResponse.next(),
    timestamp: Date.now(),
  })

  // If all checks pass, allow the request to proceed
  return NextResponse.next()
}

// Configure the middleware to run on desired paths.
// Avoid running on static assets and API routes that don't need auth.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files in /public (e.g., images, fonts) - handled by pathname.includes('.') or specific folder checks
     * - Specific API routes that are public (e.g. /api/public/*)
     *
     * The goal is to run middleware on page navigations and protected API calls.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth/public).*)", // Adjusted to be more general
  ],
}
