@echo off
echo 🚀 Starting CEDO Google Auth Debug Session
echo.

echo 📦 Installing dependencies if needed...
call npm run install:all

echo.
echo 🔧 Starting Backend with Debug (Port 5000, Debug Port 9229)...
start "Backend Debug" cmd /k "cd backend && node --inspect=9229 server.js"

echo.
echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting Frontend (Port 3000)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Debug session started!
echo.
echo 📋 Debug Information:
echo    - Backend: http://localhost:5000 (Debug: ws://localhost:9229)
echo    - Frontend: http://localhost:3000
echo    - VS Code: Press F5 to attach debugger
echo.
echo 🎯 To debug in VS Code:
echo    1. Open VS Code in this directory
echo    2. Press F5 or go to Run and Debug view
echo    3. Select "🔧 Attach to Backend (Node.js)"
echo    4. Set breakpoints and start debugging!
echo.
pause

