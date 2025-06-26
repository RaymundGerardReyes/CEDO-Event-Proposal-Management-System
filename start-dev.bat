@echo off
title CEDO Google Auth - Development Environment
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                CEDO Google Auth Development                  ║
echo  ║                    Environment Setup                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo Choose your development environment:
echo.
echo [1] 🖥️  Localhost Development (XAMPP/Local MySQL)
echo [2] 🐳 Docker Development (Containers)
echo [3] ❓ Help - Which should I choose?
echo [4] 🚪 Exit
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" goto localhost
if "%choice%"=="2" goto docker
if "%choice%"=="3" goto help
if "%choice%"=="4" goto exit
goto invalid

:localhost
echo.
echo ========================================
echo Starting Localhost Development Setup...
echo ========================================
call setup-local-dev.bat
goto end

:docker
echo.
echo ========================================
echo Starting Docker Development Setup...
echo ========================================
call setup-docker-dev.bat
goto end

:help
echo.
echo ========================================
echo Development Environment Guide
echo ========================================
echo.
echo 🖥️  LOCALHOST DEVELOPMENT:
echo   ✅ Faster development (no container overhead)
echo   ✅ Direct file editing and hot reload
echo   ✅ Easier debugging
echo   ❌ Requires local MySQL installation
echo   ❌ Environment differences between developers
echo.
echo 🐳 DOCKER DEVELOPMENT:
echo   ✅ Consistent environment for all developers
echo   ✅ No need to install MySQL locally
echo   ✅ Production-like environment
echo   ❌ Slightly slower (container overhead)
echo   ❌ Requires Docker Desktop
echo.
echo RECOMMENDATION:
echo - Use LOCALHOST for active development/debugging
echo - Use DOCKER for testing and production-like environment
echo.
pause
goto start

:invalid
echo.
echo ❌ Invalid choice. Please enter 1, 2, 3, or 4.
echo.
pause
goto start

:exit
echo.
echo 👋 Goodbye!
exit /b 0

:end
echo.
echo 🎉 Setup complete! Happy coding!
pause

:start
cls
goto :eof 