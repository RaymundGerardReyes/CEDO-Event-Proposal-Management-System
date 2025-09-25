/**
 * Admin Routes - Modular Structure Redirect
 * 
 * This file has been modularized into separate files for better maintainability:
 * 
 * Structure:
 * - admin/index.js       - Central router (main entry point)
 * - admin/dashboard.js   - Dashboard HTML and status endpoints  
 * - admin/proposals.js   - Proposal CRUD, status, comments, file operations
 * - admin/users.js       - User management endpoints
 * - admin/reports.js     - Report generation and dashboard stats
 * - admin/middleware.js  - Shared middleware and file upload config
 * 
 * All endpoints that were previously in this monolithic file have been moved to their
 * respective modular files for better organization and maintainability.
 * 
 * @since 2025-01-06 - Modularized from 1800+ line monolithic file
 */

// Import and export the modular admin router
module.exports = require('./admin/index');
