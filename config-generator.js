// config-generator.js
const crypto = require("crypto");

function generateSecret(length) {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
}

const config = {
    JWT_SECRET: generateSecret(32),
    JWT_SECRET_DEV: generateSecret(32),
    JWT_SECRET_PROD: generateSecret(64),
    COOKIE_SECRET: generateSecret(32),
    FRONTEND_URL: "http://localhost:3000",
    FRONTEND_URL_PROD: "https://your_production_domain.com",
    GOOGLE_CLIENT_ID_BACKEND: "your_google_client_id_for_backend.apps.googleusercontent.com"
};

console.log(`# Secret key for signing session cookies.
COOKIE_SECRET=${config.COOKIE_SECRET}

# JWT secrets
JWT_SECRET=${config.JWT_SECRET}
JWT_SECRET_DEV=${config.JWT_SECRET_DEV}
JWT_SECRET_PROD=${config.JWT_SECRET_PROD}

# Full URL of the frontend application (for CORS, redirects, etc.)
FRONTEND_URL=${config.FRONTEND_URL}
FRONTEND_URL_PROD=${config.FRONTEND_URL_PROD}

# Google OAuth 2.0 Client ID for the backend.
GOOGLE_CLIENT_ID_BACKEND=${config.GOOGLE_CLIENT_ID_BACKEND}`);
