const express = require("express");
const router = express.Router();
const reportController = require("../../controllers/report.controller");

// @route   GET /api/proposals/reports/organizations
// @desc    Get all organizations with filtering and analytics
// @access  Private (Admin)
router.get("/organizations", reportController.getOrganizations);

// @route   GET /api/proposals/reports/analytics
// @desc    Get general analytics data
// @access  Private (Admin)
router.get("/analytics", reportController.getAnalytics);

// @route   GET /api/proposals/reports/organizations/:organizationName/analytics
// @desc    Get comprehensive analytics for a specific organization
// @access  Private (Admin)
router.get("/organizations/:organizationName/analytics", reportController.getOrganizationAnalytics);

// @route   GET /api/proposals/reports/stats
// @desc    Get dashboard statistics (legacy compatibility)
// @access  Private (Admin)
router.get("/stats", reportController.getDashboardStats);

// @route   GET /api/proposals/reports/live
// @desc    Get live statistics
// @access  Private (Admin)
router.get("/live", reportController.getLiveStats);

// @route   POST /api/proposals/reports/generate
// @desc    Generate comprehensive report with charts and analytics
// @access  Private (Admin)
router.post("/generate", reportController.generateReport);

module.exports = router; 