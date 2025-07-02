# -------------------------------------------------
# Frontend Service – Production-ready Dockerfile
# -------------------------------------------------
# 1️⃣ Dependencies stage
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies using npm ci for reproducible builds
COPY package*.json ./
# Attempt reproducible install; fall back to npm install if lock mismatch occurs
RUN if npm ci; then echo "✓ npm ci completed"; else echo "⚠️  npm ci failed – falling back to npm install" && npm install; fi

# 2️⃣ Builder stage – compile the Next.js app
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# Reuse node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source code
COPY . .

# Build the application for production
RUN npm run build && npm prune --omit=dev

# 3️⃣ Runtime stage – lightweight image to serve the built app
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime utilities for health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# Copy necessary production assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

# Expose the port Next.js will run on
EXPOSE 3000

# Start the application
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"] 