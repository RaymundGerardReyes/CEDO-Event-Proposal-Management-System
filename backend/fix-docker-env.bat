@echo off
echo ========================================
echo CEDO Docker MySQL Environment Fix
echo ========================================

echo Creating backup of current .env file...
copy .env .env.backup.docker 2>nul

echo Creating Docker-compatible .env file...

echo # ============================================= > .env
echo # CEDO Google Auth - Docker Environment Configuration >> .env
echo # ============================================= >> .env
echo. >> .env

echo # MySQL Docker Container Variables (REQUIRED) >> .env
echo MYSQL_ROOT_PASSWORD=Raymund@Estaca01 >> .env
echo MYSQL_DATABASE=cedo_auth >> .env
echo MYSQL_USER=root >> .env
echo MYSQL_PASSWORD=Raymund@Estaca01 >> .env
echo. >> .env

echo # Application Database Configuration >> .env
echo DB_HOST=127.0.0.1 >> .env
echo DB_PORT=3306 >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD=Raymund@Estaca01 >> .env
echo DB_NAME=cedo_auth >> .env
echo. >> .env

echo # Alternative MySQL variables (for compatibility) >> .env
echo MYSQL_HOST=127.0.0.1 >> .env
echo MYSQL_PORT=3306 >> .env
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

echo # Email Configuration >> .env
echo EMAIL_SERVICE=gmail >> .env
echo EMAIL_USER=your-email@gmail.com >> .env
echo EMAIL_PASSWORD=your-app-password >> .env
echo. >> .env

echo # Google OAuth Configuration >> .env
echo GOOGLE_CLIENT_ID_BACKEND=YOUR_GOOGLE_CLIENT_ID_HERE >> .env
echo GOOGLE_CLIENT_SECRET_BACKEND=YOUR_GOOGLE_CLIENT_SECRET_HERE >> .env
echo. >> .env

echo # reCAPTCHA Configuration >> .env
echo RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY_HERE >> .env
echo NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY_HERE >> .env

echo.
echo ✅ Docker-compatible .env file created successfully!
echo.
echo 🔧 KEY FIXES APPLIED:
echo - Added MYSQL_ROOT_PASSWORD (CRITICAL for Docker)
echo - Fixed MYSQL_DATABASE variable name
echo - Added all required MySQL Docker variables
echo - Maintained backward compatibility
echo.
echo 📋 NEXT STEPS:
echo 1. Update your actual credentials in the .env file
echo 2. Run: docker-compose down --volumes
echo 3. Run: docker-compose up --build
echo.
pause 