const express = require('express');
const router = express.Router();

// Import sub-routers (PostgreSQL-only)
router.use('/', require('./dashboard'));
router.use('/proposals', require('./proposals'));
router.use('/users', require('./users')); // Use real users route instead of mock
router.use('/reports', require('./reports'));

// Export the central admin router
module.exports = router; 