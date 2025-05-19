// backend/utils/googleAuth.js
const { OAuth2Client } = require('google-auth-library');

// This MUST match the variable name used in your .env and docker-compose.yml for the backend service
const GOOGLE_CLIENT_ID_BACKEND = process.env.GOOGLE_CLIENT_ID_BACKEND;

if (!GOOGLE_CLIENT_ID_BACKEND) {
    console.error(
        "FATAL ERROR: GOOGLE_CLIENT_ID_BACKEND is not defined in environment variables. Google Sign-In will not function."
    );
}

// Initialize the client only if the ID is provided.
const client = GOOGLE_CLIENT_ID_BACKEND ? new OAuth2Client(GOOGLE_CLIENT_ID_BACKEND) : null;

/**
 * Verifies a Google ID token.
 * @param {string} idToken The Google ID token received from the frontend.
 * @returns {Promise<import('google-auth-library').LoginTicket['payload']>} The verified token payload.
 * @throws {Error} If verification fails or the client is not configured.
 */
async function verifyGoogleToken(idToken) {
    if (!client) {
        console.error(
            "Google OAuth2Client is not initialized. Ensure GOOGLE_CLIENT_ID_BACKEND is set."
        );
        throw new Error("Google authentication service is not configured on the server.");
    }

    if (!idToken) {
        throw new Error("No Google ID token provided for verification.");
    }

    console.log("Verifying Google ID token...");
    console.log("GOOGLE_CLIENT_ID_BACKEND is configured as:",
        GOOGLE_CLIENT_ID_BACKEND ? `${GOOGLE_CLIENT_ID_BACKEND.substring(0, 6)}...` : "undefined");

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID_BACKEND, // Verifies the 'aud' claim
        });
        const payload = ticket.getPayload();

        if (!payload) {
            console.error("Google token verification returned no payload.");
            throw new Error("Invalid Google token: No payload received after verification.");
        }
        if (!payload.email || !payload.sub) {
            console.error("Google token payload is missing essential fields (email, sub):", payload);
            throw new Error("Invalid Google token: Payload missing required user identifiers.");
        }

        console.log("Token successfully verified for:", payload.email);
        return payload;
    } catch (error) {
        console.error(
            "Backend Error: Google ID token verification failed:",
            error.message
        );

        // Check the error message to provide more specific error information
        if (error.message.includes("Token used too late") || error.message.includes("Token expired")) {
            throw new Error("Google token is expired. Please try signing in again.");
        }
        if (error.message.includes("Invalid value for aud") || error.message.includes("Wrong recipient")) {
            console.error(`Audience mismatch error. Frontend might be using a different Client ID than backend expects.`);
            throw new Error("Google token has an invalid audience. Configuration issue likely.");
        }

        // Rethrow the error with a more user-friendly message
        throw new Error("Google token verification failed. The token may be invalid or malformed.");
    }
}

module.exports = { verifyGoogleToken };