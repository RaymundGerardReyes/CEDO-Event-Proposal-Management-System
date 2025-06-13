# 🔐 Middleware Implementation Test Guide

## Overview
This document outlines the enhanced middleware implementation for precise role-based access control between `/admin-dashboard` and `/student-dashboard`, following the [LinkedIn RBAC pattern](https://www.linkedin.com/pulse/role-based-access-control-using-nextjs-middlewares-akasukpe-kkt1f).

## 🎯 Key Features Implemented

### 1. **Role-Based Dashboard Routing**
```javascript
// User Role Definitions
const UserRoles = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin", 
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer"
};

// Dashboard Assignment Logic
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
      return "/student-dashboard";
  }
}
```

### 2. **JWT Token Verification**
- Supports both `cedo_token` and `session` cookies
- Proper JWT verification using jose library
- Extracts user role from token payload
- Handles token expiration and invalid tokens

### 3. **Protected Route Access Control**
```javascript
const routeConfig = {
  adminRoutes: ["/admin-dashboard"],
  studentRoutes: ["/student-dashboard"],
  authOnlyRoutes: ["/login", "/sign-in", "/signup", "/sign-up"],
  publicRoutes: ["/", "/about", "/contact"]
};
```

## 🧪 Test Scenarios

### Test 1: **Admin User Access**
**Expected Behavior:**
- ✅ Admin users (`head_admin`, `manager`) can access `/admin-dashboard`
- ❌ Admin users are redirected from `/student-dashboard` to `/admin-dashboard`
- ✅ Root `/` redirects to `/admin-dashboard`
- ❌ Already authenticated users are redirected away from `/login`

### Test 2: **Student User Access**
**Expected Behavior:**
- ✅ Student users (`student`, `partner`, `reviewer`) can access `/student-dashboard`
- ❌ Student users are redirected from `/admin-dashboard` to `/student-dashboard`
- ✅ Root `/` redirects to `/student-dashboard`
- ❌ Already authenticated users are redirected away from `/login`

### Test 3: **Unauthenticated Users**
**Expected Behavior:**
- ❌ Cannot access `/admin-dashboard` or `/student-dashboard`
- ✅ Redirected to `/login` with return URL parameter
- ✅ Can access public routes like `/`, `/about`, `/contact`
- ✅ Invalid tokens are cleared from cookies

### Test 4: **API Route Integration**
**Expected Behavior:**
- ✅ Middleware injects user context headers (`x-user-id`, `x-user-role`, `x-user-data`)
- ✅ API routes receive user data from middleware
- ✅ Fallback to cookie verification if headers missing
- ✅ Profile data fetching works with role-based restrictions

## 📊 Middleware Flow Diagram

```
[User Request] 
    ↓
[Static Asset Check] → [Allow if /_next, .ico, etc.]
    ↓
[Get JWT Token from Cookies]
    ↓
[Verify JWT & Extract Role]
    ↓
[Authenticated?] 
    ↓ YES                    ↓ NO
[Check Route Access]    [Public Route?]
    ↓                       ↓ YES → [Allow]
[Has Access?]               ↓ NO
    ↓ YES → [Allow]    [Redirect to /login]
    ↓ NO
[Redirect to Correct Dashboard]
```

## 🔧 Integration with Profile System

### Headers Injected by Middleware:
```javascript
// For API routes, middleware adds:
headers: {
  'x-user-id': userData.id || userData.accountid,
  'x-user-role': userRole,
  'x-user-data': JSON.stringify(userData)
}
```

### Profile Component Integration:
- Profile page fetches from `/api/user`
- API route receives user context from middleware headers
- Field restrictions apply based on user role
- Real-time updates work with proper authorization

## 🚀 Testing Commands

### 1. **Start Development Server**
```bash
cd frontend
npm run dev
```

### 2. **Test Role-Based Access**
```javascript
// Simulate different user tokens in browser console
document.cookie = "cedo_token=YOUR_JWT_TOKEN_HERE; path=/";

// Test admin access
window.location.href = "/admin-dashboard";

// Test student access  
window.location.href = "/student-dashboard";

// Test profile functionality
window.location.href = "/student-dashboard/profile";
```

### 3. **Verify Middleware Logs**
Check browser developer console for middleware logs:
```
Middleware: /admin-dashboard | Auth: true | Role: head_admin
Access granted to /admin-dashboard for role head_admin
```

## 🔒 Security Features

### 1. **Route Protection**
- Admin routes blocked for non-admin users
- Student routes accessible to student/partner/reviewer roles
- Automatic redirection to appropriate dashboard

### 2. **Token Security**
- JWT verification with proper secret key
- Invalid tokens automatically cleared
- Session data cached to prevent repeated verifications

### 3. **API Security**
- User context injected into API requests
- Fallback authentication for API routes
- Field-level access control in profile system

## 📋 Environment Setup

### Required Environment Variables:
```env
JWT_SECRET_DEV=your_jwt_secret_key_here
# or
JWT_SECRET=your_jwt_secret_key_here
```

### Cookie Configuration:
- Cookie names: `cedo_token` or `session`
- JWT payload should contain: `role` or `accountType`
- User ID: `id` or `accountid`

## ✅ Success Criteria

1. **✅ Admin Dashboard Access Control**
   - Only head_admin and manager roles can access
   - Other roles redirected to student dashboard

2. **✅ Student Dashboard Access Control**
   - Student, partner, reviewer roles can access
   - Admin roles redirected to admin dashboard

3. **✅ Profile Data Fetching**
   - Works seamlessly with middleware authentication
   - Field restrictions apply correctly
   - Real-time updates function properly

4. **✅ Route Protection**
   - Unauthenticated users redirected to login
   - Authenticated users redirected away from auth pages
   - Public routes remain accessible

## 🔄 Next Steps

1. **Database Integration**: Replace mock data with real database queries
2. **Token Refresh**: Implement automatic token refresh mechanism
3. **Error Handling**: Add comprehensive error pages for access denied scenarios
4. **Logging**: Implement proper logging for security audit trails
5. **Testing**: Add automated tests for all role-based access scenarios

---

**Status**: ✅ **Implementation Complete and Ready for Testing**

The middleware now provides precise role-based access control for both admin and student dashboards with proper JWT verification and seamless integration with the profile system. 