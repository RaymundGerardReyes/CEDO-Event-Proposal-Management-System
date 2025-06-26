@echo off
echo ========================================
echo CEDO Secure Docker Startup
echo ========================================

echo Step 1: Checking for Docker secrets setup...
if not exist "secrets" (
    echo ❌ Secrets directory not found!
    echo.
    echo You must set up secrets first for security.
    echo Run: setup-secrets.bat
    echo.
    pause
    exit /b 1
)

echo Step 2: Verifying required secret files...
set MISSING_SECRETS=0

if not exist "secrets\mysql_root_password.txt" (
    echo ❌ Missing: mysql_root_password.txt
    set MISSING_SECRETS=1
)

if not exist "secrets\mysql_password.txt" (
    echo ❌ Missing: mysql_password.txt
    set MISSING_SECRETS=1
)

if not exist "secrets\jwt_secret.txt" (
    echo ❌ Missing: jwt_secret.txt
    set MISSING_SECRETS=1
)

if %MISSING_SECRETS%==1 (
    echo.
    echo ❌ Some required secret files are missing!
    echo Run: setup-secrets.bat to create them.
    echo.
    pause
    exit /b 1
)

echo ✅ All required secrets found

echo.
echo Step 3: Stopping any existing containers...
docker-compose down --volumes --remove-orphans

echo.
echo Step 4: Building containers with security enhancements...
docker-compose build --no-cache

echo.
echo Step 5: Starting MySQL with Docker secrets...
docker-compose up -d mysql

echo Waiting for MySQL to initialize with secure configuration...
timeout /t 20 /nobreak > nul

echo.
echo Step 6: Checking MySQL startup logs...
docker-compose logs mysql | findstr -i "ready for connections"
if %errorlevel% neq 0 (
    echo ⚠️  MySQL might still be starting. Check logs with:
    echo     docker-compose logs mysql
)

echo.
echo Step 7: Starting all services with secure configuration...
docker-compose up -d

echo.
echo ✅ CEDO application started with Docker secrets!
echo.
echo 🔒 Security Features Enabled:
echo - MySQL passwords stored as in-memory secrets
echo - API keys protected in secure files
echo - JWT secrets isolated from environment
echo - No credentials exposed in docker-compose.yml
echo.
echo 🌐 Application URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000/api
echo - Health Check: http://localhost:5000/api/health
echo.
echo 📊 To monitor:
echo - docker-compose logs -f
echo - docker-compose ps
echo.
echo 🛑 To stop securely:
echo - docker-compose down
echo.
pause 