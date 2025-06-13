@echo off
echo Creating .env file with placeholder values...
(
echo # OAuth Environment Configuration
echo # IMPORTANT: Replace placeholder values with actual Google OAuth credentials
echo #
echo # Server Configuration
echo NODE_ENV=development
echo PORT=5000
echo BASE_URL=http://localhost:5000
echo FRONTEND_URL=http://localhost:3000
echo #
echo # Database Configuration
echo DB_HOST=127.0.0.1
echo DB_PORT=3306
echo DB_NAME=cedo_auth
echo DB_USER=root
echo DB_PASSWORD=
echo #
echo # JWT Configuration
echo JWT_SECRET_DEV=cedo-jwt-secret-dev-placeholder
echo #
echo # Google OAuth Configuration - REPLACE THESE VALUES
echo GOOGLE_CLIENT_ID=PLACEHOLDER_GOOGLE_CLIENT_ID
echo GOOGLE_CLIENT_SECRET=PLACEHOLDER_GOOGLE_CLIENT_SECRET
echo GOOGLE_CLIENT_ID_BACKEND=PLACEHOLDER_GOOGLE_CLIENT_ID
echo #
echo # Cookie and Session Security
echo COOKIE_SECRET=cedo-cookie-secret-placeholder
echo #
echo # Security Configuration
echo REQUIRE_GOOGLE_EMAIL_VERIFIED=true
echo #
echo # reCAPTCHA Configuration
echo RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
) > .env

echo .env file created successfully!
echo.
echo IMPORTANT: You need to replace the placeholder values with actual credentials:
echo 1. Get Google OAuth credentials from: https://console.cloud.google.com/
echo 2. Edit the .env file and replace:
echo    - PLACEHOLDER_GOOGLE_CLIENT_ID with your actual client ID
echo    - PLACEHOLDER_GOOGLE_CLIENT_SECRET with your actual client secret
echo 3. Save the file and run: npm run dev
echo.
pause 