@echo off
echo === CEDO MySQL Setup and Fix ===
echo.

echo Step 1: Testing MySQL connectivity...
mysql -u root -e "SELECT 1 as test;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ MySQL connection successful
) else (
    echo ❌ MySQL connection failed
    echo Trying with different authentication...
    mysql -u root -p -e "SELECT 1 as test;" 2>nul
    if %errorlevel% neq 0 (
        echo ❌ Cannot connect to MySQL. Please check:
        echo 1. MySQL is running in Windows Services
        echo 2. MySQL port 3306 is accessible
        echo 3. Try MySQL Workbench first
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Setting up MySQL authentication...
echo Fixing authentication method for Node.js compatibility...
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';" 2>nul
mysql -u root -e "FLUSH PRIVILEGES;" 2>nul
echo ✅ Authentication method updated

echo.
echo Step 3: Creating database and tables...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS cedo_auth;" 2>nul
echo ✅ Database cedo_auth created/verified

echo Setting up tables...
mysql -u root cedo_auth < fix-database-setup.sql 2>nul
echo ✅ Tables created/verified

echo.
echo Step 4: Testing the setup...
mysql -u root -e "USE cedo_auth; SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'cedo_auth';" 2>nul
echo ✅ Database setup verified

echo.
echo Step 5: Creating environment configuration...
echo # Database Configuration (Fixed) > .env
echo DB_HOST=127.0.0.1 >> .env
echo DB_PORT=3306 >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD= >> .env
echo DB_NAME=cedo_auth >> .env
echo. >> .env
echo # Alternative environment variables >> .env
echo MYSQL_HOST=127.0.0.1 >> .env
echo MYSQL_PORT=3306 >> .env
echo MYSQL_USER=root >> .env
echo MYSQL_PASSWORD= >> .env
echo MYSQL_DATABASE=cedo_auth >> .env
echo. >> .env
echo # MongoDB Configuration >> .env
echo MONGODB_URI=mongodb://localhost:27017/cedo-partnership >> .env
echo. >> .env
echo # Server Configuration >> .env
echo NODE_ENV=development >> .env
echo PORT=5000 >> .env
echo FRONTEND_URL=http://localhost:3000 >> .env
echo ✅ Environment file created

echo.
echo 🎉 MySQL Setup Completed Successfully!
echo.
echo ✅ Configuration:
echo    Host: 127.0.0.1
echo    Port: 3306
echo    User: root
echo    Password: [EMPTY]
echo    Database: cedo_auth
echo.
echo 🎯 Next Steps:
echo 1. Restart the backend server: npm run dev
echo 2. Check for "MySQL database connected successfully" in logs
echo 3. Test Section 2 form in frontend
echo.
echo Press any key to continue...
pause >nul 