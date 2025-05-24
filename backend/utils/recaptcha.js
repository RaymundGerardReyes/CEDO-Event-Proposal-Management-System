// backend/utils/recaptcha.js
const axios = require('axios');

// This MUST match the variable name used in your .env and docker-compose.yml for the backend service
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

if (!RECAPTCHA_SECRET_KEY) {
    console.error(
        "FATAL ERROR: RECAPTCHA_SECRET_KEY is not defined. ReCAPTCHA verification will not work."
    );
}

async function verifyRecaptchaToken(token, remoteIp = null) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Ensure this is set correctly
    if (!secretKey) {
        console.error("ReCAPTCHA secret key is not configured on the server.");
        return false;
    }
    if (!token) {
        console.warn("No reCAPTCHA token provided.");
        return false;
    }
    try {
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: token,
                remoteip: remoteIp,
            },
        });
        return response.data.success; // Check if the token is valid
    } catch (error) {
        console.error("Error verifying reCAPTCHA token:", error.message);
        return false;
    }
}

module.exports = { verifyRecaptchaToken };