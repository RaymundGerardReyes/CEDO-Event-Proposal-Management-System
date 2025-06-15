# ========================================
# CEDO Partnership Management Backend
# Multi-stage Docker build for production optimization
# ========================================

# =====================================
# Stage 1: Base dependencies
# =====================================
FROM node:18-alpine AS base

# Set NODE_ENV for dependency optimization
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Create app directory and app user for security
WORKDIR /usr/src/app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Install system dependencies required for some npm packages
RUN apk add --no-cache \
    netcat-openbsd \
    dumb-init \
    && rm -rf /var/cache/apk/*

# =====================================
# Stage 2: Development dependencies
# =====================================
FROM base AS deps

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# =====================================
# Stage 3: Development build
# =====================================
FROM base AS dev-deps

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci && \
    npm cache clean --force

# =====================================
# Stage 4: Source code builder
# =====================================
FROM dev-deps AS builder

# Copy source code
COPY . .

# Copy and prepare wait-for-it script
COPY wait-for-it.sh ./
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Run any build steps if needed (e.g., TypeScript compilation)
# RUN npm run build

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs

# =====================================
# Stage 5: Production image
# =====================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production \
    PORT=5000 \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=512"

# Copy production dependencies
COPY --from=deps --chown=nodeuser:nodejs /usr/src/app/node_modules ./node_modules

# Copy source code and built assets
COPY --from=builder --chown=nodeuser:nodejs /usr/src/app .

# Create uploads and logs directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs /usr/src/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD nc -z localhost $PORT || exit 1

# Expose the port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command for production
CMD ["sh", "./wait-for-it.sh", "mysql:3306", "--timeout=60", "--strict", "--", "npm", "start"]

# =====================================
# Stage 6: Development image
# =====================================
FROM dev-deps AS development

# Set development environment
ENV NODE_ENV=development \
    PORT=5000

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Copy and prepare wait-for-it script
RUN sed -i 's/\r$//' wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD nc -z localhost $PORT || exit 1

# Expose the port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Development command with nodemon
CMD ["sh", "./wait-for-it.sh", "mysql:3306", "--timeout=60", "--strict", "--", "npm", "run", "dev"]

# =====================================
# Stage 7: Testing image
# =====================================
FROM development AS testing

# Switch back to root to install test dependencies
USER root

# Install testing tools if needed
RUN apk add --no-cache curl

# Switch back to app user
USER nodeuser

# Override command for testing
CMD ["npm", "test"]

# =====================================
# Build Arguments and Labels
# =====================================
# Build arguments for flexible builds
ARG BUILD_VERSION="0.4.0"
ARG BUILD_DATE
ARG GIT_COMMIT

# Labels for metadata
LABEL maintainer="CEDO Development Team" \
      version="${BUILD_VERSION}" \
      description="CEDO Partnership Management Backend API" \
      build-date="${BUILD_DATE}" \
      git-commit="${GIT_COMMIT}" \
      org.opencontainers.image.title="CEDO Backend" \
      org.opencontainers.image.description="Backend API for CEDO Partnership Management System" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.licenses="MIT"
