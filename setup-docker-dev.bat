@echo off
echo ========================================
echo CEDO Google Auth - Docker Development Setup
echo ========================================

echo.
echo Step 1: Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker Desktop
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker found
echo.

echo Step 2: Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running
    echo.
    echo Please start Docker Desktop:
    echo 1. Open Docker Desktop from Start Menu
    echo 2. Wait for it to fully start (whale icon in system tray)
    echo 3. Run this script again
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running
echo.

echo Step 3: Stopping any existing containers...
docker compose down -v 2>nul

echo.
echo Step 4: Building and starting containers...
docker compose up -d --build

echo.
echo Step 5: Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Step 6: Checking container status...
docker compose ps

echo.
echo ========================================
echo ✅ Docker development setup complete!
echo ========================================
echo.
echo Services running:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:5000
echo - MySQL:    localhost:3306
echo.
echo To view logs: docker compose logs -f
echo To stop:      docker compose down
echo.
pause 