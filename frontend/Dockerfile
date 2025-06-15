# =========================================
# CEDO Google Auth Frontend - Next.js 15.3.2
# Multi-stage production-ready Dockerfile
# =========================================

# --- Base Image Configuration ---
FROM node:18-alpine AS base

# Metadata
LABEL maintainer="CEDO Development Team"
LABEL description="CEDO Google Auth Frontend - Next.js Application"
LABEL version="0.3.0"

# Install system dependencies for Alpine
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /usr/src/app

# Configure Node.js environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs \
    && adduser --system --uid 1001 nextjs

# --- Production Dependencies Stage ---
FROM base AS deps-prod
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies with optimizations
RUN npm ci --only=production \
    --ignore-scripts \
    --no-audit \
    --no-fund \
    --prefer-offline \
    && npm cache clean --force

# --- Development Dependencies Stage ---
FROM base AS deps-dev
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies for development/building
RUN npm ci \
    --ignore-scripts \
    --no-audit \
    --no-fund \
    && npm cache clean --force

# --- Source Preparation Stage ---
FROM deps-dev AS source
WORKDIR /usr/src/app

# Copy source code (excluding files in .dockerignore)
COPY . .

# Ensure proper ownership
RUN chown -R nextjs:nextjs /usr/src/app

# --- Builder Stage ---
FROM source AS builder
WORKDIR /usr/src/app

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV ANALYZE=false

# Run as non-root user for security
USER nextjs

# Build the Next.js application
RUN npm run build \
    && npm prune --production

# --- Production Runner Stage ---
FROM base AS production
WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

# Copy production dependencies
COPY --from=deps-prod --chown=nextjs:nextjs /usr/src/app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/.next/static ./.next/static

# Copy public assets if they exist
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/public ./public

# Copy package.json for metadata
COPY --from=builder --chown=nextjs:nextjs /usr/src/app/package.json ./package.json

# Create health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js server
CMD ["node", "server.js"]

# --- Development Stage ---
FROM deps-dev AS development
WORKDIR /usr/src/app

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBOPACK=1

# Copy source code
COPY --chown=nextjs:nextjs . .

# Install additional development tools
RUN npm install -g nodemon concurrently

# Switch to non-root user
USER nextjs

# Expose development port
EXPOSE 3000
EXPOSE 3001

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server with Turbopack
CMD ["npm", "run", "dev"]

# --- Testing Stage ---
FROM development AS testing
WORKDIR /usr/src/app

# Install testing dependencies
USER root
RUN npm install -g jest-cli @testing-library/cli

# Switch back to non-root user
USER nextjs

# Run tests
CMD ["npm", "test"]

# --- Bundle Analysis Stage ---
FROM builder AS analyzer
WORKDIR /usr/src/app

# Set analysis environment
ENV ANALYZE=true
ENV NODE_ENV=production

# Run bundle analysis
RUN npm run build:analyze

# Expose analyzer port
EXPOSE 8888

# Start bundle analyzer
CMD ["npx", "@next/bundle-analyzer"]

# --- Security Scanning Stage ---
FROM deps-dev AS security
WORKDIR /usr/src/app

# Install security scanning tools
RUN npm install -g npm-audit-resolver audit-ci

# Copy source for security scanning
COPY --chown=nextjs:nextjs . .

# Switch to non-root user
USER nextjs

# Run security audit
CMD ["npm", "audit"]

# ===========================================
# Build Instructions:
# ===========================================
# Production:      docker build --target production -t cedo-frontend:prod .
# Development:     docker build --target development -t cedo-frontend:dev .
# Testing:         docker build --target testing -t cedo-frontend:test .
# Bundle Analysis: docker build --target analyzer -t cedo-frontend:analyze .
# Security Scan:   docker build --target security -t cedo-frontend:security .
# ===========================================
# Estimated sizes:
# - Production: ~120MB (optimized Next.js standalone)
# - Development: ~180MB (includes dev tools)
# - Testing: ~200MB (includes test frameworks)
# ===========================================