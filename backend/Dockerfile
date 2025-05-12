# backend/Dockerfile
# Build context for this Dockerfile is the 'backend' directory (e.g., project-root/backend/)

# --- Dependencies Stage (deps) ---
FROM node:18-alpine AS deps
# Set the working directory in the container.
# Matches the volume mount target and working_dir in docker-compose.yml.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) from the context root.
# Since context is 'backend/', this copies 'backend/package.json' to '/usr/src/app/package.json'.
COPY package.json package-lock.json* ./
# Install dependencies.
RUN npm ci

# --- Builder Stage (builder) ---
# This stage is for any build steps your backend might have (e.g., TypeScript compilation).
# If your backend is plain JavaScript and doesn't need a build step, this stage can be simpler or merged.
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy all source files from the context root (backend/) into the container's WORKDIR.
COPY . .

# If you have a build step (e.g., for TypeScript to JavaScript):
# RUN npm run build
# Ensure your tsconfig.json outputs to a 'dist' folder or similar within /usr/src/app.

# --- Production Runner Stage (runner) ---
# This stage creates the final image for running the backend.
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
USER node

# If you have a build step that outputs to a 'dist' folder:
# COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
# COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules # Or only production deps
# COPY --from=deps --chown=node:node /usr/src/app/package.json ./package.json
# CMD ["node", "dist/server.js"] # Or whatever your entry point is

# If no build step (plain JavaScript) or build output is in the main directory:
COPY --from=builder --chown=node:node /usr/src/app ./
# Note: This copies everything from builder's /usr/src/app, including source if no separate build output.
# For a cleaner production image with no build step, you might copy selectively:
# COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
# COPY --from=deps --chown=node:node /usr/src/app/package.json ./package.json
# COPY --from=builder --chown=node:node /usr/src/app/src ./src # Or your main source/entrypoint files
# COPY --from=builder --chown=node:node /usr/src/app/server.js ./server.js # Example entrypoint

EXPOSE 4000

# Default command to start the backend server in production.
# Adjust 'server.js' to your backend's main entry file.
# This will be overridden by 'command: npm run dev' in docker-compose.yml for development.
CMD ["node", "src/index.js"] # Example: assumes your entry point is src/index.js
# If you had a build step: CMD ["node", "dist/index.js"]
