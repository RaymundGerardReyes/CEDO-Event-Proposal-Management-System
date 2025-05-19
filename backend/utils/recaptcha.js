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
    if (!RECAPTCHA_SECRET_KEY) {
        console.error("ReCAPTCHA secret key is not configured on the server.");
        throw new Error("ReCAPTCHA service is not configured.");
    }
    if (!token) {
        return false;
    }
    try {
        const params = new URLSearchParams();
        params.append('secret', RECAPTCHA_SECRET_KEY);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }
        const response = await axios.post(RECAPTCHA_VERIFY_URL, params);
        return response.data.success; // also check score/action for v3 if needed
    } catch (error) {
        console.error("Backend Error: Error verifying ReCAPTCHA token with Google:", error.message);
        throw new Error("Failed to communicate with ReCAPTCHA verification service.");
    }
}

module.exports = { verifyRecaptchaToken };