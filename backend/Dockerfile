# ========================================
# CEDO Partnership Management Backend
# Multi-stage Dockerfile for Node.js Express API
# ========================================

# ========================================
# Base Stage - Common setup for all stages
# ========================================
FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    curl \
    bash \
    tzdata && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /usr/src/app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Set timezone (optional)
ENV TZ=UTC

# ========================================
# Dependencies Stage - Install packages
# ========================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production && \
    npm cache clean --force

# ========================================
# Development Dependencies Stage
# ========================================
FROM base AS dev-deps

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci && \
    npm cache clean --force

# ========================================
# Development Stage
# ========================================
FROM dev-deps AS development

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Make wait-for-it.sh executable and fix line endings
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Create necessary directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs

# Set environment variables
ENV NODE_ENV=development
ENV PORT=5000

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Default command for development
CMD ["dumb-init", "npm", "run", "dev"]

# ========================================
# Production Build Stage
# ========================================
FROM base AS build

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Remove development files and clean up
RUN rm -rf \
    tests/ \
    *.test.js \
    *.spec.js \
    debug-auth-flow.cjs \
    test-google-config.js \
    setup-google-auth.bat \
    fix-*.bat \
    start-mysql.bat \
    docker-build.sh \
    .gitignore \
    .dockerignore \
    README.md

# Make wait-for-it.sh executable
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# ========================================
# Production Stage
# ========================================
FROM base AS production

# Copy production dependencies
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodeuser:nodejs /usr/src/app .

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Production command
CMD ["dumb-init", "node", "server.js"]

# ========================================
# Testing Stage
# ========================================
FROM dev-deps AS testing

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Make scripts executable
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Create test directories
RUN mkdir -p uploads logs test-results && \
    chown -R nodeuser:nodejs uploads logs test-results

# Set test environment
ENV NODE_ENV=test
ENV PORT=5000

# Switch to non-root user
USER nodeuser

# Test command
CMD ["dumb-init", "npm", "test"]

# ========================================
# Database Initialization Stage
# ========================================
FROM dev-deps AS db-init

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Make scripts executable
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Create necessary directories
RUN mkdir -p logs && \
    chown -R nodeuser:nodejs logs

# Set environment
ENV NODE_ENV=development

# Switch to non-root user
USER nodeuser

# Database initialization command
CMD ["dumb-init", "npm", "run", "init-db"]

# ========================================
# Build Arguments and Labels
# ========================================
ARG BUILD_DATE
ARG BUILD_VERSION
ARG GIT_COMMIT

LABEL maintainer="CEDO Development Team" \
      version="${BUILD_VERSION}" \
      description="CEDO Partnership Management Backend API" \
      build-date="${BUILD_DATE}" \
      git-commit="${GIT_COMMIT}" \
      nodejs-version="18" \
      application="cedo-backend" 