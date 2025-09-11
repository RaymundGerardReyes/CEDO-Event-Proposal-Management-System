@echo off
REM Edge Debug Launcher for Windows
REM This script launches Edge with remote debugging enabled

echo 🚀 Launching Edge with remote debugging...
echo.

REM Kill any existing Edge processes
echo 🔄 Closing existing Edge instances...
taskkill /F /IM msedge.exe /T 2>nul
timeout /t 2 /nobreak >nul

REM Create debug profile directory
if not exist "%TEMP%\edge-debug" mkdir "%TEMP%\edge-debug"

REM Launch Edge with debugging
echo 🌐 Starting Edge with remote debugging on port 9224...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
    --remote-debugging-port=9224 ^
    --user-data-dir="%TEMP%\edge-debug" ^
    --disable-web-security ^
    --no-first-run ^
    --disable-extensions ^
    http://localhost:3000

echo.
echo ✅ Edge launched with debugging enabled!
echo 📍 Remote debugging port: 9224
echo 🌐 URL: http://localhost:3000
echo.
echo 🔗 Now you can attach the debugger in Cursor AI:
echo    1. Select "🔗 Attach to Edge (Manual Launch)"
echo    2. Press F5 to attach
echo.
pause

