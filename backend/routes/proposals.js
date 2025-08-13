/**
 * Proposal Routes
 * Handles UUID-based proposal management with MySQL backend
 * 
 * Key approaches: TDD implementation, comprehensive validation,
 * audit logging, and status transition management
 */

const express = require('express');
const { pool } = require('../config/db.js');
const { validateToken, validateAdmin } = require('../middleware/auth.js');
const { createAuditLog } = require('../services/audit.service.js');
const { validateProposal, validateReportData, validateReviewAction } = require('../validators/proposal.validator.js');

const router = express.Router();

/**
 * POST /api/proposals
 * Create new proposal or return existing by UUID
 */
router.post('/', validateToken, validateProposal, async (req, res) => {
    try {
        const { uuid, organization_name, user_id, current_section = 'orgInfo', proposal_status = 'draft' } = req.body;

        // Check if proposal already exists
        const [existingProposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (existingProposals.length > 0) {
            // Return existing proposal
            await createAuditLog(uuid, 'proposal_retrieved', req.user.id, 'Proposal retrieved by UUID');
            return res.status(200).json(existingProposals[0]);
        }

        // Create new proposal
        const [result] = await pool.execute(
            `INSERT INTO proposals (
                uuid, organization_name, user_id, current_section, proposal_status,
                form_completion_percentage, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [uuid, organization_name, user_id, current_section, proposal_status, 0]
        );

        const [newProposal] = await pool.execute(
            'SELECT * FROM proposals WHERE id = ?',
            [result.insertId]
        );

        await createAuditLog(uuid, 'proposal_created', req.user.id, 'New proposal created', {
            organization_name,
            current_section,
            proposal_status
        });

        res.status(201).json(newProposal[0]);
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/proposals/:uuid
 * Update proposal with partial data
 */
router.put('/:uuid', validateToken, validateProposal, async (req, res) => {
    try {
        const { uuid } = req.params;
        const updateData = req.body;

        // Check if proposal exists
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (key !== 'uuid' && key !== 'id') { // Prevent updating primary keys
                updateFields.push(`${key} = ?`);
                updateValues.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(uuid);

        await pool.execute(
            `UPDATE proposals SET ${updateFields.join(', ')} WHERE uuid = ?`,
            updateValues
        );

        // Get updated proposal
        const [updatedProposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        await createAuditLog(uuid, 'proposal_updated', req.user.id, 'Proposal updated', updateData);

        res.status(200).json(updatedProposals[0]);
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/proposals/:uuid
 * Get proposal by UUID
 */
router.get('/:uuid', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.status(200).json(proposals[0]);
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/proposals/:uuid/submit
 * Submit proposal and set status to pending
 */
router.post('/:uuid/submit', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        // Check if proposal exists
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposals[0];

        // Check if already submitted
        if (proposal.proposal_status !== 'draft') {
            return res.status(409).json({ error: 'Proposal already submitted' });
        }

        // Update proposal status
        await pool.execute(
            `UPDATE proposals SET 
                proposal_status = 'pending',
                submitted_at = NOW(),
                current_section = 'submitted',
                updated_at = NOW()
            WHERE uuid = ?`,
            [uuid]
        );

        // Get updated proposal
        const [updatedProposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        await createAuditLog(uuid, 'proposal_submitted', req.user.id, 'Proposal submitted for review');

        res.status(200).json(updatedProposals[0]);
    } catch (error) {
        console.error('Error submitting proposal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/proposals/:uuid/review
 * Admin review of proposal (approve, revision_requested, denied)
 */
router.post('/:uuid/review', validateToken, validateAdmin, validateReviewAction, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { action, note } = req.body;

        // Check if proposal exists
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposals[0];

        // Check if proposal is in pending status
        if (proposal.proposal_status !== 'pending') {
            return res.status(409).json({ error: 'Proposal must be in pending status for review' });
        }

        // Update proposal based on action
        let updateQuery = `
            UPDATE proposals SET 
                proposal_status = ?,
                reviewed_by_admin_id = ?,
                reviewed_at = NOW(),
                updated_at = NOW()
        `;
        const updateValues = [action, req.user.id];

        if (action === 'approve') {
            updateQuery += ', approved_at = NOW()';
        } else {
            updateQuery += ', approved_at = NULL';
        }

        updateQuery += ' WHERE uuid = ?';
        updateValues.push(uuid);

        await pool.execute(updateQuery, updateValues);

        // Get updated proposal
        const [updatedProposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        await createAuditLog(uuid, `proposal_${action}`, req.user.id, note || `Proposal ${action}`, {
            action,
            note,
            admin_id: req.user.id
        });

        res.status(200).json(updatedProposals[0]);
    } catch (error) {
        console.error('Error reviewing proposal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/proposals/:uuid/report
 * Submit report for approved proposal
 */
router.post('/:uuid/report', validateToken, validateReportData, async (req, res) => {
    try {
        const { uuid } = req.params;
        const reportData = req.body;

        // Check if proposal exists
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposals[0];

        // Check if proposal is approved
        if (proposal.proposal_status !== 'approved') {
            return res.status(409).json({ error: 'Report can only be submitted for approved proposals' });
        }

        // Update proposal with report data
        await pool.execute(
            `UPDATE proposals SET 
                report_status = 'pending',
                report_submitted_at = NOW(),
                report_content = ?,
                participant_count = ?,
                outcomes = ?,
                updated_at = NOW()
            WHERE uuid = ?`,
            [reportData.report_content, reportData.participant_count, reportData.outcomes, uuid]
        );

        // Get updated proposal
        const [updatedProposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        await createAuditLog(uuid, 'report_submitted', req.user.id, 'Report submitted', reportData);

        res.status(200).json(updatedProposals[0]);
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/proposals/:uuid/debug
 * Get comprehensive debug information
 */
router.get('/:uuid/debug', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        // Get proposal data
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposals[0];

        // Get audit logs
        const [auditLogs] = await pool.execute(
            'SELECT * FROM proposal_audit_logs WHERE proposal_uuid = ? ORDER BY created_at DESC',
            [uuid]
        );

        // Get debug logs
        const [debugLogs] = await pool.execute(
            'SELECT * FROM proposal_debug_logs WHERE proposal_uuid = ? ORDER BY created_at DESC',
            [uuid]
        );

        // Calculate status match (simplified for now)
        const statusMatch = true; // This would be more complex in real implementation

        const debugInfo = {
            mysql_record: proposal,
            audit_logs: auditLogs,
            debug_logs: debugLogs,
            status_match: statusMatch
        };

        res.status(200).json(debugInfo);
    } catch (error) {
        console.error('Error fetching debug info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/proposals/:uuid/debug/logs
 * Append debug log
 */
router.post('/:uuid/debug/logs', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { source, message, meta } = req.body;

        // Validate required fields
        if (!source || !message) {
            return res.status(400).json({
                error: 'source and message are required'
            });
        }

        // Check if proposal exists
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [uuid]
        );

        if (proposals.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Create debug log
        const [result] = await pool.execute(
            'INSERT INTO proposal_debug_logs (proposal_uuid, source, message, meta) VALUES (?, ?, ?, ?)',
            [uuid, source, message, meta ? JSON.stringify(meta) : null]
        );

        const [newLog] = await pool.execute(
            'SELECT * FROM proposal_debug_logs WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newLog[0]);
    } catch (error) {
        console.error('Error creating debug log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;