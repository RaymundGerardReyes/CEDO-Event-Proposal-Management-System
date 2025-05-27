FROM node:18-alpine
WORKDIR /usr/src/app

# Copy the script and force Unix line endings
COPY wait-for-it.sh .
RUN apk add --no-cache netcat-openbsd \
    && sed -i 's/\r$//' wait-for-it.sh \
    && chmod +x wait-for-it.sh


# Application code
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["sh", "./wait-for-it.sh", "mysql:3306", "--", "npm", "run", "dev"]
