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

    console.log('\n--- reCAPTCHA Verification Debug ---');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Secret Key configured:', secretKey ? 'YES' : 'NO');
    console.log('Token received:', token ? 'YES' : 'NO');
    console.log('Remote IP:', remoteIp);

    if (!secretKey) {
        console.error("ReCAPTCHA secret key is not configured on the server.");
        return false;
    }
    if (!token) {
        console.warn("No reCAPTCHA token provided.");
        return false;
    }

    // Development bypass - allow localhost/testing
    if (process.env.NODE_ENV === 'development' &&
        (token === 'test-token' || token === 'dev-bypass' || remoteIp === '::1' || remoteIp === '127.0.0.1')) {
        console.log('reCAPTCHA: Development bypass activated for testing');
        return true;
    }

    try {
        console.log('Making reCAPTCHA verification request to Google...');
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: token,
                remoteip: remoteIp,
            },
        });

        console.log('reCAPTCHA Response:', {
            success: response.data.success,
            challenge_ts: response.data.challenge_ts,
            hostname: response.data.hostname,
            score: response.data.score,
            action: response.data.action,
            error_codes: response.data['error-codes']
        });

        if (!response.data.success) {
            console.error('reCAPTCHA verification failed. Error codes:', response.data['error-codes']);
        }

        return response.data.success; // Check if the token is valid
    } catch (error) {
        console.error("Error verifying reCAPTCHA token:", error.message);
        return false;
    } finally {
        console.log('--- reCAPTCHA Verification Debug End ---\n');
    }
}

module.exports = { verifyRecaptchaToken };