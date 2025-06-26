@echo off
echo ===========================================
echo  CEDO Google Auth Configuration Setup
echo ===========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file...
    echo # Backend Environment Configuration > .env
    echo # CEDO Google Auth Application >> .env
    echo. >> .env
    echo # Server Configuration >> .env
    echo NODE_ENV=development >> .env
    echo PORT=5000 >> .env
    echo. >> .env
    echo # Database Configuration >> .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=3306 >> .env
    echo DB_NAME=cedo_auth >> .env
    echo DB_USER=root >> .env
    echo DB_PASSWORD=your_mysql_password_here >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET_DEV=your_jwt_secret_here_make_it_long_and_random >> .env
    echo JWT_SECRET=your_jwt_secret_here_make_it_long_and_random >> .env
    echo COOKIE_SECRET=your_cookie_secret_here_make_it_long_and_random >> .env
    echo. >> .env
    echo # Google OAuth Configuration ^(CRITICAL: Both must be the same^) >> .env
    echo GOOGLE_CLIENT_ID=your_google_client_id_here >> .env
    echo GOOGLE_CLIENT_ID_BACKEND=your_google_client_id_here >> .env
    echo GOOGLE_CLIENT_SECRET=your_google_client_secret_here >> .env
    echo. >> .env
    echo # Frontend Configuration >> .env
    echo FRONTEND_URL=http://localhost:3001 >> .env
    echo BASE_URL=http://localhost:5000 >> .env
    echo. >> .env
    echo # reCAPTCHA Configuration >> .env
    echo RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here >> .env
    echo. >> .env
    echo # Email Verification Requirement >> .env
    echo REQUIRE_GOOGLE_EMAIL_VERIFIED=false >> .env
    echo.
    echo .env file created successfully!
) else (
    echo .env file already exists.
)

echo.
echo ===========================================
echo  IMPORTANT: Update the following values
echo ===========================================
echo.
echo 1. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID_BACKEND
echo    - Both MUST be set to the same value
echo    - Get this from Google Cloud Console
echo    - Web Application Client ID
echo.
echo 2. GOOGLE_CLIENT_SECRET
echo    - Get this from Google Cloud Console
echo    - Web Application Client Secret
echo.
echo 3. DB_PASSWORD ^(and related MySQL passwords^)
echo    - Set to your actual MySQL root password
echo.
echo 4. JWT_SECRET_DEV and JWT_SECRET
echo    - Generate long random strings for security
echo.
echo ===========================================
echo  Google Cloud Console Setup
echo ===========================================
echo.
echo 1. Go to: https://console.cloud.google.com/
echo 2. Navigate to: APIs ^& Services ^> Credentials
echo 3. Create OAuth 2.0 Client ID ^(Web Application^)
echo 4. Set Authorized JavaScript origins:
echo    - http://localhost:3001
echo    - http://localhost:3000
echo 5. Set Authorized redirect URIs:
echo    - http://localhost:5000/auth/google/callback
echo.
echo 6. Copy the Client ID and Client Secret to your .env file
echo.
echo ===========================================
echo  Debugging Commands
echo ===========================================
echo.
echo To check current environment variables:
echo   node -e "require('dotenv').config(); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0,10) + '...'); console.log('GOOGLE_CLIENT_ID_BACKEND:', process.env.GOOGLE_CLIENT_ID_BACKEND?.substring(0,10) + '...'); console.log('Match:', process.env.GOOGLE_CLIENT_ID === process.env.GOOGLE_CLIENT_ID_BACKEND);"
echo.
echo To test Google token verification:
echo   npm run test-google-auth
echo.
echo ===========================================
pause 