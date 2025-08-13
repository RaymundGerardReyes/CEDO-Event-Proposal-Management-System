const express = require('express');
const router = express.Router();

// Cache config data to prevent repeated processing
let configCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * @route   GET /api/config
 * @desc    Get public configuration variables
 * @access  Public
 */
router.get('/', (req, res) => {
    try {
        const now = Date.now();

        // Return cached config if still valid
        if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
            console.log('📋 Config: Returning cached config');
            return res.json(configCache);
        }

        const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';

        if (!recaptchaSiteKey) {
            console.error('FATAL: RECAPTCHA_SITE_KEY is not configured on the backend.');
            // In a production environment, you might not want to expose detailed errors.
            return res.status(500).json({ msg: 'Server configuration error for security services.' });
        }

        // Create new config object
        const config = {
            recaptchaSiteKey: recaptchaSiteKey,
            timestamp: now,
        };

        // Cache the config
        configCache = config;
        cacheTimestamp = now;

        console.log('📋 Config: Generated new config and cached');
        res.json(config);
    } catch (error) {
        console.error('Error in /api/config route:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
