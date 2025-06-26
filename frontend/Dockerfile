# ========================================
# CEDO Partnership Management Frontend
# Multi-stage Dockerfile for Next.js 15.3.2 Application
# ========================================

# ========================================
# Base Stage - Common setup for all stages
# ========================================
FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    dumb-init \
    tzdata && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /usr/src/app

# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Set timezone
ENV TZ=UTC

# ========================================
# Dependencies Stage - Install packages
# ========================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# ========================================
# Development Dependencies Stage
# ========================================
FROM base AS deps-dev

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# ========================================
# Development Stage
# ========================================
FROM deps-dev AS development

# Copy application source
COPY --chown=nextjs:nextjs . .

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Development command
CMD ["dumb-init", "npm", "run", "dev:normal"]

# ========================================
# Build Stage - Create production build
# ========================================
FROM deps-dev AS builder

# Copy application source
COPY --chown=nextjs:nextjs . .

# Set build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true

# Build the application
RUN npm run build

# ========================================
# Production Stage
# ========================================
FROM base AS production

# Copy production dependencies
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/public ./public

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Production command
CMD ["dumb-init", "node", "server.js"]

# ========================================
# Testing Stage
# ========================================
FROM deps-dev AS testing

# Copy application source
COPY --chown=nextjs:nextjs . .

# Create test directories
RUN mkdir -p coverage test-results && \
    chown -R nextjs:nextjs coverage test-results

# Set test environment
ENV NODE_ENV=test
ENV CI=true

# Switch to non-root user
USER nextjs

# Test command
CMD ["dumb-init", "npm", "test"]

# ========================================
# Bundle Analyzer Stage
# ========================================
FROM deps-dev AS analyzer

# Copy application source
COPY --chown=nextjs:nextjs . .

# Set analyzer environment
ENV ANALYZE=true
ENV NODE_ENV=production

# Switch to non-root user
USER nextjs

# Expose analyzer port
EXPOSE 8888

# Analyzer command
CMD ["dumb-init", "npm", "run", "build:analyze"]

# ========================================
# Linting Stage
# ========================================
FROM deps-dev AS linter

# Copy application source
COPY --chown=nextjs:nextjs . .

# Switch to non-root user
USER nextjs

# Linting command
CMD ["dumb-init", "npm", "run", "lint"]

# ========================================
# Development with Turbopack Stage
# ========================================
FROM deps-dev AS development-turbo

# Copy application source
COPY --chown=nextjs:nextjs . .

# Set environment variables for Turbopack development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBOPACK=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Turbopack development command
CMD ["dumb-init", "npm", "run", "dev:turbo"]

# ========================================
# Static Export Stage
# ========================================
FROM deps-dev AS static-export

# Copy application source
COPY --chown=nextjs:nextjs . .

# Modify next.config.js for static export
RUN echo "module.exports = { ...require('./next.config.js'), output: 'export', trailingSlash: true, images: { unoptimized: true } }" > next.config.export.js

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build and export static files
RUN npm run build && \
    npx next export

# Switch to non-root user
USER nextjs

# Static files are in ./out directory
CMD ["echo", "Static files built in ./out directory"]

# ========================================
# Nginx Static Serving Stage
# ========================================
FROM nginx:alpine AS nginx-static

# Copy static files from export stage
COPY --from=static-export /usr/src/app/out /usr/share/nginx/html

# Copy custom nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost || exit 1

# Nginx command
CMD ["nginx", "-g", "daemon off;"]

# ========================================
# Build Arguments and Labels
# ========================================
ARG BUILD_DATE
ARG BUILD_VERSION
ARG GIT_COMMIT
ARG NEXT_VERSION=15.3.2

LABEL maintainer="CEDO Development Team" \
      version="${BUILD_VERSION}" \
      description="CEDO Partnership Management Frontend" \
      build-date="${BUILD_DATE}" \
      git-commit="${GIT_COMMIT}" \
      nodejs-version="18" \
      nextjs-version="${NEXT_VERSION}" \
      application="cedo-frontend" 