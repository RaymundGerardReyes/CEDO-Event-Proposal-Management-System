# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Builder Stage (builder) ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy installed node_modules from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy all source files
COPY . .

# Run the build command
RUN npm run build

# --- Production Runner Stage (runner) ---
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
USER node

# Copy the built application artifacts from the 'builder' stage
COPY --from=builder --chown=node:node /usr/src/app/.next ./.next
# Copy production node_modules
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
# Copy package.json
COPY --from=deps --chown=node:node /usr/src/app/package.json ./package.json

# Copy the public directory from the correct location
COPY --from=builder --chown=node:node /usr/src/app/src/public ./public

# Optionally copy .env.production if you use it
# COPY --from=builder --chown=node:node /usr/src/app/.env.production ./.env.production

EXPOSE 3000

# Default command to start the Next.js production server
CMD ["npm", "start"]