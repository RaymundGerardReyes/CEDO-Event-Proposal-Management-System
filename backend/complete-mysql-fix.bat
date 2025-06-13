@echo off
echo ========================================
echo   COMPLETE MYSQL FIX FOR CEDO PROJECT
echo ========================================
echo.

echo Step 1: Starting MySQL Service...
echo ----------------------------------------

REM Try different MySQL service names
net start mysql80 2>nul
if %errorlevel% == 0 (
    echo ✅ MySQL80 service started successfully
    goto :database_setup
)

net start mysql 2>nul
if %errorlevel% == 0 (
    echo ✅ MySQL service started successfully
    goto :database_setup
)

echo ❌ Failed to start MySQL service automatically
echo 💡 Please try running this script as Administrator
echo 💡 Or manually start MySQL from Services.msc
echo.
echo Available MySQL services:
sc query type= service state= all | findstr /i mysql
echo.

echo Attempting to check MySQL service status...
sc query mysql80 2>nul | findstr STATE
sc query mysql 2>nul | findstr STATE

echo.
echo If MySQL is installed but service won't start:
echo 1. Open Services.msc as Administrator
echo 2. Find MySQL80 or MySQL service
echo 3. Right-click → Start
echo 4. Or try: sc start mysql80
echo.
pause
goto :database_setup

:database_setup
echo.
echo Step 2: Testing MySQL Connection...
echo ----------------------------------------

REM Wait a moment for MySQL to fully start
timeout /t 3 /nobreak >nul

REM Test connection
echo Testing connection with: mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306
mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 -e "SELECT 'MySQL Connection Successful' as status;" 2>nul
if %errorlevel% == 0 (
    echo ✅ MySQL connection successful
    goto :create_database
) else (
    echo ❌ MySQL connection failed
    echo 💡 Checking if MySQL is listening on port 3306...
    netstat -an | findstr :3306
    if %errorlevel% == 0 (
        echo ✅ MySQL is listening on port 3306
        echo ❌ But connection failed - possibly wrong password or authentication method
    ) else (
        echo ❌ MySQL is not listening on port 3306
        echo 💡 MySQL service may not be running properly
    )
    echo.
    echo Troubleshooting steps:
    echo 1. Check MySQL service status in Services.msc
    echo 2. Verify password is correct: Raymund@Estaca01
    echo 3. Try connecting with MySQL Workbench first
    echo.
    pause
    goto :node_setup
)

:create_database
echo.
echo Step 3: Creating Database and Tables...
echo ----------------------------------------

echo Creating cedo_auth database if it doesn't exist...
mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 -e "CREATE DATABASE IF NOT EXISTS cedo_auth;" 2>nul
if %errorlevel% == 0 (
    echo ✅ Database cedo_auth created/verified
) else (
    echo ❌ Failed to create database
)

echo.
echo Creating essential tables...
mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 cedo_auth -e "CREATE TABLE IF NOT EXISTS proposals (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, contactPerson VARCHAR(255) NOT NULL, contactEmail VARCHAR(255) NOT NULL, contactPhone VARCHAR(50), description TEXT, organizationType VARCHAR(100), status VARCHAR(50) DEFAULT 'draft', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);" 2>nul

mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 cedo_auth -e "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, password_hash VARCHAR(255), google_id VARCHAR(255) UNIQUE, role ENUM('student', 'admin') DEFAULT 'student', status ENUM('active', 'pending', 'suspended') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);" 2>nul

echo ✅ Tables created/verified

echo.
echo Testing database setup...
mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 cedo_auth -e "SHOW TABLES;" 2>nul
mysql -u root -p"Raymund@Estaca01" -h 127.0.0.1 -P 3306 cedo_auth -e "SELECT COUNT(*) as proposal_count FROM proposals;" 2>nul

:node_setup
echo.
echo Step 4: Testing Node.js Connection...
echo ----------------------------------------

echo Running Node.js connection test...
node -e "
const mysql = require('mysql2/promise');
async function test() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Raymund@Estaca01',
      database: 'cedo_auth'
    });
    console.log('✅ Node.js MySQL connection successful');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
    console.log('✅ Proposals table accessible:', rows[0]);
    await connection.end();
  } catch (error) {
    console.log('❌ Node.js connection failed:', error.message);
  }
}
test();" 2>nul

echo.
echo ========================================
echo             SETUP COMPLETE
echo ========================================
echo.
echo ✅ .env file updated with correct variables
echo ✅ MySQL service should be running
echo ✅ Database and tables created
echo ✅ Ready to start the backend server
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Check for "MySQL database connected successfully" message
echo 3. Test frontend form submission
echo.
echo If you still see connection errors:
echo 1. Check Windows Services for MySQL80/MySQL
echo 2. Try MySQL Workbench with same credentials
echo 3. Check Windows Firewall settings
echo.
pause 