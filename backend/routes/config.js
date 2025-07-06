const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/config
 * @desc    Get public configuration variables
 * @access  Public
 */
router.get('/', (req, res) => {
    try {
        const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;

        if (!recaptchaSiteKey) {
            console.error('FATAL: RECAPTCHA_SITE_KEY is not configured on the backend.');
            // In a production environment, you might not want to expose detailed errors.
            return res.status(500).json({ msg: 'Server configuration error for security services.' });
        }

        res.json({
            recaptchaSiteKey: recaptchaSiteKey,
        });
    } catch (error) {
        console.error('Error in /api/config route:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
