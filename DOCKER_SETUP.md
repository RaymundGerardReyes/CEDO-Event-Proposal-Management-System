# 🐳 CEDO Partnership Management - Docker Setup Guide

## 📋 Overview

This guide provides a comprehensive Docker setup for the CEDO Partnership Management system with enhanced configurations, proper dependency management, and optimized builds.

## 🔧 Fixed Issues

### ✅ Backend Dockerfile Fixes:
- ✅ Added missing `wait-for-it.sh` script
- ✅ Proper dependency installation with `npm ci`
- ✅ Enhanced security with non-root user
- ✅ Added health checks for container monitoring
- ✅ Proper directory permissions and structure

### ✅ Frontend Dockerfile Fixes:
- ✅ Corrected public directory path (`/public` not `/src/public`)
- ✅ Multi-stage build optimization
- ✅ Added standalone output configuration in Next.js
- ✅ Proper environment variable handling
- ✅ Enhanced security with non-root user

### ✅ Docker Compose Fixes:
- ✅ Added proper networking configuration
- ✅ Enhanced health checks for all services
- ✅ Proper volume management
- ✅ Fixed service dependencies
- ✅ Added development-specific configurations

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD_SECRET=your_secure_root_password
MYSQL_DATABASE_NAME=cedo_partnership_db
MYSQL_USER_NAME=cedo_user
MYSQL_USER_PASSWORD=your_secure_user_password

# Backend API Configuration
API_SECRET_DEV=your_api_secret_key_for_development
JWT_SECRET_DEV=your_jwt_secret_key_for_development
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Google reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID_BACKEND=your_google_client_id_for_backend
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_for_frontend

# Development URLs
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean rebuild (removes volumes)
docker-compose down -v && docker-compose up --build
```

## 📁 File Structure

```
CEDO Google Auth/
├── docker-compose.yml          # Enhanced Docker Compose configuration
├── .env                        # Environment variables (create from .env.example)
├── backend/
│   ├── Dockerfile             # Enhanced Backend Dockerfile
│   ├── wait-for-it.sh         # Database wait script (newly added)
│   ├── package.json           # Backend dependencies
│   └── server.js              # Backend server with health endpoint
├── frontend/
│   ├── Dockerfile             # Enhanced Frontend Dockerfile
│   ├── next.config.js         # Updated with standalone output
│   ├── package.json           # Frontend dependencies
│   ├── public/                # Public assets (correct path)
│   └── src/
│       └── app/
│           └── api/
│               └── health/
│                   └── route.js  # Frontend health endpoint
```

## 🔍 Service Details

### MySQL Database
- **Port**: 3307 (external) → 3306 (internal)
- **Health Check**: MySQL ping with authentication
- **Volumes**: Persistent data storage
- **Network**: cedo-network

### Backend Service
- **Port**: 5000
- **Health Check**: `/api/health` endpoint
- **Features**: 
  - Database initialization on startup
  - File uploads support
  - Logging directory
  - Non-root user security

### Frontend Service
- **Port**: 3000
- **Health Check**: Root endpoint
- **Features**:
  - Hot reload in development
  - Standalone build optimization
  - File watching with polling
  - Non-root user security

## 🛠️ Development Commands

```bash
# View service status
docker-compose ps

# Execute commands in containers
docker-compose exec backend npm run init-db
docker-compose exec frontend npm run build

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Restart specific service
docker-compose restart backend

# Scale services (if needed)
docker-compose up --scale backend=2

# Clean up everything
docker-compose down -v --rmi all
```

## 🔧 Troubleshooting

### Common Issues:

1. **Port Conflicts**:
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   netstat -tulpn | grep :3307
   ```

2. **Permission Issues**:
   ```bash
   # Fix file permissions
   chmod +x backend/wait-for-it.sh
   ```

3. **Database Connection Issues**:
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   
   # Test database connection
   docker-compose exec mysql mysql -u root -p
   ```

4. **Frontend Build Issues**:
   ```bash
   # Clear Next.js cache
   docker-compose exec frontend rm -rf .next
   docker-compose restart frontend
   ```

## 📊 Health Monitoring

All services include health checks:

- **MySQL**: `mysqladmin ping`
- **Backend**: `curl http://localhost:5000/api/health`
- **Frontend**: `curl http://localhost:3000/api/health`

Check health status:
```bash
docker-compose ps
```

## 🚀 Production Deployment

For production deployment, modify the docker-compose.yml:

1. Change `NODE_ENV` to `production`
2. Use production database credentials
3. Enable SSL/TLS certificates
4. Configure proper logging
5. Set up monitoring and alerting

## 📝 Notes

- The `wait-for-it.sh` script ensures proper service startup order
- Volume mounts enable hot reload in development
- Health checks ensure service reliability
- Non-root users enhance container security
- Standalone Next.js build optimizes production deployment

## 🔗 Useful Links

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/) 