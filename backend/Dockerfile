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