## -------------------------------------------------
## Backend Service – Production-ready Dockerfile
## -------------------------------------------------

# 1️⃣ Base with OS deps
FROM node:18-alpine AS base
WORKDIR /app

# Install OS deps used by some packages (mysql2, sharp if added later, etc.)
RUN apk add --no-cache bash curl python3 make g++

# 2️⃣ Dependencies layer
FROM base AS deps
COPY package*.json ./
RUN if npm ci; then echo "✓ npm ci completed"; else echo "⚠️  npm ci failed – falling back to npm install" && npm install; fi

# 3️⃣ Production pruned deps
FROM deps AS prod-deps
ENV NODE_ENV=production
RUN npm prune --omit=dev

# 4️⃣ Runtime image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=5000

# Copy app source and production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .

# Expose service port
EXPOSE 5000

# Healthcheck (simple HTTP GET)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start server
CMD ["node", "server.js"]


