# --- Dependencies Stage (deps) ---
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Builder Stage (builder) ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# --- Production Runner Stage (runner) ---
FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node

# Copy necessary files from the builder stage
COPY --from=builder --chown=node:node /usr/src/app/server.js ./server.js
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json

# Copy all directories that exist in your backend project
COPY --from=builder --chown=node:node /usr/src/app/config ./config
COPY --from=builder --chown=node:node /usr/src/app/middleware ./middleware
COPY --from=builder --chown=node:node /usr/src/app/models ./models
COPY --from=builder --chown=node:node /usr/src/app/routes ./routes
COPY --from=builder --chown=node:node /usr/src/app/scripts ./scripts
COPY --from=builder --chown=node:node /usr/src/app/utils ./utils

EXPOSE 5000

CMD ["node", "server.js"]