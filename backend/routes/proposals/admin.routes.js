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

// Update proposal status – matches frontend path PATCH /api/proposals/admin/proposals/:id/status
// PostgreSQL-only implementation for admin dashboard
const { pool, query } = require('../../config/database-postgresql-only');

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

// Download proposal files
router.get('/proposals/download/:id/:fileType', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const fileType = req.params.fileType;

        // Get proposal file information
        const result = await query(
            'SELECT gpoa_file_name, gpoa_file_path, project_proposal_file_name, project_proposal_file_path FROM proposals WHERE id = $1',
            [proposalId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = result.rows[0];
        let filePath, fileName;

        if (fileType === 'gpoa' && proposal.gpoa_file_path) {
            filePath = proposal.gpoa_file_path;
            fileName = proposal.gpoa_file_name;
        } else if (fileType === 'project-proposal' && proposal.project_proposal_file_path) {
            filePath = proposal.project_proposal_file_path;
            fileName = proposal.project_proposal_file_name;
        } else {
            return res.status(404).json({ error: 'File not found' });
        }

        // For now, return file info (actual file serving can be implemented later)
        res.json({
            success: true,
            file: {
                name: fileName,
                path: filePath,
                type: fileType
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Get proposal files
router.get('/proposals/:id/files', async (req, res) => {
    try {
        const proposalId = req.params.id;

        const result = await query(
            'SELECT gpoa_file_name, gpoa_file_size, gpoa_file_path, project_proposal_file_name, project_proposal_file_size, project_proposal_file_path FROM proposals WHERE id = $1',
            [proposalId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = result.rows[0];
        const files = {};

        if (proposal.gpoa_file_name) {
            files.gpoa = {
                name: proposal.gpoa_file_name,
                size: proposal.gpoa_file_size,
                path: proposal.gpoa_file_path
            };
        }

        if (proposal.project_proposal_file_name) {
            files.projectProposal = {
                name: proposal.project_proposal_file_name,
                size: proposal.project_proposal_file_size,
                path: proposal.project_proposal_file_path
            };
        }

        res.json({ success: true, files });

    } catch (error) {
        console.error('Files fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

module.exports = router; 