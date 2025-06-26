@echo off
echo ==========================================
echo   CEDO Environment Synchronization
echo ==========================================
echo.

REM Check if backend .env exists
if not exist backend\.env (
    echo ERROR: Backend .env file not found!
    echo Please run: backend\setup-google-auth.bat first
    pause
    exit /b 1
)

echo Reading GOOGLE_CLIENT_ID from backend...

REM Extract GOOGLE_CLIENT_ID from backend .env
for /f "tokens=2 delims==" %%i in ('findstr "^GOOGLE_CLIENT_ID=" backend\.env') do set GOOGLE_CLIENT_ID=%%i

if "%GOOGLE_CLIENT_ID%"=="" (
    echo ERROR: GOOGLE_CLIENT_ID not found in backend .env file!
    echo Please update backend\.env with your Google OAuth credentials
    pause
    exit /b 1
)

echo Found GOOGLE_CLIENT_ID: %GOOGLE_CLIENT_ID:~0,15%...

echo.
echo Creating/updating frontend environment files...

REM Create frontend .env file
echo # CEDO Frontend Environment Configuration > frontend\.env
echo # ========================================== >> frontend\.env
echo. >> frontend\.env
echo # Application Environment >> frontend\.env
echo NODE_ENV=development >> frontend\.env
echo NEXT_PUBLIC_APP_ENV=development >> frontend\.env
echo. >> frontend\.env
echo # Google OAuth Configuration >> frontend\.env
echo # CRITICAL: This must match the backend GOOGLE_CLIENT_ID exactly >> frontend\.env
echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% >> frontend\.env
echo. >> frontend\.env
echo # API Configuration >> frontend\.env
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api >> frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 >> frontend\.env
echo. >> frontend\.env
echo # Session Configuration >> frontend\.env
echo NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30 >> frontend\.env
echo. >> frontend\.env
echo # Debug Configuration ^(for development only^) >> frontend\.env
echo NEXT_PUBLIC_DEBUG=true >> frontend\.env

REM Create frontend .env.local file
echo # CEDO Frontend Local Environment > frontend\.env.local
echo # ===================================== >> frontend\.env.local
echo. >> frontend\.env.local
echo # Google OAuth Configuration >> frontend\.env.local
echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% >> frontend\.env.local
echo. >> frontend\.env.local
echo # API Configuration >> frontend\.env.local
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api >> frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 >> frontend\.env.local

echo.
echo ✅ Frontend environment files created/updated successfully!
echo.
echo Environment synchronization completed:
echo - Backend uses: %GOOGLE_CLIENT_ID:~0,15%...
echo - Frontend will use: %GOOGLE_CLIENT_ID:~0,15%...
echo.
echo Next steps:
echo 1. Restart your frontend dev server: cd frontend && npm run dev
echo 2. Test Google Sign-In functionality
echo.
pause 