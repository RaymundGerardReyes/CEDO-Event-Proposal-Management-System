@echo off
echo ========================================
echo CEDO Google Auth - Final .env Fix
echo ========================================

echo Creating backup of current .env file...
copy .env .env.backup 2>nul

echo Creating corrected .env file with proper configuration...

echo # ============================================= > .env
echo # CEDO Google Auth - Environment Configuration >> .env
echo # ============================================= >> .env
echo. >> .env

echo # Database Configuration (PRIMARY - MySQL) >> .env
echo DB_HOST=127.0.0.1 >> .env
echo DB_PORT=3306 >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD= >> .env
echo DB_NAME=cedo_auth >> .env
echo. >> .env

echo # Alternative MySQL variables (for compatibility) >> .env
echo MYSQL_HOST=127.0.0.1 >> .env
echo MYSQL_PORT=3306 >> .env
echo MYSQL_USER=root >> .env
echo MYSQL_PASSWORD= >> .env
echo MYSQL_DATABASE=cedo_auth >> .env
echo. >> .env

echo # Application Configuration >> .env
echo NODE_ENV=development >> .env
echo PORT=5000 >> .env
echo. >> .env

echo # JWT Configuration >> .env
echo JWT_SECRET=f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540 >> .env
echo JWT_SECRET_DEV=f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540 >> .env
echo API_SECRET_DEV=c7a626de5d37cfeafd384237b77ba9d782aa6b213c477798bf55a36b24898b7e >> .env
echo. >> .env

echo # Frontend Configuration >> .env
echo FRONTEND_URL=http://localhost:3000 >> .env
echo. >> .env

echo # Google OAuth Configuration (ADD YOUR CREDENTIALS) >> .env
echo GOOGLE_CLIENT_ID_BACKEND=YOUR_GOOGLE_CLIENT_ID_HERE >> .env
echo GOOGLE_CLIENT_SECRET_BACKEND=YOUR_GOOGLE_CLIENT_SECRET_HERE >> .env
echo. >> .env

echo # Email Configuration (ADD YOUR CREDENTIALS) >> .env
echo EMAIL_SERVICE=gmail >> .env
echo EMAIL_USER=YOUR_EMAIL_HERE >> .env
echo EMAIL_PASSWORD=YOUR_EMAIL_PASSWORD_HERE >> .env
echo. >> .env

echo # reCAPTCHA Configuration (ADD YOUR KEY) >> .env
echo RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY_HERE >> .env

echo.
echo ✅ .env file created successfully!
echo.
echo 🔧 KEY FIXES APPLIED:
echo - DB_HOST: localhost → 127.0.0.1
echo - DB_PORT: 3307 → 3306 (CRITICAL FIX)
echo - Added missing DB_USER=root
echo - Added missing DB_NAME=cedo_auth
echo - Removed duplicate entries
echo - Added all required MySQL variables
echo.
echo 📋 NEXT STEPS:
echo 1. Edit the .env file and add your actual credentials:
echo    - GOOGLE_CLIENT_ID_BACKEND
echo    - GOOGLE_CLIENT_SECRET_BACKEND
echo    - EMAIL_USER and EMAIL_PASSWORD
echo    - RECAPTCHA_SECRET_KEY
echo.
echo 2. Test the server: npm run dev
echo.
echo 🎯 The database connection should now work!
echo.
pause 