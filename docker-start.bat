@echo off
echo ========================================
echo CEDO Google Auth - Docker Startup Script
echo ========================================

echo Step 1: Stopping any existing containers...
docker-compose down --volumes --remove-orphans
echo ✅ Existing containers stopped

echo.
echo Step 2: Cleaning up Docker volumes...
docker volume prune -f
echo ✅ Docker volumes cleaned

echo.
echo Step 3: Building fresh containers...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)
echo ✅ Containers built successfully

echo.
echo Step 4: Starting MySQL container first...
docker-compose up -d mysql
if %errorlevel% neq 0 (
    echo ❌ MySQL container failed to start!
    pause
    exit /b 1
)

echo Waiting for MySQL to be ready...
timeout /t 30 /nobreak > nul

echo.
echo Step 5: Checking MySQL container status...
docker-compose logs mysql
echo.

echo Step 6: Starting all services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start all services!
    pause
    exit /b 1
)

echo.
echo ✅ All services started successfully!
echo.
echo 📋 Service Status:
docker-compose ps

echo.
echo 🌐 Application URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000/api
echo - Health Check: http://localhost:5000/api/health
echo.
echo 📊 To view logs:
echo - All services: docker-compose logs -f
echo - MySQL only: docker-compose logs -f mysql
echo - Backend only: docker-compose logs -f backend
echo - Frontend only: docker-compose logs -f frontend
echo.
echo 🛑 To stop all services:
echo - docker-compose down
echo.
pause 