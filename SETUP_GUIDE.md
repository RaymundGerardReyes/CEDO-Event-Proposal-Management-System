# CEDO Google Auth - Setup Guide

## 🚨 CRITICAL ISSUES FIXED

Your authentication was failing because:
1. **Missing Environment Files** - Both backend and frontend were missing `.env` files
2. **Missing Google OAuth Credentials** - Google OAuth was not configured
3. **Database Connection Issues** - Databases weren't properly initialized

## 📋 STEP-BY-STEP SETUP

### Step 1: Environment Files Setup ✅

The environment files have been created:
- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration

### Step 2: Google OAuth Setup 🔑

**CRITICAL**: You need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/auth/google/callback`

5. Update your environment files:

**Backend (`backend/.env`):**
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_CLIENT_ID_BACKEND=your-actual-google-client-id
GOOGLE_CLIENT_SECRET_BACKEND=your-actual-google-client-secret
```

**Frontend (`frontend/.env.local`):**
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### Step 3: Database Setup 🗄️

Initialize the databases:

```bash
# In backend directory
cd backend
npm run init-databases
```

This will:
- Initialize MySQL database with users table
- Initialize MongoDB (if enabled)
- Create necessary tables and indexes

### Step 4: Start the Services 🚀

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Step 5: Test Authentication ✅

1. **Email/Password Login**: Should work once databases are initialized
2. **Google OAuth**: Will work once you add your Google credentials
3. **Database Connection**: Check backend logs for connection status

## 🔧 TROUBLESHOOTING

### Common Issues:

1. **"Authentication service unavailable"**
   - Check if backend is running on port 5000
   - Verify database connection in backend logs
   - Ensure environment variables are set

2. **Google OAuth not working**
   - Verify Google credentials in both `.env` files
   - Check that Google APIs are enabled
   - Ensure redirect URIs are correct

3. **Database connection failed**
   - Run `npm run init-databases` in backend
   - Check MySQL/MongoDB services are running
   - Verify database credentials in `.env`

### Environment Variables Checklist:

**Backend Required:**
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `JWT_SECRET`
- ✅ `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`
- ✅ `MONGODB_URI` (if using MongoDB)

**Frontend Required:**
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `API_URL`

## 🎯 NEXT STEPS

1. **Add your Google OAuth credentials** to both environment files
2. **Initialize databases** using the npm scripts
3. **Start both services** and test authentication
4. **Create test users** in the database for testing

## 📞 SUPPORT

If you encounter issues:
1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure databases are properly initialized
4. Test each authentication method separately

---

**Status**: Environment files created ✅
**Next**: Add Google OAuth credentials and initialize databases 