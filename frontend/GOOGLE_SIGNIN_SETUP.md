# Google Sign-In Development Setup Guide

## Quick Enable Methods

### 🚀 **Fastest Method: UI Button**
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/sign-in`
3. Click the **"Enable Google Sign-In (Development)"** button
4. Page will reload with Google Sign-In enabled

### 🔧 **Permanent Method: Environment Variable**
1. Create `.env.local` file in the `frontend` directory
2. Add this line:
   ```bash
   DISABLE_GOOGLE_SIGNIN_IN_DEV=false
   ```
3. Restart your development server
4. Google Sign-In will be enabled by default

### 🔗 **URL Method: Query Parameter**
Navigate directly to: `http://localhost:3000/sign-in?enable_google_signin=true`

## Google OAuth Configuration

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Create or edit your **OAuth 2.0 Client ID**
4. Add these **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   ```
5. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   http://localhost:3002/api/auth/callback/google
   ```

### 2. Environment Variables
Add to your `.env.local` file:
```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Enable Google Sign-In in development
DISABLE_GOOGLE_SIGNIN_IN_DEV=false
```

## Troubleshooting

### Common Errors and Solutions

#### "redirect_uri_mismatch"
- **Cause**: URL mismatch between your app and Google Console
- **Solution**: Ensure exact match in Google Console settings
- **Note**: Use `localhost` not `127.0.0.1`

#### "Another Google Sign-In operation is already in progress"
- **Cause**: Stuck promise from previous attempt
- **Solution**: The system now auto-recovers with 30-second timeout
- **Manual Fix**: Use `window.GoogleSignInDebug.manualCleanup()` in browser console

#### "Failed to execute 'removeChild' on 'Node'"
- **Cause**: DOM manipulation conflicts
- **Solution**: Comprehensive error boundaries now handle this automatically
- **Note**: This should no longer occur with the new safety mechanisms

### Debug Tools

Open browser console and use:
```javascript
// Check current state
window.GoogleSignInDebug.checkGoogleSignInState()

// Manual cleanup if needed
window.GoogleSignInDebug.manualCleanup()

// Check configuration
window.GoogleSignInDebug.developmentModeInfo()
```

## Safety Features

Even with Google Sign-In enabled in development, these safety features remain active:

✅ **30-second timeout** prevents stuck promises  
✅ **Automatic error recovery** handles DOM conflicts  
✅ **Multiple error boundaries** prevent app crashes  
✅ **Debug tools** for easy troubleshooting  
✅ **DOM cleanup** removes problematic elements  

## Production Notes

In production, Google Sign-In is **always enabled** regardless of these development settings. The safety mechanisms ensure reliable operation in both environments.

---

**Need Help?** Check the main [DOM_CONFLICT_RESOLUTION.md](./DOM_CONFLICT_RESOLUTION.md) for comprehensive technical details. 