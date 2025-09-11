@echo off
REM Chrome Debug Launcher for Windows - Enhanced Version
REM This script launches Chrome with remote debugging enabled

echo 🚀 Launching Chrome with remote debugging...
echo.

REM Kill any existing Chrome processes
echo 🔄 Closing existing Chrome instances...
taskkill /F /IM chrome.exe /T 2>nul
timeout /t 3 /nobreak >nul

REM Create debug profile directory
if not exist "%TEMP%\chrome-debug-9222" mkdir "%TEMP%\chrome-debug-9222"
if not exist "%TEMP%\chrome-debug-9223" mkdir "%TEMP%\chrome-debug-9223"
if not exist "%TEMP%\chrome-debug-9224" mkdir "%TEMP%\chrome-debug-9224"

REM Check if Chrome exists
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not exist "%CHROME_PATH%" (
    echo ❌ Chrome not found! Please install Chrome or update the path.
    pause
    exit /b 1
)

echo 📍 Chrome found: %CHROME_PATH%

REM Launch Chrome with debugging on multiple ports
echo 🌐 Starting Chrome with remote debugging on port 9222...
start "" "%CHROME_PATH%" ^
    --remote-debugging-port=9222 ^
    --user-data-dir="%TEMP%\chrome-debug-9222" ^
    --disable-web-security ^
    --disable-features=VizDisplayCompositor ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-extensions ^
    --disable-plugins ^
    --disable-background-timer-throttling ^
    --disable-backgrounding-occluded-windows ^
    --disable-renderer-backgrounding ^
    --disable-dev-shm-usage ^
    --no-sandbox ^
    http://localhost:3000

echo.
echo ✅ Chrome launched with debugging enabled!
echo 📍 Remote debugging port: 9222
echo 🌐 URL: http://localhost:3000
echo.
echo 🔗 Now you can attach the debugger in Cursor AI:
echo    1. Select "🔗 Attach to Chrome"
echo    2. Press F5 to attach
echo.
echo 🆘 If port 9222 doesn't work, try:
echo    - "🔗 Attach to Chrome (Port 9223)"
echo    - "🔗 Attach to Chrome (Port 9224)"
echo.
pause
