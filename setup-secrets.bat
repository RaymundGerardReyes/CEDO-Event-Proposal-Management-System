@echo off
echo ========================================
echo CEDO Docker Secrets Setup
echo ========================================
echo.
echo This script will create secure secret files for Docker Compose.
echo These files will NOT be committed to version control.
echo.

REM Create secrets directory
if not exist "secrets" (
    mkdir secrets
    echo ✅ Created secrets directory
)

REM Create .gitignore for secrets if it doesn't exist
if not exist "secrets\.gitignore" (
    echo # Ignore all secret files > secrets\.gitignore
    echo * >> secrets\.gitignore
    echo !.gitignore >> secrets\.gitignore
    echo ✅ Created .gitignore for secrets directory
)

echo.
echo 📝 Please enter your secure credentials:
echo    (Leave blank to keep existing values)
echo.

REM MySQL Root Password
set /p MYSQL_ROOT_PASS=Enter MySQL Root Password (current: %MYSQL_ROOT_PASS%): 
if not "%MYSQL_ROOT_PASS%"=="" (
    echo %MYSQL_ROOT_PASS% > secrets\mysql_root_password.txt
    echo ✅ MySQL root password saved
) else (
    if not exist "secrets\mysql_root_password.txt" (
        echo Raymund@Estaca01 > secrets\mysql_root_password.txt
        echo ⚠️  Using default MySQL root password
    )
)

REM MySQL User Password
set /p MYSQL_USER_PASS=Enter MySQL User Password: 
if not "%MYSQL_USER_PASS%"=="" (
    echo %MYSQL_USER_PASS% > secrets\mysql_password.txt
    echo ✅ MySQL user password saved
) else (
    if not exist "secrets\mysql_password.txt" (
        echo Raymund@Estaca01 > secrets\mysql_password.txt
        echo ⚠️  Using default MySQL user password
    )
)

REM API Secret
set /p API_SECRET=Enter API Secret (32+ characters): 
if not "%API_SECRET%"=="" (
    echo %API_SECRET% > secrets\api_secret.txt
    echo ✅ API secret saved
) else (
    if not exist "secrets\api_secret.txt" (
        echo c7a626de5d37cfeafd384237b77ba9d782aa6b213c477798bf55a36b24898b7e > secrets\api_secret.txt
        echo ⚠️  Using default API secret
    )
)

REM JWT Secret
set /p JWT_SECRET=Enter JWT Secret (64+ characters): 
if not "%JWT_SECRET%"=="" (
    echo %JWT_SECRET% > secrets\jwt_secret.txt
    echo ✅ JWT secret saved
) else (
    if not exist "secrets\jwt_secret.txt" (
        echo f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540 > secrets\jwt_secret.txt
        echo ⚠️  Using default JWT secret
    )
)

REM Email Password
set /p EMAIL_PASS=Enter Email Password: 
if not "%EMAIL_PASS%"=="" (
    echo %EMAIL_PASS% > secrets\email_password.txt
    echo ✅ Email password saved
) else (
    if not exist "secrets\email_password.txt" (
        echo your-email-password > secrets\email_password.txt
        echo ⚠️  Using placeholder email password
    )
)

REM reCAPTCHA Secret
set /p RECAPTCHA_SECRET=Enter reCAPTCHA Secret Key: 
if not "%RECAPTCHA_SECRET%"=="" (
    echo %RECAPTCHA_SECRET% > secrets\recaptcha_secret.txt
    echo ✅ reCAPTCHA secret saved
) else (
    if not exist "secrets\recaptcha_secret.txt" (
        echo your-recaptcha-secret > secrets\recaptcha_secret.txt
        echo ⚠️  Using placeholder reCAPTCHA secret
    )
)

REM Google Client Secret
set /p GOOGLE_SECRET=Enter Google Client Secret: 
if not "%GOOGLE_SECRET%"=="" (
    echo %GOOGLE_SECRET% > secrets\google_client_secret.txt
    echo ✅ Google client secret saved
) else (
    if not exist "secrets\google_client_secret.txt" (
        echo your-google-client-secret > secrets\google_client_secret.txt
        echo ⚠️  Using placeholder Google client secret
    )
)

echo.
echo ✅ All secrets have been configured!
echo.
echo 🔒 Security Notes:
echo - Secret files are stored in ./secrets/ directory
echo - This directory is ignored by Git (not committed)
echo - Secrets are mounted as in-memory files in containers
echo - No passwords are exposed in docker-compose.yml
echo.
echo 📋 Next Steps:
echo 1. Review and update any placeholder values
echo 2. Run: docker-compose up --build
echo 3. Your application will use secure Docker secrets
echo.
echo 🛡️  Your credentials are now secure!
echo.
pause 