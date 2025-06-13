@echo off
echo ================================================
echo   CEDO Frontend Environment Setup (Windows)
echo ================================================

echo Setting environment variables for frontend...

REM Database Configuration (matching backend)
set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=Raymund@Estaca01
set DB_NAME=cedo_auth

REM Alternative variable names
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_PASSWORD=Raymund@Estaca01
set MYSQL_DATABASE=cedo_auth

REM JWT Configuration
set JWT_SECRET=f7117f2cea2a96d0e3bf69302a17ce702d53fe0ad17d82530eabfca14ac02540

REM API Configuration
set BACKEND_URL=http://localhost:5000
set FRONTEND_URL=http://localhost:3000

REM Next.js Configuration
set NODE_ENV=development

echo ================================================
echo Environment variables set successfully!
echo ================================================
echo.
echo Now starting the development server...
echo Make sure your backend is running on port 5000
echo.

REM Clear cache and start development server
if exist ".next" rmdir /S /Q ".next"
npm run dev

pause 