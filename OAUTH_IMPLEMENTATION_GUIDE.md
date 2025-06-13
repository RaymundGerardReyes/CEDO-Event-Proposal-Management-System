# 🔐 Google OAuth 2.0 Implementation Guide

This guide documents the comprehensive Google OAuth 2.0 implementation for the CEDO Partnership Management System, following modern security best practices.

## 🌟 Features Implemented

### ✅ Backend (Express.js) Features
- **Secure OAuth 2.0 Flow** with Passport.js and Google OAuth 2.0 Strategy
- **CSRF Protection** with state parameter validation
- **HTTP-Only Secure Cookies** for session management
- **JWT Token-based Authentication** with configurable expiration
- **Rate Limiting** and **Session Security**
- **Comprehensive Error Handling** with detailed logging
- **Database Integration** with user linking and profile updates
- **Role-based Access Control** with permission management

### ✅ Frontend (Next.js/React) Features
- **Secure OAuth Button Component** with loading states
- **Automatic Error Handling** with user-friendly messages
- **OAuth Success/Error Pages** with proper redirects
- **Authentication State Management** with cookie support
- **Mobile-First Responsive Design** with Tailwind CSS
- **Accessibility Features** with ARIA labels and keyboard navigation

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │◄──►│   Backend       │◄──►│   Google OAuth  │
│   (Next.js)     │    │   (Express.js)  │    │   (OAuth 2.0)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │
│   Browser       │    │   Database      │
│   (Cookies)     │    │   (MySQL)       │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Setup Instructions

### 1. Google Cloud Console Setup

1. **Create OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Enable the Google+ API
   - Create OAuth 2.0 Client ID (Web Application)

2. **Configure Authorized URLs**:
   ```
   Authorized JavaScript origins:
   - http://localhost:3000 (development)
   - https://your-domain.com (production)

   Authorized redirect URIs:
   - http://localhost:5000/auth/google/callback (development)
   - https://your-api-domain.com/auth/google/callback (production)
   ```

### 2. Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   # Copy the example environment file
   cp oauth-env-example.txt .env
   ```

3. **Configure Environment Variables**:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   BASE_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Security
   JWT_SECRET_DEV=your-super-secret-jwt-key
   COOKIE_SECRET=your-secure-cookie-secret

   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=cedo_auth
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   ```

4. **Start Backend Server**:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**:
   ```env
   # .env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

3. **Start Frontend Server**:
   ```bash
   npm run dev
   ```

## 🔒 Security Features

### Backend Security
- **CSRF Protection**: State parameter validation
- **Secure Cookies**: HTTP-only, secure, SameSite
- **JWT Validation**: Token expiration and signature verification
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: SQL injection and XSS prevention
- **Error Handling**: No sensitive data exposure

### Frontend Security
- **Secure Redirects**: Validated redirect URLs
- **Token Storage**: HTTP-only cookies (no localStorage)
- **HTTPS Enforcement**: Secure connections in production
- **Content Security Policy**: XSS protection headers

## 📱 Usage Examples

### Basic OAuth Integration

```jsx
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton';

function LoginPage() {
  const handleSuccess = (user) => {
    console.log('User signed in:', user);
  };

  const handleError = (error) => {
    console.error('Sign-in error:', error);
  };

  return (
    <GoogleOAuthButton
      onSuccess={handleSuccess}
      onError={handleError}
      className="w-full"
    >
      Sign in with Google
    </GoogleOAuthButton>
  );
}
```

### Advanced OAuth with Custom Redirect

```jsx
import { initiateOAuthFlow } from '@/lib/google-auth';

