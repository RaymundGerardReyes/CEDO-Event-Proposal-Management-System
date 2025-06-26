@echo off
echo ========================================
echo CEDO Frontend Environment Fix
echo ========================================

echo Creating backup of current .env file...
copy .env .env.backup.docker 2>nul

echo Creating properly formatted frontend .env file...

echo # ============================================= > .env
echo # CEDO Frontend - Environment Configuration >> .env
echo # ============================================= >> .env
echo. >> .env

echo # Application Environment >> .env
echo NODE_ENV=development >> .env
echo. >> .env

echo # API Configuration >> .env
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api >> .env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 >> .env
echo. >> .env

echo # JWT Configuration >> .env
echo JWT_SECRET=f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540 >> .env
echo JWT_SECRET_DEV=f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540 >> .env
echo. >> .env

echo # Session Configuration >> .env
echo NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30 >> .env
echo NEXT_PUBLIC_COOKIE_SECRET=your-cookie-secret-here >> .env
echo. >> .env

echo # Debug Configuration >> .env
echo NEXT_PUBLIC_DEBUG=true >> .env
echo. >> .env

echo # Google OAuth Configuration (Frontend) >> .env
echo GOOGLE_CLIENT_ID_FRONTEND=YOUR_GOOGLE_CLIENT_ID_HERE >> .env
echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE >> .env
echo. >> .env

echo # reCAPTCHA Configuration >> .env
echo NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY_HERE >> .env
echo RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY_HERE >> .env
echo. >> .env

echo # Admin Configuration >> .env
echo NEXT_PUBLIC_ADMIN_API_KEY=YOUR_ADMIN_API_KEY_HERE >> .env
echo. >> .env

echo # Email Configuration >> .env
echo NEXT_PUBLIC_EMAIL_SERVICE=gmail >> .env

echo.
echo ✅ Frontend .env file created successfully!
echo.
echo 🔧 KEY FIXES APPLIED:
echo - Fixed formatting issues
echo - Removed duplicate/malformed entries
echo - Added missing variables
echo - Proper variable naming
echo.
echo 📋 NEXT STEPS:
echo 1. Update your actual credentials in the .env file
echo 2. The frontend will now work properly with Docker
echo.
pause 