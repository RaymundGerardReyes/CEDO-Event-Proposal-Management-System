// backend/utils/googleAuth.js

// FIXED: Ensure dotenv is loaded before accessing environment variables
require('dotenv').config();

const { OAuth2Client } = require('google-auth-library');

// This MUST match the variable name used in your .env and docker-compose.yml for the backend service
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    console.error(
        "FATAL ERROR: GOOGLE_CLIENT_ID is not defined in environment variables. Google Sign-In will not function."
    );
}

// Initialize the client only if the ID is provided.
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Verifies a Google ID token.
 * @param {string} token The Google ID token received from the frontend.
 * @returns {Promise<import('google-auth-library').LoginTicket['payload']>} The verified token payload.
 * @throws {Error} If verification fails or the client is not configured.
 */
async function verifyGoogleToken(token) {
    console.log('Verifying token:', token.substring(0, 10) + '...');

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        console.log('Token payload:', {
            email: payload.email,
            name: payload.name,
            expires: new Date(payload.exp * 1000)
        });

        return payload;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        throw new Error('Invalid Google token');
    }
}

module.exports = { verifyGoogleToken };