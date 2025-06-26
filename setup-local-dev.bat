@echo off
echo ========================================
echo CEDO Google Auth - Local Development Setup
echo ========================================

echo.
echo Step 1: Checking XAMPP installation...
if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ✅ XAMPP MySQL found
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    echo ✅ MySQL Server found
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else (
    echo ❌ MySQL not found. Please install XAMPP or MySQL Server
    echo.
    echo To install XAMPP: winget install ApacheFriends.Xampp.8.1
    echo Then restart this script
    pause
    exit /b 1
)

echo.
echo Step 2: Starting MySQL service...
net start MySQL80 2>nul || net start mysql 2>nul || echo MySQL service may already be running

echo.
echo Step 3: Creating database...
%MYSQL_PATH% -u root -e "CREATE DATABASE IF NOT EXISTS cedo_auth;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database 'cedo_auth' created/verified
) else (
    echo ❌ Failed to create database. Trying with password...
    set /p MYSQL_PASS=Enter MySQL root password (or press Enter if no password): 
    if "%MYSQL_PASS%"=="" (
        %MYSQL_PATH% -u root -e "CREATE DATABASE IF NOT EXISTS cedo_auth;"
    ) else (
        %MYSQL_PATH% -u root -p%MYSQL_PASS% -e "CREATE DATABASE IF NOT EXISTS cedo_auth;"
    )
)

echo.
echo Step 4: Installing backend dependencies...
cd backend
call npm install

echo.
echo Step 5: Initializing database tables...
call npm run init-db

echo.
echo Step 6: Installing frontend dependencies...
cd ..\frontend
call npm install

echo.
echo ========================================
echo ✅ Local development setup complete!
echo ========================================
echo.
echo To start development:
echo 1. Backend:  cd backend && npm run dev
echo 2. Frontend: cd frontend && npm run dev
echo.
echo To use Docker instead:
echo 1. Start Docker Desktop
echo 2. Run: docker compose up -d
echo.
pause 