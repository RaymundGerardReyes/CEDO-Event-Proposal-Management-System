# frontend/Dockerfile
# Build context for this Dockerfile is the 'frontend' directory (e.g., project-root/frontend/)

# --- Dependencies Stage (deps) ---
# This stage installs Node.js dependencies.
FROM node:18-alpine AS deps
# Set the working directory in the container.
# This should match the target directory of the volume mount in docker-compose.yml
# and the working_dir specified there.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) from the context root.
# Since context is 'frontend/', this copies 'frontend/package.json' to '/usr/src/app/package.json'.
COPY package.json package-lock.json* ./
# Install dependencies using 'npm ci' for cleaner installs from lock file.
RUN npm ci

# --- Builder Stage (builder) ---
# This stage builds the application (e.g., for production).
# For a Next.js app, this involves 'npm run build'.
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy installed node_modules from the 'deps' stage.
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy all source files from the context root (frontend/) into the container's WORKDIR.
# This includes your 'public' folder, 'src' or 'pages'/'app', Next.js config files, etc.
COPY . .

# Run the build command (e.g., 'next build').
RUN npm run build

# --- Production Runner Stage (runner) ---
# This stage creates the final lightweight image for running the application in production.
# For development, docker-compose will use this image as a base,
# then mount local source code and override the CMD with 'npm run dev'.
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
# It's good practice to run applications as a non-root user.
# Create a non-root user 'node' (comes with official node images) or your own.
USER node

# Copy the built application artifacts from the 'builder' stage.
# --chown=node:node ensures the 'node' user owns these files.
COPY --from=builder --chown=node:node /usr/src/app/.next ./.next
# Copy production node_modules from the 'deps' stage.
# (If your build process prunes dependencies, you might copy from 'builder' instead).
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
# Copy package.json, as 'npm start' (or 'next start') might need it.
COPY --from=deps --chown=node:node /usr/src/app/package.json ./package.json

# For Next.js, the 'public' folder (e.g., frontend/public) contains static assets.
# The `COPY . .` in the 'builder' stage already copied it to /usr/src/app/public in the builder.
# `next build` processes these assets and places them typically into `.next/static` or makes them available.
# `next start` serves static assets from the `public` directory at the project root and from `.next/static`.
# So, we need the `public` folder in the runner stage at `/usr/src/app/public`.
COPY --from=builder --chown=node:node /usr/src/app/public ./public

EXPOSE 3000

# Default command to start the Next.js production server.
# This will be overridden by 'command: npm run dev' in docker-compose.yml for development.
CMD ["npm", "start"]
