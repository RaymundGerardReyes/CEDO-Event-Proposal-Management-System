const express = require("express");
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
// Assuming you have middleware for authentication and role checks
// const { validateToken, checkRole } = require('../../middleware/auth');
// const ROLES = require('../../constants/roles');

// GET /api/proposals/admin/proposals
router.get(
    '/proposals',
    // validateToken,  // You should uncomment these lines in production
    // checkRole([ROLES.HEAD_ADMIN, ROLES.MANAGER]),
    adminController.getProposalsForAdmin
);

// GET /api/proposals/admin/stats
router.get(
    '/stats',
    // validateToken,  // You should uncomment these lines in production
    // checkRole([ROLES.HEAD_ADMIN, ROLES.MANAGER]),
    adminController.getAdminStats
);

// NEW: Update proposal status – matches frontend path PATCH /api/proposals/admin/proposals/:id/status
// This re-implements the logic found in mongodb-unified-api.js so that the
// admin dashboard can hit the expected endpoint without 404.
const { pool } = require('../../config/db');

router.patch('/proposals/:id/status', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const { status, adminComments } = req.body || {};

        // Normalise status (frontend sometimes sends "rejected" instead of "denied")
        const normalised = (status || '').toLowerCase() === 'rejected' ? 'denied' : (status || '').toLowerCase();
        const validStatuses = ['pending', 'approved', 'denied', 'draft'];

        if (!validStatuses.includes(normalised)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updateSql = `UPDATE proposals SET proposal_status = ?, admin_comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const [result] = await pool.query(updateSql, [normalised, adminComments || '', proposalId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found',
                message: `No proposal found with ID: ${proposalId}`
            });
        }

        return res.json({
            success: true,
            message: `Proposal ${normalised} successfully`,
            proposal: {
                id: proposalId,
                status: normalised,
                adminComments: adminComments || '',
                updatedAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('❌ Admin PATCH status error:', err);
        return res.status(500).json({ success: false, error: 'Failed to update status', message: err.message });
    }
});

module.exports = router; 