# CEDO Frontend Development Guide

## 🚀 Quick Start

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Access Application
- **URL**: `http://localhost:3000` (or `http://localhost:3001` if 3000 is in use)
- **Sign-in**: Navigate to `/sign-in` for authentication

## 🔧 Recent Fixes & Improvements

### ✅ **React Hooks Rules Compliance**
**Issue**: "React has detected a change in the order of Hooks called by GoogleSignInIsolator"
**Solution**: Restructured `GoogleSignInIsolator` component to ensure all hooks are called before any conditional returns

**Key Changes**:
- All `useRef`, `useState`, `useCallback`, and `useEffect` hooks now called consistently
- Conditional logic moved after all hook declarations
- Maintains Google Sign-In functionality while following React best practices

### ✅ **Server Component Error Resolution**
**Issue**: "Class extends value undefined is not a constructor or null"
**Solution**: Added `'use client'` directive to `GracefulErrorBoundary.jsx`

### ✅ **Google Sign-In Loop Prevention**
**Issue**: "Another Google Sign-In operation is already in progress"
**Solution**: Added 30-second timeout handling and stuck promise detection

### ✅ **DOM Manipulation Error Prevention**
**Issue**: "Failed to execute 'removeChild' on 'Node'"
**Solution**: Multi-layered error boundaries and development mode isolation

## 🎯 Google Sign-In Development Options

### Method 1: Environment Variable (Recommended)
Create `.env.local` in the frontend directory:
```bash
# Enable Google Sign-In in development
DISABLE_GOOGLE_SIGNIN_IN_DEV=false

# Google OAuth credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Method 2: UI Button (Quick Toggle)
1. Navigate to `/sign-in`
2. Click **"Enable Google Sign-In (Development)"** button
3. Page reloads with Google Sign-In enabled

### Method 3: URL Parameter (Session-based)
Navigate to: `http://localhost:3000/sign-in?enable_google_signin=true`

## 🛡️ Safety Features

Even with Google Sign-In enabled in development, these safety mechanisms remain active:

- ✅ **30-second timeout** prevents stuck promises
- ✅ **Automatic error recovery** handles DOM conflicts
- ✅ **Multiple error boundaries** prevent app crashes
- ✅ **React Hooks compliance** ensures stable component behavior
- ✅ **Debug tools** for easy troubleshooting
- ✅ **DOM cleanup** removes problematic elements

## 🐛 Troubleshooting

### Common Development Issues

#### "React Hooks Rules Violation"
- **Cause**: Conditional hook calls or early returns before hooks
- **Solution**: ✅ **FIXED** - All hooks now called consistently in `GoogleSignInIsolator`

#### "EPERM: operation not permitted, open '.next/trace'"
- **Cause**: Permission issues with Next.js cache
- **Solution**: 
  ```bash
  rm -rf .next
  npm run dev
  ```

#### "redirect_uri_mismatch" (Google OAuth)
- **Cause**: URL mismatch between app and Google Console
- **Solution**: Ensure Google Console has exact URLs:
  - Origins: `http://localhost:3000`
  - Redirect URIs: `http://localhost:3000/api/auth/callback/google`

#### "Another Google Sign-In operation is already in progress"
- **Cause**: Stuck promise from previous attempt
- **Solution**: ✅ **FIXED** - Auto-recovery with 30-second timeout
- **Manual Fix**: `window.GoogleSignInDebug.manualCleanup()` in browser console

### Debug Tools

Open browser console and use:
```javascript
// Check Google Sign-In state
window.GoogleSignInDebug.checkGoogleSignInState()

// Manual cleanup if needed
window.GoogleSignInDebug.manualCleanup()

// Check development configuration
window.GoogleSignInDebug.developmentModeInfo()
```

## 📁 Project Structure

### Key Components
- **`GoogleSignInIsolator.jsx`**: ✅ **Hooks-compliant** Google Sign-In component
- **`GracefulErrorBoundary.jsx`**: ✅ **Client component** error boundary
- **`GlobalDOMErrorHandler.jsx`**: Global error handling
- **`auth-context.js`**: ✅ **Timeout-protected** authentication context

### Configuration Files
- **`next.config.js`**: Environment variables and build configuration
- **`.env.local`**: Local development environment variables (create if needed)
- **`package.json`**: Dependencies and scripts

### Documentation
- **`DOM_CONFLICT_RESOLUTION.md`**: Technical details of error fixes
- **`GOOGLE_SIGNIN_SETUP.md`**: Quick Google Sign-In setup guide
- **`DEVELOPMENT_GUIDE.md`**: This comprehensive development guide

## 🚦 Development Workflow

### 1. Initial Setup
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create `.env.local` with your settings (see Google Sign-In options above)

### 3. Start Development
```bash
npm run dev
```

### 4. Access Application
- Navigate to `http://localhost:3000/sign-in`
- Use email/password authentication or enable Google Sign-In as needed

### 5. Testing
```bash
# Run tests
npm test

# Run integration tests
npm run test:integration
```

## 🏗️ Production Deployment

### Build Process
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure these are set in your production environment:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
DISABLE_GOOGLE_SIGNIN_IN_DEV=false  # Not needed in production
```

### Production Features
- Google Sign-In is **always enabled** in production
- All safety mechanisms remain active
- Optimized builds with better performance
- Error boundaries handle edge cases gracefully

## 📊 Performance Monitoring

### Development
- React DevTools for component debugging
- Browser DevTools for performance analysis
- Console debugging tools for Google Sign-In issues

### Production
- Error boundaries provide graceful error handling
- Automatic DOM cleanup prevents memory leaks
- Timeout mechanisms prevent stuck operations

## 🎯 Best Practices

### React Development
- ✅ Always follow Rules of Hooks (now enforced in components)
- ✅ Use error boundaries for external library integration
- ✅ Implement proper cleanup in useEffect hooks
- ✅ Use TypeScript for better type safety (when applicable)

### Authentication
- ✅ Test both email/password and Google Sign-In flows
- ✅ Handle all error states gracefully
- ✅ Implement proper session management
- ✅ Use secure environment variable storage

### Debugging
- ✅ Use provided debug tools for Google Sign-In issues
- ✅ Check browser console for helpful error messages
- ✅ Use React DevTools for component state inspection
- ✅ Monitor network requests for authentication flows

---

**Need Help?** 
- Check the technical documentation in `DOM_CONFLICT_RESOLUTION.md`
- Use the quick setup guide in `GOOGLE_SIGNIN_SETUP.md`
- Utilize browser console debug tools: `window.GoogleSignInDebug` 