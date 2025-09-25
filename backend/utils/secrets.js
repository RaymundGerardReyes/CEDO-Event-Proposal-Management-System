// backend/utils/secrets.js
// Utility for reading Docker secrets from files
const fs = require('fs');
const path = require('path');

/**
 * Reads a secret from file or environment variable
 * Follows Docker secrets pattern: try _FILE variant first, then regular env var
 * @param {string} secretName - Name of the secret (e.g., 'postgresql_PASSWORD')
 * @returns {string|null} - Secret value or null if not found
 */
function readSecret(secretName) {
    // First try to read from file (Docker secrets pattern)
    const fileEnvVar = `${secretName}_FILE`;
    const filePath = process.env[fileEnvVar];

    if (filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const secret = fs.readFileSync(filePath, 'utf8').trim();
                console.log(`✅ Secret '${secretName}' loaded from file: ${filePath}`);
                return secret;
            } else {
                console.warn(`⚠️  Secret file not found: ${filePath}`);
            }
        } catch (error) {
            console.error(`❌ Error reading secret file ${filePath}:`, error.message);
        }
    }

    // Fallback to environment variable
    const envValue = process.env[secretName];
    if (envValue) {
        console.log(`📝 Secret '${secretName}' loaded from environment variable`);
        return envValue;
    }

    console.warn(`⚠️  Secret '${secretName}' not found in file or environment`);
    return null;
}

/**
 * Gets database configuration with secure secret reading
 * @returns {object} Database configuration object
 */
function getDatabaseConfig() {
    return {
        host: process.env.postgresql_HOST || process.env.POSTGRES_HOST,
        port: process.env.postgresql_PORT || process.env.POSTGRES_PORT,
        user: process.env.postgresql_USER ||  process.env.POSTGRES_USER,
        password: readSecret('postgresql_PASSWORD') || process.env.POSTGRES_PASSWORD,
        database: process.env.postgresql_DATABASE || process.env.POSTGRES_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };
}

/**
 * Gets JWT configuration with secure secret reading
 * @returns {object} JWT configuration object
 */
function getJWTConfig() {
    return {
        secret: readSecret('JWT_SECRET') || readSecret('JWT_SECRET_DEV') || 'default-jwt-secret',
        secretDev: readSecret('JWT_SECRET_DEV') || readSecret('JWT_SECRET') || 'default-jwt-secret',
    };
}

/**
 * Gets API configuration with secure secret reading
 * @returns {object} API configuration object
 */
function getAPIConfig() {
    return {
        secretDev: readSecret('API_SECRET_DEV') || 'default-api-secret',
        emailPassword: readSecret('EMAIL_PASSWORD') || '',
        recaptchaSecret: readSecret('RECAPTCHA_SECRET_KEY') || '',
        googleClientSecret: readSecret('GOOGLE_CLIENT_SECRET') || readSecret('GOOGLE_SECRET_ID_BACKEND') || '',
    };
}

module.exports = {
    readSecret,
    getDatabaseConfig,
    getJWTConfig,
    getAPIConfig
}; 