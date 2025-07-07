const express = require('express');
const router = express.Router();

// Import sub-routers
router.use('/', require('./dashboard'));
router.use('/mysql', require('./mysql'));
router.use('/mongodb', require('./mongodb'));
router.use('/proposals', require('./proposals'));
router.use('/users', require('./users'));
router.use('/reports', require('./reports'));

// Export the central admin router
module.exports = router; 