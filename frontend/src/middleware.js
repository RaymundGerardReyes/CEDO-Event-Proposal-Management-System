import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

// Define your JWT secret. THIS MUST BE THE SAME SECRET USED TO SIGN THE TOKEN.
// Resolved to f1ac8f1 version
const JWT_SECRET = process.env.JWT_SECRET_DEV;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET_DEV environment variable is not set. Service will not function correctly in production.");
  // Instead of returning here, you can throw an error or handle it in the response logic
}
const secretKey = new TextEncoder().encode(JWT_SECRET)

// Define standardized roles. Ensure these strings EXACTLY match what's in your JWT payload
// and what your frontend components (like AuthContext) expect.
// These should align with ROLES in AuthContext.js
const ROLES = {
  HEAD_ADMIN: "head_admin",
  STUDENT: "student",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer",
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
}, 1000) // Clean up every 5 seconds

async function verifyAuthToken(token) {
  if (!token || !JWT_SECRET) {
    return null
  }
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      // Specify expected algorithms if known, e.g., ['HS256']
      // algorithms: ['HS256'],
    })
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
  const { pathname, origin } = request.nextUrl;
  const token = request.cookies.get("cedo_token")?.value;

  if (!JWT_SECRET) {
    console.error("Middleware CRITICAL: JWT_SECRET_DEV is not set.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const cacheKey = `${pathname}-${!!token}`;
  const cachedResult = redirectCache.get(cacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.response;
  }

  const publicPaths = ["/sign-in", "/sign-up", "/forgot-password", "/form-debug"];
  const isPublicAssetPath = pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api/") || // Allow ALL API routes to pass through
    pathname.startsWith("/api/auth/public/") || // Ensure this matches your actual public API paths
    pathname.includes("."); // Allows .ico, .png etc.

  if (isPublicAssetPath) {
    return NextResponse.next();
  }

  const userData = await verifyAuthToken(token);

  // Determine the correct dashboard URL based on user data
  let correctDashboardUrl = "";
  if (userData) {
    if (userData.dashboard) {
      correctDashboardUrl = userData.dashboard;
    } else {
      switch (userData.role) {
        case ROLES.HEAD_ADMIN:
        case ROLES.MANAGER:
          correctDashboardUrl = "/admin-dashboard";
          break;
        case ROLES.STUDENT:
        case ROLES.PARTNER:
          correctDashboardUrl = "/student-dashboard";
          break;
        default:
          correctDashboardUrl = "/sign-in"; // Fallback if role has no specific dashboard
      }
    }
  }

  // Handling authenticated users
  if (userData) {
    // If user is on a public auth page (sign-in, sign-up) but is authenticated, redirect to their dashboard
    if (publicPaths.includes(pathname) && correctDashboardUrl && correctDashboardUrl !== "/sign-in") {
      console.log(`Middleware: Authenticated user (Role: ${userData.role}) on auth page "${pathname}". Redirecting to ${correctDashboardUrl}.`);
      const response = NextResponse.redirect(new URL(correctDashboardUrl, origin));
      redirectCache.set(cacheKey, { response: NextResponse.redirect(new URL(correctDashboardUrl, origin)), timestamp: Date.now() });
      return response;
    }

    // If user is at root, redirect to their correct dashboard
    if (pathname === "/" && correctDashboardUrl && correctDashboardUrl !== "/sign-in") {
      if (pathname !== correctDashboardUrl) { // Prevent redirecting if already at correct dashboard from root somehow
        console.log(`Middleware: Authenticated user (Role: ${userData.role}) at root. Redirecting to ${correctDashboardUrl}.`);
        const response = NextResponse.redirect(new URL(correctDashboardUrl, origin));
        redirectCache.set(cacheKey, { response: NextResponse.redirect(new URL(correctDashboardUrl, origin)), timestamp: Date.now() });
        return response;
      }
    }

    // Role-based access control for dashboards
    // If trying to access admin dashboard without admin/manager role
    if (pathname.startsWith("/admin-dashboard") && correctDashboardUrl !== "/admin-dashboard") {
      console.log(`Middleware: Access Denied to "${pathname}". User role "${userData.role}" not authorized. Redirecting to ${correctDashboardUrl || '/sign-in'}.`);
      const response = NextResponse.redirect(new URL(correctDashboardUrl || '/sign-in', origin));
      if (!correctDashboardUrl || correctDashboardUrl === "/sign-in") response.cookies.set("cedo_token", "", { path: "/", expires: new Date(0) });
      redirectCache.set(cacheKey, { response: NextResponse.redirect(new URL(correctDashboardUrl || '/sign-in', origin)), timestamp: Date.now() });
      return response;
    }

    // If trying to access student dashboard without student/partner role
    if (pathname.startsWith("/student-dashboard") && correctDashboardUrl !== "/student-dashboard") {
      console.log(`Middleware: Access Denied to "${pathname}". User role "${userData.role}" not authorized. Redirecting to ${correctDashboardUrl || '/sign-in'}.`);
      const response = NextResponse.redirect(new URL(correctDashboardUrl || '/sign-in', origin));
      if (!correctDashboardUrl || correctDashboardUrl === "/sign-in") response.cookies.set("cedo_token", "", { path: "/", expires: new Date(0) });
      redirectCache.set(cacheKey, { response: NextResponse.redirect(new URL(correctDashboardUrl || '/sign-in', origin)), timestamp: Date.now() });
      return response;
    }

    // If user is already on their correct dashboard or a permitted sub-path, allow
    if (pathname === correctDashboardUrl || pathname.startsWith(correctDashboardUrl + "/")) {
      console.log(`Middleware: Access Granted to "${pathname}" for user role "${userData.role}".`);
      const response = NextResponse.next();
      redirectCache.set(cacheKey, { response: NextResponse.next(), timestamp: Date.now() });
      return response;
    }

    // Fallback for authenticated users accessing a non-dashboard, non-public path they shouldn't be on
    // This case should ideally be rare if other checks are correct.
    if (correctDashboardUrl && correctDashboardUrl !== "/sign-in") {
      console.log(`Middleware: Authenticated user (Role: ${userData.role}) at unexpected path "${pathname}". Redirecting to ${correctDashboardUrl}.`);
      const response = NextResponse.redirect(new URL(correctDashboardUrl, origin));
      redirectCache.set(cacheKey, { response: NextResponse.redirect(new URL(correctDashboardUrl, origin)), timestamp: Date.now() });
      return response;
    }
  }

  // Handling unauthenticated users or invalid tokens
  // If it's not a public path (like /sign-in) and no valid user data, redirect to sign-in
  if (!publicPaths.includes(pathname)) {
    console.log(`Middleware: Unauthenticated access to "${pathname}". Redirecting to /sign-in.`);
    const signInUrl = new URL("/sign-in", origin);
    signInUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(signInUrl);
    if (token) { // A token was present but was invalid
      console.log("Middleware: Clearing invalid cedo_token cookie during unauthenticated redirect.");
      response.cookies.set("cedo_token", "", { path: "/", expires: new Date(0) });
    }
    redirectCache.set(cacheKey, { response: NextResponse.redirect(signInUrl), timestamp: Date.now() });
    return response;
  }

  // Allow access to public paths for unauthenticated users
  console.log(`Middleware: Allowing unauthenticated access to public path "${pathname}".`);
  const finalResponse = NextResponse.next();
  redirectCache.set(cacheKey, { response: NextResponse.next(), timestamp: Date.now() });
  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};