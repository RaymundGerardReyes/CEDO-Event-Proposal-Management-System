# Authentication System Documentation

This document provides comprehensive documentation for the CEDO authentication system, which implements both Google OAuth 2.0 and traditional email/password authentication following modern security best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Security Features](#security-features)
- [Google OAuth Implementation](#google-oauth-implementation)
- [Email/Password Authentication](#emailpassword-authentication)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

The CEDO authentication system is built following the latest security standards and best practices from Google's Identity Services and industry-standard authentication patterns. It provides a seamless, secure user experience across multiple authentication methods.

### Key Features

- **Google OAuth 2.0** with Identity Services SDK
- **Email/Password Authentication** with bcrypt hashing
- **reCAPTCHA v3** integration for bot protection
- **Role-Based Access Control** (RBAC)
- **JWT Token Management** with automatic refresh
- **Session Management** with configurable timeout
- **Responsive Design** for mobile and desktop
- **Comprehensive Error Handling** with user-friendly messages

## 🏗️ Architecture

### Frontend Architecture

```
src/
├── contexts/
│   └── auth-context.js          # Main authentication context
├── lib/
│   └── google-auth.js           # Google Identity Services wrapper
├── app/(auth)/
│   └── sign-in/
│       └── page.jsx             # Sign-in page component
└── components/
    └── auth/
        └── loading-screen.jsx   # Authentication loading states
```

### Backend Architecture

```
backend/
├── routes/
│   └── auth.js                  # Authentication endpoints
├── middleware/
│   └── auth.js                  # Authentication middleware
└── utils/
    ├── googleAuth.js            # Google token verification
    └── recaptcha.js             # reCAPTCHA verification
```

## 🔒 Security Features

### Password Security
- **bcrypt hashing** with cost factor 12
- **Secure password policies** enforced on frontend
- **No password storage** for Google-only accounts

### Token Security
- **JWT tokens** with configurable expiration
- **Secure HTTP-only cookies** for token storage
- **Token refresh** mechanism for extended sessions
- **Server-side token verification** for all protected routes

### Bot Protection
- **reCAPTCHA v3** integration with risk assessment
- **Rate limiting** on authentication endpoints
- **IP-based monitoring** and logging

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** with parameterized queries
- **XSS protection** through proper output encoding
- **CORS configuration** for cross-origin security

## 🔑 Google OAuth Implementation

### Process Flow

1. **Client Initialization**
   ```javascript
   // Load Google Identity Services SDK
   await loadGoogleGIS();
   
   // Initialize with client configuration
   await initializeGoogleGIS();
   ```

2. **Button Rendering**
   ```javascript
   // Render Google Sign-In button
   const result = await renderGoogleSignInButton(containerElement, {
     theme: "outline",
     size: "large",
     text: "signin_with"
   });
   ```

3. **Token Verification**
   ```javascript
   // Backend verification of ID token
   const payload = await verifyGoogleToken(idToken);
   const { email, name, picture, sub: googleId } = payload;
   ```

### Configuration

```javascript
// Frontend (Next.js environment variables)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here

// Backend (Node.js environment variables)
GOOGLE_CLIENT_ID_BACKEND=your_client_id_here
```

### Security Considerations

- **ID tokens are verified server-side** using Google's verification library
- **Client-side JWT decoding is for UI purposes only**
- **Proper audience verification** ensures tokens are for your application
- **Email verification status** is checked before account creation

## 📧 Email/Password Authentication

### Process Flow

1. **Form Validation**
   ```javascript
   // Client-side validation
   const form = useForm({
     mode: "onChange",
     resolver: yupResolver(loginSchema)
   });
   ```

2. **reCAPTCHA Verification**
   ```javascript
   // Verify human user before submission
   const isValid = await verifyRecaptchaToken(token, req.ip);
   ```

3. **Password Verification**
   ```javascript
   // Server-side bcrypt verification
   const isMatch = await bcrypt.compare(password, user.password);
   ```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/login
Email/password authentication endpoint.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "captchaToken": "reCAPTCHA_token_here"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student",
    "dashboard": "/student-dashboard",
    "permissions": ["view_own_profile", "submit_requests"]
  }
}
```

#### POST /auth/google
Google OAuth authentication endpoint.

**Request Body:**
```json
{
  "token": "google_id_token_here"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student",
    "google_id": "google_user_id",
    "avatar": "profile_picture_url",
    "dashboard": "/student-dashboard"
  }
}
```

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5050/api

# Session Configuration
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30
```

