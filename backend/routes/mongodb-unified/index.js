const express = require('express');
const router = express.Router();

// Feature-level routers (kept deliberately flat)
router.use('/', require('./organizations.routes'));
router.use('/', require('./proposal-files.routes'));
router.use('/', require('./events.routes'));
router.use('/', require('./reports.routes'));
router.use('/', require('./students.routes'));

// Admin endpoints live under /admin to avoid clashes with student URLs
router.use('/admin', require('./admin.routes'));

module.exports = router; 