function CustomLoginButton() {
  const handleLogin = async () => {
    try {
      await initiateOAuthFlow('/admin-dashboard');
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Custom Google Sign-In
    </button>
  );
}
```

### Authentication State Check

```jsx
import { checkOAuthAuthentication } from '@/lib/google-auth';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const result = await checkOAuthAuthentication();
      setUser(result.authenticated ? result.user : null);
      setLoading(false);
    };

    verifyAuth();
  }, []);

  return { user, loading };
}
```

## 🛡️ Error Handling

### Common Error Scenarios

1. **Account Not Found**:
   - User's Google account not registered in system
   - Redirects to error page with admin contact info

2. **Email Not Verified**:
   - Google email address not verified
   - Instructions to verify email with Google

3. **Security Validation Failed**:
   - CSRF state parameter mismatch
   - Potential security threat detected

4. **Authentication Incomplete**:
   - OAuth flow completed but no user data received
   - Retry mechanism provided

### Error Page Features
- **User-friendly Messages**: Clear explanation of issues
- **Actionable Solutions**: Steps to resolve problems
- **Contact Support**: Direct email link for help
- **Debug Information**: Detailed errors in development mode

## 🔄 Flow Diagrams

### OAuth 2.0 Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Frontend redirects to /auth/google
   ↓
3. Backend generates CSRF state
   ↓
4. Backend redirects to Google OAuth
   ↓
5. User authenticates with Google
   ↓
6. Google redirects to /auth/google/callback
   ↓
7. Backend validates state & exchanges code
   ↓
8. Backend creates/updates user in database
   ↓
9. Backend generates JWT & sets secure cookie
   ↓
10. Backend redirects to frontend success page
    ↓
11. Frontend verifies authentication
    ↓
12. Frontend redirects to appropriate dashboard
```

## 🧪 Testing

### Backend API Testing

```bash
# Test OAuth initiation
curl -X GET "http://localhost:5000/auth/google"

# Test authentication status
curl -X GET "http://localhost:5000/auth/oauth/me" \
  -H "Cookie: auth_token=your-jwt-token"

# Test logout
curl -X POST "http://localhost:5000/auth/oauth/logout" \
  -H "Cookie: auth_token=your-jwt-token"
```

### Frontend Component Testing

```javascript
// Test OAuth button
import { render, fireEvent } from '@testing-library/react';
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton';

test('OAuth button initiates authentication', () => {
  const { getByRole } = render(<GoogleOAuthButton />);
  const button = getByRole('button');
  fireEvent.click(button);
  // Assert redirect to OAuth URL
});
```

## 📊 Monitoring & Logging

### Backend Logging
- **Authentication Events**: Login attempts, successes, failures
- **Security Events**: CSRF attacks, invalid tokens
- **Performance Metrics**: Response times, error rates
- **User Activity**: Profile updates, role changes

### Frontend Analytics
- **Authentication Metrics**: Success/failure rates
- **User Experience**: Error page visits, retry attempts
- **Performance**: OAuth flow completion times

## 🚀 Production Deployment

### Environment Preparation
1. **HTTPS Configuration**: Secure connections required
2. **Domain Setup**: Proper OAuth redirect URLs
3. **Security Headers**: CSP, HSTS, X-Frame-Options
4. **Database Security**: Encrypted connections, strong passwords
5. **Secret Management**: Environment variable security

### Performance Optimization
- **CDN Configuration**: Static asset delivery
- **Database Optimization**: Connection pooling, indexing
- **Caching Strategy**: Redis for session management
- **Load Balancing**: Multiple backend instances

## 📚 API Documentation

### OAuth Endpoints

#### `GET /auth/google`
Initiates OAuth flow with CSRF protection.

**Query Parameters:**
- `redirect_url` (optional): Frontend URL to redirect after success

#### `GET /auth/google/callback`
Handles OAuth callback from Google.

#### `GET /auth/oauth/me`
Returns current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "dashboard": "/student-dashboard",
    "permissions": ["view_own_profile", "submit_requests"]
  }
}
```

#### `POST /auth/oauth/logout`
Logs out user and clears authentication cookies.

## 🔧 Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**:
   - Check Google Cloud Console redirect URLs
   - Verify BASE_URL environment variable

2. **CORS Errors**:
   - Ensure FRONTEND_URL is correctly configured
   - Check cors middleware settings

3. **JWT Token Issues**:
   - Verify JWT_SECRET_DEV is set
   - Check token expiration settings

4. **Database Connection**:
   - Verify database credentials
   - Ensure database server is running

### Debug Mode
Enable debug logging by setting `DEBUG_MODE=true` in environment variables.

## 📝 Changelog

### Version 1.0.0
- Initial OAuth 2.0 implementation
- Backend Passport.js integration
- Frontend React components
- Security features implementation
- Error handling and user experience
- Documentation and testing

---

## 🤝 Contributing

For issues or improvements, please:
1. Check existing documentation
2. Test in development environment
3. Follow security best practices
4. Update documentation as needed

## 📞 Support

For technical support:
- Email: support@your-domain.com
- Documentation: This guide
- Debug: Enable debug mode for detailed logs 