#### Backend (.env)
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID_BACKEND=your_google_client_id

# JWT Configuration
JWT_SECRET_DEV=your_jwt_secret_key

# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cedo_database

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Admin API Configuration
ADMIN_API_KEY=your_admin_api_key
```

### Role Configuration

```javascript
const ROLES = {
  HEAD_ADMIN: 'head_admin',
  STUDENT: 'student',
  MANAGER: 'manager',
  PARTNER: 'partner',
  REVIEWER: 'reviewer',
};

const roleAccess = {
  [ROLES.STUDENT]: {
    dashboard: "/student-dashboard",
    permissions: ["view_own_profile", "submit_requests"]
  },
  [ROLES.HEAD_ADMIN]: {
    dashboard: "/admin-dashboard",
    permissions: ["manage_all", "view_all_users", "approve_students"]
  }
  // ... other roles
};
```

## 🚨 Error Handling

### Client-Side Error Handling

```javascript
// Comprehensive error handling with user-friendly messages
const handleAuthError = useCallback((error, context = "Authentication") => {
  let title = `${context} Error`;
  let description = "An unexpected error occurred.";

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 403:
        if (message?.includes("pending approval")) {
          title = "Account Pending Approval";
          description = "Please contact an administrator.";
        }
        break;
      case 401:
        title = "Authentication Failed";
        description = "Invalid credentials.";
        break;
    }
  }

  showErrorToast(title, description);
}, [showErrorToast]);
```

### Server-Side Error Handling

```javascript
// Secure error responses without information leakage
app.use((error, req, res, next) => {
  logger.error(`Authentication error: ${error.message}`);
  
  res.status(401).json({
    success: false,
    error: "Authentication failed",
    message: process.env.NODE_ENV === "development" ? error.message : undefined
  });
});
```

## ✅ Best Practices

### Security Best Practices

1. **Never store sensitive data in localStorage**
   - Use HTTP-only cookies for tokens
   - Implement proper CSRF protection

2. **Validate all inputs on both client and server**
   - Use schema validation libraries
   - Sanitize user inputs

3. **Implement proper session management**
   - Configurable session timeouts
   - Automatic cleanup on inactivity

4. **Use secure communication**
   - HTTPS in production
   - Secure cookie attributes

### Development Best Practices

1. **Comprehensive error handling**
   - User-friendly error messages
   - Detailed logging for debugging

2. **Responsive design**
   - Mobile-first approach
   - Accessibility considerations

3. **Performance optimization**
   - Lazy loading of authentication scripts
   - Efficient state management

4. **Testing strategy**
   - Unit tests for authentication functions
   - Integration tests for authentication flows

## 🔧 Troubleshooting

### Common Issues

#### Google Sign-In Button Not Appearing
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Check browser console for script loading errors
- Ensure domain is authorized in Google Console

#### "Another Google Sign-In operation is already in progress"
- This is resolved with the latest implementation
- Automatic cleanup and recovery mechanisms are in place

#### Authentication Tokens Expiring Too Quickly
- Check `JWT_SECRET_DEV` configuration
- Verify token expiration settings
- Implement proper token refresh logic

#### reCAPTCHA Verification Failing
- Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`
- Check domain configuration in reCAPTCHA console
- Ensure proper reCAPTCHA integration

### Debug Mode

Enable debug logging in development:

```javascript
// Frontend debug mode
if (process.env.NODE_ENV === 'development') {
  console.log('Auth Debug:', { user, isLoading, isInitialized });
}

// Backend debug mode
if (process.env.NODE_ENV === 'development') {
  console.log('Token verification:', { userId, email, role });
}
```

## 📚 References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [SitePoint Google Auth Guide](https://www.sitepoint.com/google-auth-react-express/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** January 2024  
**Version:** 2.0  
**Maintainer:** CEDO Development Team 