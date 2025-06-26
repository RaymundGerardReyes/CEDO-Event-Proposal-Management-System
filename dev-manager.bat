echo off
title CEDO Development Manager
color 0A

:main_menu
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║              CEDO Google Auth Development Manager            ║
echo  ║                     Choose Your Environment                  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo Current Status:
echo ===============

REM Check XAMPP status
if exist "C:\xampp\xampp-control.exe" (
    echo 🟢 XAMPP: Installed
) else (
    echo 🔴 XAMPP: Not installed
)

REM Check Docker status
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo 🟢 Docker: Running
) else (
    docker --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🟡 Docker: Installed but not running
    ) else (
        echo 🔴 Docker: Not installed
    )
)

echo.
echo Development Options:
echo ===================
echo.
echo [1] 🖥️  Start XAMPP Development (Localhost)
echo [2] 🐳 Start Docker Development (Containers)
echo [3] 🔄 Switch from Docker to XAMPP
echo [4] 🔄 Switch from XAMPP to Docker
echo [5] 🛠️  Install Missing Components
echo [6] 📊 View Service Status
echo [7] 🧹 Clean All Environments
echo [8] ❓ Help & Documentation
echo [9] 🚪 Exit
echo.

set /p choice=Enter your choice (1-9): 

if "%choice%"=="1" goto xampp_dev
if "%choice%"=="2" goto docker_dev
if "%choice%"=="3" goto switch_to_xampp
if "%choice%"=="4" goto switch_to_docker
if "%choice%"=="5" goto install_components
if "%choice%"=="6" goto view_status
if "%choice%"=="7" goto clean_all
if "%choice%"=="8" goto help
if "%choice%"=="9" goto exit
goto invalid_choice

:xampp_dev
echo.
echo Starting XAMPP Development Environment...
call start-xampp-dev.bat
goto main_menu

:docker_dev
echo.
echo Starting Docker Development Environment...
call start-docker-dev.bat
goto main_menu

:switch_to_xampp
echo.
echo Switching from Docker to XAMPP...
echo Stopping Docker containers...
docker compose down -v 2>nul
echo Starting XAMPP...
call start-xampp-dev.bat
goto main_menu

:switch_to_docker
echo.
echo Switching from XAMPP to Docker...
echo Note: Please stop XAMPP services manually in XAMPP Control Panel
echo Starting Docker...
call start-docker-dev.bat
goto main_menu

:install_components
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Component Installation                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [1] Install XAMPP
echo [2] Install Docker Desktop
echo [3] Install Node.js
echo [4] Install All Components
echo [5] Back to main menu
echo.
set /p install_choice=Choose component to install (1-5): 

if "%install_choice%"=="1" (
    echo Installing XAMPP...
    winget install ApacheFriends.Xampp.8.1
    echo ✅ XAMPP installation complete
)
if "%install_choice%"=="2" (
    echo Installing Docker Desktop...
    winget install Docker.DockerDesktop
    echo ✅ Docker Desktop installation complete
)
if "%install_choice%"=="3" (
    echo Installing Node.js...
    winget install OpenJS.NodeJS
    echo ✅ Node.js installation complete
)
if "%install_choice%"=="4" (
    echo Installing all components...
    winget install ApacheFriends.Xampp.8.1
    winget install Docker.DockerDesktop
    winget install OpenJS.NodeJS
    echo ✅ All components installation complete
)
if "%install_choice%"=="5" goto main_menu

pause
goto main_menu

:view_status
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      Service Status                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo XAMPP Status:
echo =============
if exist "C:\xampp\xampp-control.exe" (
    echo ✅ XAMPP Control Panel: Available
    netstat -an | findstr :80 >nul && echo ✅ Apache: Running || echo ❌ Apache: Not running
    netstat -an | findstr :3306 >nul && echo ✅ MySQL: Running || echo ❌ MySQL: Not running
) else (
    echo ❌ XAMPP: Not installed
)

echo.
echo Docker Status:
echo =============
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Desktop: Running
    docker compose ps 2>nul
) else (
    echo ❌ Docker Desktop: Not running
)

echo.
echo Application Status:
echo ==================
netstat -an | findstr :3000 >nul && echo ✅ Frontend (3000): Running || echo ❌ Frontend (3000): Not running
netstat -an | findstr :5000 >nul && echo ✅ Backend (5000): Running || echo ❌ Backend (5000): Not running

echo.
pause
goto main_menu

:clean_all
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Cleaning All Environments                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Stopping Docker containers...
docker compose down -v 2>nul

echo Cleaning Docker images...
docker system prune -f 2>nul

echo Cleaning node_modules...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"

echo.
echo ✅ All environments cleaned
echo Note: Please manually stop XAMPP services if running
echo.
pause
goto main_menu

:help
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Help & Documentation                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo XAMPP Development:
echo - Faster development and debugging
echo - Direct file access and editing
echo - Uses local MySQL database
echo - Access phpMyAdmin at http://localhost/phpmyadmin
echo.
echo Docker Development:
echo - Consistent environment across machines
echo - Production-like setup
echo - Isolated containers
echo - Automatic dependency management
echo.
echo Switching Between Environments:
echo - Stop current environment before switching
echo - Database data is preserved in both environments
echo - Use the switch options for seamless transition
echo.
echo Troubleshooting:
echo - Port conflicts: Stop other services using ports 3000, 5000, 3306
echo - Permission issues: Run as administrator
echo - Docker issues: Restart Docker Desktop
echo - XAMPP issues: Check XAMPP Control Panel
echo.
pause
goto main_menu

:invalid_choice
echo.
echo ❌ Invalid choice. Please enter a number between 1-9.
pause
goto main_menu

:exit
echo.
echo 👋 Thank you for using CEDO Development Manager!
echo Happy coding! 🚀
pause
exit /b 0 