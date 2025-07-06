/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Main Router
 * =============================================
 * 
 * This module serves as the main router for all MongoDB unified API endpoints.
 * It organizes routes by feature and provides a clean separation between
 * student-facing and admin-facing endpoints.
 * 
 * @module routes/mongodb-unified/index
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Routes are organized as follows:
 * - Student endpoints: Direct access (e.g., /proposals/school-events)
 * - Admin endpoints: Under /admin prefix (e.g., /admin/proposals-hybrid)
 * - File management: Dedicated file routes
 * - Reports: Accomplishment and progress tracking
 * 
 * @example
 * // Student submits school event with files
 * POST /api/mongodb-unified/proposals/school-events
 * 
 * // Admin views hybrid proposals (MySQL + MongoDB files)
 * GET /api/mongodb-unified/admin/proposals-hybrid
 * 
 * // Download proposal files
 * GET /api/mongodb-unified/proposals/download/:proposalId/:fileType
 */

const express = require('express');
const router = express.Router();

// =============================================
// STUDENT-FACING ROUTES (Direct Access)
// =============================================

/**
 * Organization Management
 * - Create, update, and manage organization profiles
 * - Used by students during proposal submission
 */
router.use('/', require('./organizations.routes'));

/**
 * File Management & Uploads
 * - GridFS file uploads and downloads
 * - File metadata management
 * - Cross-platform file handling
 */
router.use('/', require('./proposal-files.routes'));

/**
 * Event Proposal Management
 * - School event submissions (Section 3)
 * - Community event submissions (Section 4)
 * - Hybrid MySQL + MongoDB storage
 */
router.use('/', require('./events.routes'));

/**
 * Reports & Accomplishment Tracking
 * - Accomplishment report submissions
 * - Progress tracking and analytics
 * - Event completion documentation
 */
router.use('/', require('./reports.routes'));

/**
 * Student Dashboard & Profile
 * - User proposal history
 * - Personal dashboard data
 * - Student-specific endpoints
 */
router.use('/', require('./students.routes'));

// =============================================
// ADMIN-FACING ROUTES (Under /admin Prefix)
// =============================================

/**
 * Admin Dashboard & Management
 * - Proposal review and approval
 * - Admin comments and status updates
 * - Hybrid data integration (MySQL + MongoDB)
 * - Dashboard statistics and analytics
 */
router.use('/admin', require('./admin.routes'));

module.exports = router; 