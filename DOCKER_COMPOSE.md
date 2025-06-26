# 🐳 CEDO Docker Compose Configuration

This document describes the enhanced Docker Compose setup for the CEDO Google Auth application with multi-stage builds and multiple deployment profiles.

## 📋 Table of Contents

- [Overview](#overview)
- [Service Profiles](#service-profiles)
- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Environment Variables](#environment-variables)
- [Port Configuration](#port-configuration)
- [Volume Management](#volume-management)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Docker Compose configuration supports multiple deployment scenarios:

- **Development**: Full-featured development environment with hot-reload
- **Production**: Optimized production deployment
- **Testing**: Isolated testing environment
- **Bundle Analysis**: Frontend bundle size analysis

## 📁 Service Profiles

### Default Profile (Development)
```bash
docker-compose up
```

**Services included:**
- `mysql` - MySQL 8.0 database
- `backend` - Backend API (development target)
- `frontend` - Frontend app (development target with Turbopack)

### Production Profile
```bash
docker-compose --profile production up
```

**Services included:**
- `mysql` - MySQL 8.0 database
- `backend-prod` - Backend API (production target)
- `frontend-prod` - Frontend app (production target)

### Testing Profile
```bash
docker-compose --profile testing up
```

**Services included:**
- `mysql` - MySQL 8.0 database
- `backend-test` - Backend API (testing target)
- `frontend-test` - Frontend app (testing target)

### Bundle Analyzer Profile
```bash
docker-compose --profile analyzer up frontend-analyzer
```

**Services included:**
- `frontend-analyzer` - Bundle analysis tool

## 🚀 Quick Start

### Development Environment

1. **Start all development services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Access applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MySQL: localhost:3306

### Production Environment

1. **Start production services:**
   ```bash
   docker-compose --profile production up -d
   ```

2. **Access applications:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5001

### Testing Environment

1. **Run tests:**
   ```bash
   docker-compose --profile testing up --abort-on-container-exit
   ```

### Bundle Analysis

1. **Analyze frontend bundle:**
   ```bash
   docker-compose --profile analyzer up frontend-analyzer
   ```

2. **Access analyzer:**
   - Bundle Analyzer: http://localhost:8888

## 🛠 Available Commands

### Service Management

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start development environment |
| `docker-compose up -d` | Start in detached mode |
| `docker-compose down` | Stop and remove containers |
| `docker-compose restart <service>` | Restart specific service |
| `docker-compose logs <service>` | View service logs |
| `docker-compose exec <service> sh` | Access service shell |

### Profile-based Commands

| Command | Description |
|---------|-------------|
| `docker-compose --profile production up` | Production environment |
| `docker-compose --profile testing up` | Testing environment |
| `docker-compose --profile analyzer up frontend-analyzer` | Bundle analysis |

### Build Commands

| Command | Description |
|---------|-------------|
| `docker-compose build` | Build all services |
| `docker-compose build --no-cache` | Clean build |
| `docker-compose build <service>` | Build specific service |

### Data Management

| Command | Description |
|---------|-------------|
| `docker-compose down -v` | Remove containers and volumes |
| `docker volume ls` | List Docker volumes |
| `docker volume prune` | Remove unused volumes |

## 🌍 Environment Variables

### Required Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD_SECRET=your_root_password
MYSQL_DATABASE_NAME=cedo_partnership_db
MYSQL_USER_NAME=cedo_user
MYSQL_USER_PASSWORD=your_user_password

# API Secrets
API_SECRET_DEV=your_api_secret
JWT_SECRET_DEV=your_jwt_secret

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CLIENT_ID_BACKEND=your_backend_client_id

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# URLs
FRONTEND_URL=http://localhost:3000

# Build Metadata (Optional)
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse HEAD)
```

### Environment Files

- `.env` - Main environment file
- `.env.development` - Development overrides
- `.env.production` - Production overrides
- `.env.test` - Testing overrides

## 🔌 Port Configuration

### Development Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js development server |
| Frontend | 3001 | Development tools port |
| Backend | 5000 | Express.js API server |
| MySQL | 3306 | Database connection |

### Production Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3001 | Next.js production server |
| Backend | 5001 | Express.js production API |
| MySQL | 3306 | Database connection |

### Analyzer Ports

| Service | Port | Description |
|---------|------|-------------|
| Bundle Analyzer | 8888 | Webpack bundle analyzer |

## 📁 Volume Management

### Named Volumes

- `cedo_mysql_data` - MySQL database persistence
- `cedo_backend_node_modules` - Backend dependencies cache
- `cedo_frontend_node_modules` - Frontend dependencies cache

### Bind Mounts (Development)

- `./backend:/usr/src/app` - Backend source code
- `./frontend:/usr/src/app` - Frontend source code
- `./backend/logs:/usr/src/app/logs` - Backend logs
- `./backend/uploads:/usr/src/app/uploads` - File uploads

### Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect cedo_mysql_data

# Remove specific volume
docker volume rm cedo_mysql_data

# Remove all unused volumes
docker volume prune
```

## 🏥 Health Checks

All services include comprehensive health checks:

### MySQL Health Check
- **Test**: `mysqladmin ping`
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Retries**: 5
- **Start Period**: 30 seconds

### Backend Health Check
- **Test**: `nc -z localhost 5000`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

### Frontend Health Check
- **Test**: `curl -f http://localhost:3000`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 60 seconds

### Check Health Status

```bash
# View all container health
docker-compose ps

# Inspect specific service health
docker inspect --format='{{.State.Health.Status}}' cedo_backend_service

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' cedo_backend_service
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Conflicts

**Problem**: Port already in use
```bash
Error: bind: address already in use
```

**Solution**: Change ports in docker-compose.yml or stop conflicting services
```bash
# Check what's using the port
netstat -tulpn | grep :3000

# Kill process using port
kill -9 <PID>
```

#### 2. Permission Issues

**Problem**: Permission denied errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x backend/wait-for-it.sh
```

#### 3. Database Connection Issues

**Problem**: Backend can't connect to MySQL
```bash
# Check MySQL health
docker-compose logs mysql

# Verify database initialization
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD_SECRET} -e "SHOW DATABASES;"
```

#### 4. Build Failures

**Problem**: Docker build fails
```bash
# Clean build with no cache
docker-compose build --no-cache

# Prune Docker system
docker system prune -f

# Remove all volumes and rebuild
docker-compose down -v
docker-compose up --build
```

### Debugging Commands

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Access service shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check service resource usage
docker stats

# Inspect network
docker network inspect cedo-network
```

### Performance Optimization

#### 1. Resource Limits

Add resource limits to services:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

#### 2. Build Optimization

```bash
# Use build cache
docker-compose build --parallel

# Multi-platform builds
docker-compose build --platform linux/amd64,linux/arm64
```

#### 3. Volume Optimization

```bash
# Use volume caching for node_modules
# Already configured in docker-compose.yml
```

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     MySQL       │
│   (Next.js)     │◄───┤   (Express)     │◄───┤   (Database)    │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │  cedo-network   │
                        │   172.20.0.0/16 │
                        └─────────────────┘
```

## 🔒 Security Features

- **Non-root users**: All services run as non-root users
- **Network isolation**: Custom bridge network
- **Health monitoring**: Comprehensive health checks
- **Secret management**: Environment-based secret handling
- **Volume permissions**: Proper file ownership

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/#use-multi-stage-builds)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Note**: This Docker Compose configuration is optimized for the CEDO Google Auth application. Adjust environment variables and service configurations according to your deployment requirements. 