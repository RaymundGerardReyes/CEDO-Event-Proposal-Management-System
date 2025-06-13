# Security Fix: Prevent Unauthorized User Data Storage in Google Authentication

## Issue Description
Previously, when random users attempted to "Sign in with Google," their information (email, name, Google ID) was automatically being saved to the MySQL database, even if they were not authorized to access the system. This created a security and data management issue.

## Root Cause
The issue was in the `/auth/google` endpoint in `backend/routes/auth.js`. The system was automatically creating new user records for any Google user who attempted to sign in, regardless of whether they should have access to the system.

### Previous Problematic Flow:
1. User clicks "Sign in with Google"
2. Google returns user credentials
3. Backend checks if user exists by Google ID
4. If not found, checks by email
5. **If still not found, automatically creates new user record** ❌
6. User data gets saved to database even for unauthorized users

## Security Fix Implementation

### 1. Backend Changes (`backend/routes/auth.js`)

**Removed automatic user creation:**
```javascript
// REMOVED: Automatic user creation that was saving unauthorized users
if (!user) {
  // For security: Only allow existing users to sign in with Google
  // Do not create new users automatically to prevent unauthorized data storage
  console.log(`Backend [/google]: User ${email} not found in system. Rejecting Google sign-in attempt.`);
  return res.status(403).json({
    message: "Account not found. Please contact an administrator to create your account first.",
    reason: "USER_NOT_FOUND",
    email: email // Optional: include email for admin reference
  });
}
```

**Key Changes:**
- Removed the automatic `INSERT INTO users` query for new Google users
- Added proper error response with `USER_NOT_FOUND` reason
- No user data is saved to the database for unauthorized attempts

### 2. Frontend Changes (`frontend/src/contexts/auth-context.js`)

**Enhanced error handling:**
```javascript
// Handle USER_NOT_FOUND error (new unauthorized user attempting Google sign-in)
if (reason === "USER_NOT_FOUND") {
  const notFoundError = new Error("Account not found. Please contact an administrator to create your account first.");
  notFoundError.isUserNotFound = true;
  promiseActions.reject(notFoundError);
  return;
}
```

### 3. UI Changes (`frontend/src/app/(auth)/sign-in/page.jsx`)

**Updated error dialog handling:**
```javascript
// Check if this is a user not found error
if (error?.isUserNotFound || (message && message.toLowerCase().includes("account not found"))) {
  setErrorDialogMessage("Account not found. Please contact an administrator to create your account first.");
}
```

## New Secure Flow

### ✅ Secure Google Authentication Flow:
1. User clicks "Sign in with Google"
2. Google returns user credentials
3. Backend checks if user exists by Google ID
4. If not found, checks by email
5. **If still not found, returns 403 error - NO DATABASE SAVE** ✅
6. Frontend shows appropriate error message
7. Unauthorized user data is NOT saved to database

### ✅ Authorized User Flow:
1. Admin creates user account first through proper channels
2. User attempts Google sign-in
3. System finds existing user record
4. Links Google ID to existing account (if needed)
5. User successfully authenticated

## Security Benefits

1. **Prevents Data Pollution**: Random users can't fill up your database with unauthorized accounts
2. **Maintains Data Integrity**: Only legitimate users have database records
3. **Controlled Access**: All users must be pre-approved by administrators
4. **Audit Trail**: Clear logging of unauthorized access attempts
5. **GDPR Compliance**: No unauthorized personal data storage

## Migration Notes

### Existing Unauthorized Users
If your database already contains unauthorized users from previous Google sign-in attempts, you may want to:

1. **Identify unauthorized users:**
```sql
SELECT id, name, email, google_id, created_at, is_approved 
FROM users 
WHERE google_id IS NOT NULL 
AND is_approved = FALSE 
AND role = 'student'
ORDER BY created_at DESC;
```

2. **Review and clean up if needed:**
```sql
-- CAUTION: Only run after manual review
-- DELETE FROM users WHERE id IN (list_of_unauthorized_user_ids);
```

### Environment Variables
Ensure these are properly configured:
- `GOOGLE_CLIENT_ID_BACKEND` - For backend token verification
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - For frontend Google button

## Testing

### Test Cases:
1. ✅ Existing approved user with Google ID → Should sign in successfully
2. ✅ Existing approved user without Google ID → Should link Google ID and sign in
3. ✅ Existing unapproved user → Should show pending approval message
4. ✅ **New unauthorized user → Should show "Account not found" message and NOT create database record**
5. ✅ Invalid Google token → Should show appropriate error

### Verification:
Monitor your database during testing to ensure no new unauthorized user records are created when random users attempt Google sign-in.

## Admin User Creation

Administrators should create user accounts through:
1. **Admin Dashboard** (if implemented)
2. **Direct Database Insert** (for initial setup)
3. **API Endpoint** (`POST /api/users` - HEAD_ADMIN only)

Example manual user creation:
```sql
INSERT INTO users (name, email, role, is_approved, created_at) 
VALUES ('John Doe', 'john.doe@example.com', 'student', TRUE, NOW());
```

## Conclusion

This security fix ensures that only pre-authorized users can access your system through Google authentication, preventing unauthorized data storage and maintaining system security integrity. 