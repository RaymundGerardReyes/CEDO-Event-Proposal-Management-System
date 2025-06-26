@echo off
echo ==========================================
echo   CEDO Frontend Startup with Environment
echo ==========================================
echo.

REM Set the Google Client ID environment variable
set NEXT_PUBLIC_GOOGLE_CLIENT_ID=635557624518-7a4bm4nisdlfch35nmk3vqc5clhvp73a.apps.googleusercontent.com

REM Set other required environment variables
set NEXT_PUBLIC_API_URL=http://localhost:5000/api
set NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
set NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30
set NEXT_PUBLIC_DEBUG=true
set NODE_ENV=development

echo Environment variables set:
echo NEXT_PUBLIC_GOOGLE_CLIENT_ID: %NEXT_PUBLIC_GOOGLE_CLIENT_ID:~0,15%...
echo NEXT_PUBLIC_API_URL: %NEXT_PUBLIC_API_URL%
echo NEXT_PUBLIC_BACKEND_URL: %NEXT_PUBLIC_BACKEND_URL%
echo.

echo Starting frontend development server...
npm run dev 