@echo off
title CEDO - Docker Development
color 0C

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                Docker Development Environment                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Step 1: Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker Desktop
    echo Download: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker found

echo.
echo Step 2: Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop not running. Starting...
    echo Please wait while Docker Desktop starts...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (this may take 1-2 minutes)...
    
    :wait_docker
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo Still waiting for Docker...
        goto wait_docker
    )
)
echo ✅ Docker Desktop is running

echo.
echo Step 3: Cleaning up previous containers...
docker compose down -v 2>nul
echo ✅ Previous containers stopped

echo.
echo Step 4: Building and starting containers...
docker compose up -d --build
echo ✅ Containers started

echo.
echo Step 5: Waiting for services to initialize...
echo This may take 30-60 seconds for first-time setup...
timeout /t 30 /nobreak >nul

echo.
echo Step 6: Checking service health...
docker compose ps

echo.
echo Step 7: Initializing database...
docker compose exec backend npm run init-db 2>nul || echo Database already initialized

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   🎉 Docker Setup Complete!                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Services:
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000/api
echo 🗄️  Database: MySQL on localhost:3306
echo.
echo Login credentials:
echo 📧 Email: admin@cedo.gov.ph
echo 🔑 Password: admin123
echo.
echo Useful commands:
echo - View logs:    docker compose logs -f
echo - Stop:         docker compose down
echo - Restart:      docker compose restart
echo - Shell access: docker compose exec backend bash
echo.
echo Press any key to exit...
pause >nul 