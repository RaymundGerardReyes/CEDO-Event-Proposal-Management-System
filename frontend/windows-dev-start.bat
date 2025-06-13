@echo off
echo ================================================
echo   CEDO Partnership Management - Windows Dev Start
echo ================================================

REM Check if we're in the correct directory
if not exist "src" (
    echo Error: src directory not found!
    echo Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Kill any existing Node processes (common Windows issue)
echo Stopping any existing Node processes...
taskkill /F /IM node.exe 2>nul || echo No Node processes to kill

REM Clear build cache (Windows antivirus often corrupts this)
echo Cleaning build cache...
if exist ".next" rmdir /S /Q ".next"
if exist "node_modules\.cache" rmdir /S /Q "node_modules\.cache"

REM Set Windows-specific environment variables
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_ESLINT_PLUGIN=true

REM Start development server with Windows optimizations
echo Starting Next.js development server...
echo.
echo IMPORTANT: If you encounter UNKNOWN file errors:
echo 1. Add this project folder to your antivirus exclusions
echo 2. Temporarily disable real-time protection
echo 3. Run as administrator if needed
echo.
echo Server will start on: http://localhost:3000
echo ================================================

npm run dev

pause 