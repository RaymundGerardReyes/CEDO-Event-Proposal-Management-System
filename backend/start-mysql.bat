@echo off
echo ========================================
echo CEDO MySQL Service Starter
echo ========================================

echo Step 1: Attempting to start MySQL80 service...
net start MySQL80
if %errorlevel% equ 0 (
    echo ✅ MySQL80 service started successfully!
    goto :test_connection
) else (
    echo ❌ Failed to start MySQL80 service
)

echo.
echo Step 2: Checking if XAMPP MySQL is available...
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo ✅ XAMPP MySQL found. Please start XAMPP Control Panel manually.
    echo    Go to XAMPP Control Panel and click START next to MySQL
    pause
    goto :test_connection
) else (
    echo ❌ XAMPP MySQL not found
)

echo.
echo Step 3: Manual service check...
echo Current MySQL service status:
sc query MySQL80

echo.
echo ========================================
echo TROUBLESHOOTING STEPS:
echo ========================================
echo 1. Run this script as Administrator
echo 2. Install XAMPP if MySQL service won't start
echo 3. Check Windows Services (services.msc) for MySQL80
echo 4. Restart your computer if services are stuck
echo ========================================
pause
exit /b 1

:test_connection
echo.
echo Step 4: Testing MySQL connection...
echo Waiting 5 seconds for MySQL to fully start...
timeout /t 5 /nobreak > nul

echo Testing connection to MySQL...
netstat -an | findstr :3306
if %errorlevel% equ 0 (
    echo ✅ MySQL is now listening on port 3306!
    echo.
    echo You can now run: npm run dev
    echo ========================================
) else (
    echo ❌ MySQL is not responding on port 3306
    echo Please check XAMPP Control Panel or Windows Services
)

echo.
pause 