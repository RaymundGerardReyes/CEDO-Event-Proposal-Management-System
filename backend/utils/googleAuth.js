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
 * Verifies a Google ID token with enhanced clock skew handling.
 * @param {string} token The Google ID token received from the frontend.
 * @returns {Promise<import('google-auth-library').LoginTicket['payload']>} The verified token payload.
 * @throws {Error} If verification fails or the client is not configured.
 */
async function verifyGoogleToken(token) {
    console.log('Verifying token:', token.substring(0, 10) + '...');

    if (!client) {
        throw new Error('Google OAuth client not configured');
    }

    // Decode token to analyze timing
    let decodedToken;
    try {
        decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (error) {
        throw new Error('Invalid token format');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - decodedToken.iat;
    const clockSkew = Math.abs(timeDiff);

    console.log('Token timing analysis:', {
        currentTime,
        tokenIssued: decodedToken.iat,
        tokenNotBefore: decodedToken.nbf,
        tokenExpires: decodedToken.exp,
        timeDiff: `${timeDiff} seconds`,
        clockSkew: `${clockSkew} seconds (${Math.round(clockSkew / 3600)} hours)`,
        isEarly: currentTime < decodedToken.nbf,
        isLate: currentTime > decodedToken.exp
    });

    // Check for extreme clock skew (more than 1 hour)
    if (clockSkew > 3600) {
        console.warn(`⚠️  Extreme clock skew detected: ${Math.round(clockSkew / 3600)} hours`);

        // In development, use bypass mode for extreme clock skew
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 DEVELOPMENT MODE: Using bypass for extreme clock skew');
            return {
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture,
                sub: decodedToken.sub,
                email_verified: decodedToken.email_verified,
                iat: decodedToken.iat,
                exp: decodedToken.exp
            };
        }

        throw new Error(`Extreme clock skew detected: Server is ${Math.round(clockSkew / 3600)} hours ${timeDiff > 0 ? 'ahead' : 'behind'} Google servers. Please synchronize your server clock.`);
    }

    // Development mode bypass for testing
    if (process.env.NODE_ENV === 'development' && process.env.GOOGLE_AUTH_BYPASS === 'true') {
        console.log('⚠️  DEVELOPMENT MODE: Bypassing Google token verification');
        return {
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            sub: decodedToken.sub,
            email_verified: decodedToken.email_verified,
            iat: decodedToken.iat,
            exp: decodedToken.exp
        };
    }

    // For moderate clock skew, try with retries
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Token verification attempt ${attempt}/${maxRetries}`);

            // If token is too early and this is not the last attempt, wait and retry
            if (currentTime < decodedToken.nbf && attempt < maxRetries) {
                const waitTime = Math.min(decodedToken.nbf - currentTime, 30); // Cap at 30 seconds
                console.log(`Token is too early. Waiting ${waitTime} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            console.log('Token verification successful:', {
                email: payload.email,
                name: payload.name,
                expires: new Date(payload.exp * 1000),
                issued: new Date(payload.iat * 1000),
                notBefore: new Date(payload.nbf * 1000),
                currentTime: new Date(),
                timeDiff: Math.floor((Date.now() / 1000) - payload.iat)
            });

            return payload;
        } catch (error) {
            lastError = error;
            console.error(`Token verification attempt ${attempt} failed:`, error.message);

            // If it's a timing issue and we have more attempts, continue
            if (error.message.includes('Token used too early') && attempt < maxRetries) {
                console.log(`Timing issue detected, will retry...`);
                continue;
            }

            // For other errors or last attempt, break and throw
            break;
        }
    }

    // If we get here, all attempts failed
    console.error('All token verification attempts failed. Last error:', lastError.message);

    // Provide specific error messages based on the error type
    if (lastError.message.includes('Token used too early')) {
        throw new Error('Token timing issue: Server clock may be ahead of Google servers. Please try again.');
    } else if (lastError.message.includes('Token used too late')) {
        throw new Error('Token has expired. Please sign in again.');
    } else if (lastError.message.includes('Invalid audience')) {
        throw new Error('Invalid Google client configuration.');
    } else if (lastError.message.includes('Invalid issuer')) {
        throw new Error('Invalid token issuer.');
    } else {
        throw new Error(`Google token verification failed: ${lastError.message}`);
    }
}

module.exports = { verifyGoogleToken };