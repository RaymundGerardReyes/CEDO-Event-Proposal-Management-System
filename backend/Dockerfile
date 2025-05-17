<<<<<<< HEAD
# --- Base Stage ---
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install netcat for wait-for-it.sh
RUN apk add --no-cache netcat-openbsd

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Make wait-for-it.sh executable
RUN chmod +x wait-for-it.sh

# Expose the port the app runs on
EXPOSE 5000

# The command will be provided by docker-compose
CMD ["npm", "run", "dev"]
=======
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
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
