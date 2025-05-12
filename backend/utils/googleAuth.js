// backend/utils/googleAuth.js
const { OAuth2Client } = require('google-auth-library');

// IMPORTANT: You MUST set this environment variable in your backend's .env file.
// This should be the Google Cloud OAuth 2.0 Client ID for your WEB APPLICATION.
// It's used to verify that the token was intended for your application (audience check).
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID_BACKEND;

if (!GOOGLE_CLIENT_ID) {
    console.error(
        "FATAL ERROR: GOOGLE_CLIENT_ID_BACKEND is not defined in the backend's environment variables. Google Sign-In will not work."
    );
    // In a production app, you might throw an error here to prevent the server from starting misconfigured.
}

// Initialize the client only if the ID is provided.
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

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
        // This error message will be caught by the route handler
        throw new Error("Google authentication service is not configured on the server.");
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID, // Verifies the 'aud' claim
        });
        const payload = ticket.getPayload();

        if (!payload) {
            console.error("Google token verification returned no payload.");
            throw new Error("Invalid Google token: No payload.");
        }
        if (!payload.email || !payload.sub) {
            console.error("Google token payload is missing essential fields (email, sub):", payload);
            throw new Error("Invalid Google token: Payload missing required fields.");
        }

        // console.log("Google Token Payload Verified:", payload); // For debugging
        return payload;

    } catch (error) {
        console.error(
            "Backend Error: Google ID token verification actually failed with:",
            error.message // Log the specific message from google-auth-library
        );
        // Provide more user-friendly messages based on common errors
        if (error.message.includes("Token used too late") || error.message.includes("Token expired")) {
            throw new Error("Google token is expired. Please try signing in again.");
        }
        if (error.message.includes("Invalid value for aud") || error.message.includes("Wrong recipient")) {
            // This often means GOOGLE_CLIENT_ID_BACKEND is not matching the audience in the token.
            // The token's 'aud' claim should match this GOOGLE_CLIENT_ID_BACKEND.
            // The token's 'azp' claim will be the client ID of your *frontend* application.
            console.error(`Audience mismatch: Token's audience might not include backend's GOOGLE_CLIENT_ID (${GOOGLE_CLIENT_ID}). Full error: ${error.message}`);
            throw new Error("Google token has an invalid audience. This may be a configuration issue.");
        }
        // Fallback for other verification errors
        throw new Error("Google token verification failed. The token may be invalid or malformed.");
    }
}

module.exports = { verifyGoogleToken };