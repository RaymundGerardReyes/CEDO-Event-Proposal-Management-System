@echo off
echo Starting CEDO Backend Server...
echo.

REM Kill any existing processes on port 5000
echo Checking for existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Starting backend server...
cd backend
node server.js

pause 