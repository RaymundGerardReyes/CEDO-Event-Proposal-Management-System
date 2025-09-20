/**
 * Proposal Routes
 * Handles UUID-based proposal management with PostgreSQL backend
 * 
 * Key approaches: TDD implementation, comprehensive validation,
 * audit logging, and status transition management
 */

const express = require('express');
const { pool, query } = require('../config/database');
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
        const existingResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (existingResult.rows.length > 0) {
            // Return existing proposal
            await createAuditLog(uuid, 'proposal_retrieved', req.user.id, 'Proposal retrieved by UUID');
            return res.status(200).json(existingResult.rows[0]);
        }

        // Create new proposal
        await query(
            `INSERT INTO proposals (
                uuid, organization_name, user_id, current_section, proposal_status,
                form_completion_percentage, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [uuid, organization_name, user_id, current_section, proposal_status, 0]
        );

        const newProposalResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        await createAuditLog(uuid, 'proposal_created', req.user.id, 'New proposal created', {
            organization_name,
            current_section,
            proposal_status
        });

        res.status(201).json(newProposalResult.rows[0]);
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (key !== 'uuid' && key !== 'id') { // Prevent updating primary keys
                updateFields.push(`${key} = $${paramIndex}`);
                updateValues.push(updateData[key]);
                paramIndex++;
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);

        await query(
            `UPDATE proposals SET ${updateFields.join(', ')} WHERE uuid = $${paramIndex}`,
            updateValues
        );

        // Get updated proposal
        const updatedProposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        await createAuditLog(uuid, 'proposal_updated', req.user.id, 'Proposal updated', updateData);

        res.status(200).json(updatedProposalsResult.rows[0]);
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

        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.status(200).json(proposalsResult.rows[0]);
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposalsResult.rows[0];

        // Check if already submitted
        if (proposal.proposal_status !== 'draft') {
            return res.status(409).json({ error: 'Proposal already submitted' });
        }

        // Update proposal status
        await query(
            `UPDATE proposals SET 
                proposal_status = 'pending',
                submitted_at = CURRENT_TIMESTAMP,
                current_section = 'submitted',
                updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $1`,
            [uuid]
        );

        // Get updated proposal
        const updatedProposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        await createAuditLog(uuid, 'proposal_submitted', req.user.id, 'Proposal submitted for review');

        res.status(200).json(updatedProposalsResult.rows[0]);
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposalsResult.rows[0];

        // Check if proposal is in pending status
        if (proposal.proposal_status !== 'pending') {
            return res.status(409).json({ error: 'Proposal must be in pending status for review' });
        }

        // Update proposal based on action
        let updateQuery = `
            UPDATE proposals SET 
                proposal_status = $1,
                reviewed_by_admin_id = $2,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
        `;
        const updateValues = [action, req.user.id];

        if (action === 'approve') {
            updateQuery += ', approved_at = CURRENT_TIMESTAMP';
        } else {
            updateQuery += ', approved_at = NULL';
        }

        updateQuery += ' WHERE uuid = $3';
        updateValues.push(uuid);

        await query(updateQuery, updateValues);

        // Get updated proposal
        const updatedProposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        await createAuditLog(uuid, `proposal_${action}`, req.user.id, note || `Proposal ${action}`, {
            action,
            note,
            admin_id: req.user.id
        });

        res.status(200).json(updatedProposalsResult.rows[0]);
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposalsResult.rows[0];

        // Check if proposal is approved
        if (proposal.proposal_status !== 'approved') {
            return res.status(409).json({ error: 'Report can only be submitted for approved proposals' });
        }

        // Update proposal with report data
        await query(
            `UPDATE proposals SET 
                report_status = 'pending',
                report_submitted_at = CURRENT_TIMESTAMP,
                report_content = $1,
                participant_count = $2,
                outcomes = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $4`,
            [reportData.report_content, reportData.participant_count, reportData.outcomes, uuid]
        );

        // Get updated proposal
        const updatedProposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        await createAuditLog(uuid, 'report_submitted', req.user.id, 'Report submitted', reportData);

        res.status(200).json(updatedProposalsResult.rows[0]);
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposalsResult.rows[0];

        // Get audit logs
        const auditLogsResult = await query(
            'SELECT * FROM proposal_audit_logs WHERE proposal_uuid = $1 ORDER BY created_at DESC',
            [uuid]
        );

        // Get debug logs
        const debugLogsResult = await query(
            'SELECT * FROM proposal_debug_logs WHERE proposal_uuid = $1 ORDER BY created_at DESC',
            [uuid]
        );

        // Calculate status match (simplified for now)
        const statusMatch = true; // This would be more complex in real implementation

        const debugInfo = {
            postgres_record: proposal,
            audit_logs: auditLogsResult.rows,
            debug_logs: debugLogsResult.rows,
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
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Create debug log
        await query(
            'INSERT INTO proposal_debug_logs (proposal_uuid, source, message, meta, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
            [uuid, source, message, meta ? JSON.stringify(meta) : null]
        );

        const newLogResult = await query(
            'SELECT * FROM proposal_debug_logs WHERE proposal_uuid = $1 ORDER BY id DESC LIMIT 1',
            [uuid]
        );

        res.status(201).json(newLogResult.rows[0]);
    } catch (error) {
        console.error('Error creating debug log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;