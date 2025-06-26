# Google OAuth "Invalid Audience" Error - RESOLVED

## 🔍 **Problem Description**

**Error Message:**
```
Google token has an invalid audience. Configuration issue likely.
```

**Error Location:** `frontend/src/contexts/auth-context.js:515` in `handleGoogleCredentialResponse`

**Root Cause:** Frontend and backend were using **different Google Client IDs**, causing audience validation to fail during token verification.

## 🚫 **What Was Wrong**

### **Environment Variable Mismatch**
1. **Frontend** was using: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 
2. **Backend** was expecting: `GOOGLE_CLIENT_ID_BACKEND`
3. **Docker Compose** had inconsistent variable names:
   - Backend: `GOOGLE_CLIENT_ID` (wrong variable name)
   - Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (potentially different value)

### **Authentication Flow Failure**
1. Frontend generates Google token with Client ID: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. Token contains audience (`aud` claim) matching frontend Client ID
3. Backend tries to verify token using different Client ID: `GOOGLE_CLIENT_ID_BACKEND`
4. Google's token verification fails because audience doesn't match expected Client ID

## ✅ **Solution Applied**

### **1. Synchronized Environment Variables**

**Updated `docker-compose.yml`:**
```yaml
# Backend Service
environment:
  GOOGLE_CLIENT_ID_BACKEND: "${GOOGLE_CLIENT_ID:-1003456507577-7tde8gpttu8dvk6c4q3so4jcrdpshq8a.apps.googleusercontent.com}"

# Frontend Service  
environment:
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID:-1003456507577-7tde8gpttu8dvk6c4q3so4jcrdpshq8a.apps.googleusercontent.com}"
```

### **2. Created Environment Files**

**Backend `.env`:**
```
7577-7tde8gpttu8dvk6c4q3so4jcrdpshq8a.apps.googleusercontent.com
```

**Frontend `.env`:**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1003456507577-7tde8gpttu8dvk6c4q3so4jcrdpshq8a.apps.googleusercontent.com
```

### **3. Verification Process**

**Backend Token Verification (`utils/googleAuth.js`):**
```javascript
const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: GOOGLE_CLIENT_ID_BACKEND, // Now matches frontend Client ID
});
```

## 🔧 **Technical Details**

### **Google OAuth Audience Validation**
- The `audience` (`aud`) claim in a Google ID token **must match** the Client ID used for verification
- Google's `verifyIdToken()` method validates this as a security measure
- Frontend and backend **must use the same Google Client ID** for authentication to work

### **Error Detection Logic**
```javascript
if (error.message.includes("Invalid value for aud") || error.message.includes("Wrong recipient")) {
    console.error(`Audience mismatch error. Frontend might be using a different Client ID than backend expects.`);
    throw new Error("Google token has an invalid audience. Configuration issue likely.");
}
```

## 🎯 **Result**

- ✅ Frontend and backend now use **identical Google Client ID**
- ✅ Token audience validation succeeds
- ✅ Google Sign-In works for new and existing accounts
- ✅ No more "invalid audience" errors

## 📚 **References**

- [Google Identity: Verify ID Tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [SMTP Authentication Guide](https://blog.warmy.io/blog/how-to-fix-smtp-email-error-530-solved/) - Reference for authentication best practices
- [Docker OAuth Configuration](https://github.com/dherault/serverless-offline/issues/1795) - Server configuration patterns

## ⚠️ **Important Notes**

1. **Both frontend and backend MUST use the same Google Client ID**
2. **Environment variables must be properly synchronized**
3. **Docker services need restart after configuration changes**
4. **This applies to both development and production environments**

## 🔄 **If Issue Recurs**

1. Verify environment variables are identical:
   ```bash
   # Check backend
   docker-compose logs backend | grep "GOOGLE_CLIENT_ID_BACKEND"
   
   # Check frontend
   docker-compose logs frontend | grep "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
   ```

2. Ensure `.env` files contain correct Client ID:
   ```bash
   cat backend/.env | grep GOOGLE_CLIENT_ID_BACKEND
   cat frontend/.env | grep NEXT_PUBLIC_GOOGLE_CLIENT_ID
   ```

3. Restart Docker services:
   ```bash
   docker-compose down && docker-compose up -d
   ```

---
**Fixed Date:** June 15, 2025  
**Status:** ✅ RESOLVED  
**Impact:** Google Sign-In now works for all approved accounts 