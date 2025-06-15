# 🐳 CEDO Frontend Docker Configuration

This document describes the Docker setup for the CEDO Google Auth Frontend application built with Next.js 15.3.2.

## 📋 Table of Contents

- [Overview](#overview)
- [Build Targets](#build-targets)
- [Quick Start](#quick-start)
- [Build Commands](#build-commands)
- [Environment Variables](#environment-variables)
- [Volume Mounts](#volume-mounts)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Dockerfile uses a multi-stage build approach optimized for:
- **Production**: Minimal size (~120MB) with Next.js standalone output
- **Development**: Hot-reload with Turbopack for fast development
- **Testing**: Includes Jest and testing frameworks
- **Bundle Analysis**: Webpack bundle analyzer for optimization
- **Security**: Vulnerability scanning and audit tools

## 🎯 Build Targets

### 1. Production (`production`)
Optimized for production deployment with minimal size.

```bash
docker build --target production -t cedo-frontend:prod .
docker run -p 3000:3000 cedo-frontend:prod
```

**Features:**
- Next.js standalone output (~120MB)
- Non-root user security
- Health checks
- Signal handling with dumb-init

### 2. Development (`development`)
Full development environment with hot-reload.

```bash
docker build --target development -t cedo-frontend:dev .
docker run -p 3000:3000 -v $(pwd):/usr/src/app cedo-frontend:dev
```

**Features:**
- Turbopack enabled for fast refresh
- Volume mounts for live editing
- Development tools included
- Hot module replacement

### 3. Testing (`testing`)
Testing environment with Jest and testing libraries.

```bash
docker build --target testing -t cedo-frontend:test .
docker run cedo-frontend:test
```

**Features:**
- Jest testing framework
- Testing Library utilities
- Coverage reporting
- CI/CD ready

### 4. Bundle Analyzer (`analyzer`)
Webpack bundle analysis for optimization.

```bash
docker build --target analyzer -t cedo-frontend:analyze .
docker run -p 8888:8888 cedo-frontend:analyze
```

**Features:**
- Bundle size analysis
- Dependency visualization
- Performance insights
- Optimization recommendations

### 5. Security Scanner (`security`)
Security vulnerability scanning.

```bash
docker build --target security -t cedo-frontend:security .
docker run cedo-frontend:security
```

**Features:**
- npm audit integration
- Vulnerability scanning
- Security reporting
- Compliance checking

## 🚀 Quick Start

### Using the Build Script

Make the build script executable:
```bash
chmod +x docker-build.sh
```

Build for production:
```bash
./docker-build.sh --target production
```

Build for development:
```bash
./docker-build.sh --target development
```

### Manual Docker Commands

Production build:
```bash
docker build --target production -t cedo-frontend:latest .
docker run -p 3000:3000 cedo-frontend:latest
```

Development build:
```bash
docker build --target development -t cedo-frontend:dev .
docker run -p 3000:3000 -v $(pwd)/src:/usr/src/app/src cedo-frontend:dev
```

## 🛠 Build Commands

### Available Scripts

| Script | Description |
|--------|-------------|
| `./docker-build.sh --help` | Show help and options |
| `./docker-build.sh --target production` | Build production image |
| `./docker-build.sh --target development` | Build development image |
| `./docker-build.sh --target testing --clean` | Clean build testing image |
| `./docker-build.sh --push` | Build and push to registry |

### Build Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `TURBOPACK` | `1` (dev only) | Enable Turbopack |
| `ANALYZE` | `false` | Enable bundle analysis |

## 🌍 Environment Variables

### Required Variables

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Optional Variables

```env
# Next.js Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

# Development
TURBOPACK=1
DEBUG=next:*
NEXT_TURBOPACK_TRACING=1
```

### Environment Files

- `.env.local` - Local development overrides
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.test` - Testing environment

## 📁 Volume Mounts

### Development Mode

Mount source code for live editing:
```bash
docker run -p 3000:3000 \
  -v $(pwd)/src:/usr/src/app/src \
  -v $(pwd)/public:/usr/src/app/public \
  cedo-frontend:dev
```

### Production Mode

Mount environment file:
```bash
docker run -p 3000:3000 \
  -v $(pwd)/.env.production:/usr/src/app/.env.production \
  cedo-frontend:prod
```

## 🏥 Health Checks

All targets include health checks:

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Start Period**: 5-10 seconds
- **Retries**: 3 attempts

Check health status:
```bash
docker ps
docker inspect --format='{{.State.Health.Status}}' <container_id>
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures

**Issue**: npm install fails
```bash
# Clear Docker cache
docker builder prune -f
./docker-build.sh --target production --clean
```

**Issue**: Permission denied
```bash
# Fix file permissions
chmod +x docker-build.sh
sudo chown -R $USER:$USER .
```

#### 2. Runtime Issues

**Issue**: Port already in use
```bash
# Use different port
docker run -p 3001:3000 cedo-frontend:prod
```

**Issue**: Environment variables not loaded
```bash
# Check environment
docker run --rm cedo-frontend:prod env
```

#### 3. Development Issues

**Issue**: Hot reload not working
```bash
# Ensure volume mounts are correct
docker run -p 3000:3000 \
  -v $(pwd):/usr/src/app \
  -v /usr/src/app/node_modules \
  cedo-frontend:dev
```

### Debugging

Enable debug mode:
```bash
docker run -e DEBUG=next:* cedo-frontend:dev
```

Check container logs:
```bash
docker logs <container_id>
```

Access container shell:
```bash
docker exec -it <container_id> sh
```

### Performance Optimization

#### Image Size Optimization

1. Use production target for deployment
2. Multi-stage builds reduce final image size
3. .dockerignore excludes unnecessary files

#### Build Speed Optimization

1. Use BuildKit for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. Cache Docker layers:
   ```bash
   docker build --cache-from cedo-frontend:latest .
   ```

3. Use build script for optimized builds:
   ```bash
   ./docker-build.sh --target production
   ```

## 📊 Image Sizes

| Target | Approximate Size | Use Case |
|--------|------------------|----------|
| `production` | ~120MB | Production deployment |
| `development` | ~180MB | Local development |
| `testing` | ~200MB | CI/CD pipelines |
| `analyzer` | ~150MB | Bundle analysis |
| `security` | ~160MB | Security scanning |

## 🔒 Security Features

- Non-root user (`nextjs:nextjs`)
- Minimal attack surface
- Security scanning capabilities
- Signal handling with dumb-init
- Health checks for monitoring
- Read-only filesystem (production)

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/#use-multi-stage-builds)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

**Note**: This Docker configuration is optimized for the CEDO Google Auth Frontend application. Adjust environment variables and build targets according to your deployment requirements. 