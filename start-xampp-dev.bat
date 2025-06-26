@echo off
title CEDO - XAMPP Development
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                XAMPP Development Environment                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Step 1: Checking XAMPP installation...
if exist "C:\xampp\xampp-control.exe" (
    echo ✅ XAMPP found at C:\xampp\
) else (
    echo ❌ XAMPP not found. Installing...
    winget install ApacheFriends.Xampp.8.1
    echo ✅ XAMPP installed
)

echo.
echo Step 2: Starting XAMPP Control Panel...
start "" "C:\xampp\xampp-control.exe"
echo ✅ XAMPP Control Panel opened

echo.
echo Step 3: Please start MySQL in XAMPP Control Panel
echo Press any key after MySQL is running...
pause >nul

echo.
echo Step 4: Setting up database...
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root < setup-xampp-db.sql
    echo ✅ Database setup complete
) else (
    echo ❌ MySQL not found in XAMPP
)

echo.
echo Step 5: Installing dependencies...
cd backend
call npm install
cd ..\frontend
call npm install
cd ..

echo.
echo Step 6: Starting development servers...
echo.
echo Opening 3 terminals:
echo 1. Backend (http://localhost:5000)
echo 2. Frontend (http://localhost:3000)
echo 3. This monitoring terminal

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 XAMPP Setup Complete!                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Services:
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000/api
echo 🗄️  Database: http://localhost/phpmyadmin
echo.
echo Login credentials:
echo 📧 Email: admin@cedo.gov.ph
echo 🔑 Password: admin123
echo.
echo Press any key to exit...
pause >nul 