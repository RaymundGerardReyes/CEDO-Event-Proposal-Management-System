const express = require("express");
const router = express.Router();

// Import the new modular routers
const proposalsRouter = require('./proposals/index');
const adminRoutes = require('./proposals/admin.routes');
const reportRoutes = require('./proposals/report.routes');

// Mount the new routers
// Any request to /proposals will be handled by the index router inside the proposals directory
router.use('/', proposalsRouter);

// The lines below that were previously added to proposals/index.js are being consolidated here for clarity
// All admin routes will be prefixed with /admin
router.use('/admin', adminRoutes);
// All report routes will be prefixed with /reports
router.use('/reports', reportRoutes);

module.exports = router;