@echo off
REM CEDO Backend Development Startup Script for Windows
REM This script sets the correct environment variables to prevent TLS deprecation warnings

echo 🚀 Starting CEDO Backend Development Server
echo ==========================================

REM Set NODE_ENV to development to enable TLS warning fixes
set NODE_ENV=development

REM Optional: Set other development environment variables
REM set MYSQL_HOST=127.0.0.1
REM set MONGODB_URI=mongodb://127.0.0.1:27017/cedo_auth

echo ✅ Environment: %NODE_ENV%
echo ✅ TLS warnings suppressed for local development
echo ✅ Starting server...
echo.

REM Start the development server
npm run dev 