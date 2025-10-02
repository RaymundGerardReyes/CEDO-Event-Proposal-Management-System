/**
 * Proposal Routes
 * Handles UUID-based proposal management with PostgreSQL backend
 * 
 * Key approaches: TDD implementation, comprehensive validation,
 * audit logging, and status transition management
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool, query } = require('../config/database-postgresql-only');
const { validateToken, validateAdmin } = require('../middleware/auth.js');
const { createAuditLog } = require('../services/audit.service.js');
const { validateProposal, validateReportData, validateReviewAction } = require('../validators/proposal.validator.js');

const router = express.Router();

// Configure multer for file uploads
// Memory storage for direct DB insertion into proposal_files
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 2 // Maximum 2 files (GPOA and Project Proposal)
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, DOC, DOCX files
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
        }
    }
});

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
 * Upsert proposal (create if not exists, update if exists)
 */
router.put('/:uuid', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { proposal: proposalData, files, ...otherData } = req.body;

        console.log('📝 PUT /proposals/:uuid - Received data:', {
            uuid,
            hasProposal: !!proposalData,
            hasFiles: !!files,
            otherKeys: Object.keys(otherData)
        });

        // Check if proposal exists
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        const proposalExists = proposalsResult.rows.length > 0;
        console.log(`📊 Proposal ${uuid} ${proposalExists ? 'exists' : 'does not exist'}, will ${proposalExists ? 'update' : 'create'}`);

        // Use proposalData if available, otherwise use the entire body
        const updateData = proposalData || req.body;

        if (proposalExists) {
            // UPDATE existing proposal
            console.log('📝 Updating existing proposal');

            // Build update query dynamically
            const updateFields = [];
            const updateValues = [];
            let paramIndex = 1;

            Object.keys(updateData).forEach(key => {
                if (key !== 'uuid' && key !== 'id' && key !== 'files') { // Prevent updating primary keys and files
                    let value = updateData[key];

                    // Handle JSON fields
                    if (key === 'target_audience' || key === 'validation_errors') {
                        value = JSON.stringify(value);
                    }

                    // Skip legacy file columns not in new schema
                    const legacyFileCols = new Set([
                        'gpoa_file_name', 'gpoa_file_size', 'gpoa_file_type', 'gpoa_file_path',
                        'project_proposal_file_name', 'project_proposal_file_size', 'project_proposal_file_type', 'project_proposal_file_path',
                        'file_name', 'file_type', 'file_size', 'file_category', 'file_data'
                    ]);
                    if (legacyFileCols.has(key)) {
                        return; // continue
                    }

                    updateFields.push(`${key} = $${paramIndex}`);
                    updateValues.push(value);
                    paramIndex++;
                }
            });

            if (updateFields.length === 0) {
                console.log('⚠️ No valid fields to update');
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            updateValues.push(uuid);

            console.log('📝 Updating proposal with fields:', updateFields);

            await query(
                `UPDATE proposals SET ${updateFields.join(', ')} WHERE uuid = $${paramIndex}`,
                updateValues
            );

            await createAuditLog(uuid, 'proposal_updated', req.user.id, 'Proposal updated', updateData);

        } else {
            // CREATE new proposal
            console.log('📝 Creating new proposal');

            // Prepare data for insertion with required fields (updated schema)
            const insertData = {
                uuid: uuid,
                organization_name: updateData.organization_name || '',
                organization_type: updateData.organization_type || 'school-based',
                organization_description: updateData.organization_description || '',
                organization_registration_no: updateData.organization_registration_no || '',
                contact_person: updateData.contact_person || '',
                contact_email: updateData.contact_email || '',
                contact_phone: updateData.contact_phone || '',
                event_name: updateData.event_name || '',
                event_venue: updateData.event_venue || '',
                event_start_date: updateData.event_start_date || null,
                event_end_date: updateData.event_end_date || null,
                event_start_time: updateData.event_start_time || null,
                event_end_time: updateData.event_end_time || null,
                event_mode: updateData.event_mode || 'offline',
                event_type: updateData.event_type || '',
                target_audience: updateData.target_audience ? JSON.stringify(updateData.target_audience) : '[]',
                sdp_credits: updateData.sdp_credits || null,
                current_section: updateData.current_section || 'orgInfo',
                proposal_status: updateData.proposal_status || 'draft',
                report_status: updateData.report_status || 'draft',
                event_status: updateData.event_status || 'scheduled',
                form_completion_percentage: updateData.form_completion_percentage || 0.00,
                user_id: req.user.id
            };

            // Build insert query
            const insertFields = Object.keys(insertData);
            const insertValues = Object.values(insertData);
            const placeholders = insertFields.map((_, index) => `$${index + 1}`).join(', ');

            console.log('📝 Creating proposal with fields:', insertFields);
            console.log('📝 Insert data - proposal_status:', insertData.proposal_status);

            await query(
                `INSERT INTO proposals (${insertFields.join(', ')}) VALUES (${placeholders})`,
                insertValues
            );

            await createAuditLog(uuid, 'proposal_created', req.user.id, 'Proposal created', insertData);
        }

        // Get the final proposal (whether created or updated)
        const finalProposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        res.status(200).json({
            success: true,
            data: finalProposalsResult.rows[0],
            message: proposalExists ? 'Proposal updated successfully' : 'Proposal created successfully'
        });
    } catch (error) {
        console.error('❌ Error updating proposal:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/proposals/drafts-and-rejected
 * Get user's drafts and rejected proposals
 */
router.get('/drafts-and-rejected', validateToken, async (req, res) => {
    try {
        const { includeRejected = 'true', limit = 100, offset = 0 } = req.query;
        const userId = req.user.id;

        console.log('📋 Getting drafts and rejected proposals for user:', userId, { includeRejected, limit, offset });

        // Build the query based on parameters
        let statusFilter = "proposal_status IN ('draft')";
        if (includeRejected === 'true') {
            statusFilter = "proposal_status IN ('draft', 'denied')";
        }

        const proposalsResult = await query(
            `SELECT 
                p.uuid,
                p.organization_name,
                p.organization_type,
                p.contact_person,
                p.contact_email,
                p.contact_phone,
                p.event_name,
                p.event_venue,
                p.event_start_date,
                p.event_end_date,
                p.event_start_time,
                p.event_end_time,
                p.event_mode,
                p.event_type,
                p.target_audience,
                p.sdp_credits,
                p.current_section,
                p.form_completion_percentage,
                p.proposal_status,
                p.report_status,
                p.event_status,
                p.attendance_count,
                p.objectives,
                p.budget,
                p.volunteers_needed,
                p.report_description,
                p.admin_comments,
                p.submitted_at,
                p.approved_at,
                p.created_at,
                p.updated_at,
                u.name as user_name,
                u.email as user_email
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1 
                AND p.is_deleted = false 
                AND ${statusFilter}
            ORDER BY p.updated_at DESC
            LIMIT $2 OFFSET $3`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        // Get total count for pagination
        const countResult = await query(
            `SELECT COUNT(*) as total
            FROM proposals p
            WHERE p.user_id = $1 
                AND p.is_deleted = false 
                AND ${statusFilter}`,
            [userId]
        );

        const totalCount = parseInt(countResult.rows[0].total);

        // Transform the data to match frontend expectations
        const proposals = proposalsResult.rows.map(proposal => ({
            uuid: proposal.uuid,
            organizationName: proposal.organization_name,
            organizationType: proposal.organization_type,
            contactPerson: proposal.contact_person,
            contactEmail: proposal.contact_email,
            contactPhone: proposal.contact_phone,
            eventName: proposal.event_name,
            eventVenue: proposal.event_venue,
            eventStartDate: proposal.event_start_date,
            eventEndDate: proposal.event_end_date,
            eventStartTime: proposal.event_start_time,
            eventEndTime: proposal.event_end_time,
            eventMode: proposal.event_mode,
            eventType: proposal.event_type,
            targetAudience: proposal.target_audience,
            sdpCredits: proposal.sdp_credits,
            currentSection: proposal.current_section,
            formCompletionPercentage: proposal.form_completion_percentage,
            proposalStatus: proposal.proposal_status,
            reportStatus: proposal.report_status,
            eventStatus: proposal.event_status,
            attendanceCount: proposal.attendance_count,
            objectives: proposal.objectives,
            budget: proposal.budget,
            volunteersNeeded: proposal.volunteers_needed,
            reportDescription: proposal.report_description,
            adminComments: proposal.admin_comments,
            submittedAt: proposal.submitted_at,
            approvedAt: proposal.approved_at,
            createdAt: proposal.created_at,
            updatedAt: proposal.updated_at,
            userName: proposal.user_name,
            userEmail: proposal.user_email
        }));

        console.log('✅ Drafts and rejected proposals retrieved:', proposals.length, 'proposals');

        res.json({
            success: true,
            proposals: proposals,
            metadata: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + proposals.length) < totalCount
            },
            count: proposals.length
        });

    } catch (error) {
        console.error('❌ Error getting drafts and rejected proposals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drafts and rejected proposals',
            message: error.message
        });
    }
});

// Get user's own proposals for reports
router.get('/user-proposals', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        console.log('📋 Getting user proposals for user:', userId, 'with status filter:', status);

        // Build query with optional status filter
        let queryText = `
            SELECT 
                id, uuid, organization_name, organization_type, event_name, 
                event_venue, event_start_date, event_end_date, event_start_time, event_end_time,
                event_type, contact_person, contact_email, contact_phone,
                proposal_status, report_status, event_status, attendance_count,
                objectives, budget, volunteers_needed, report_description,
                admin_comments, submitted_at, approved_at, created_at, updated_at
            FROM proposals 
            WHERE user_id = $1 AND is_deleted = false
        `;

        const queryParams = [userId];

        // Add status filter if provided
        if (status && status !== 'all') {
            queryText += ' AND proposal_status = $2';
            queryParams.push(status);
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, queryParams);

        const proposals = result.rows.map(proposal => ({
            id: proposal.id,
            uuid: proposal.uuid,
            organization_name: proposal.organization_name,
            organization_type: proposal.organization_type,
            event_name: proposal.event_name,
            event_venue: proposal.event_venue,
            event_start_date: proposal.event_start_date,
            event_end_date: proposal.event_end_date,
            event_start_time: proposal.event_start_time,
            event_end_time: proposal.event_end_time,
            event_type: proposal.event_type,
            contact_name: proposal.contact_person,
            contact_email: proposal.contact_email,
            contact_phone: proposal.contact_phone,
            proposal_status: proposal.proposal_status,
            report_status: proposal.report_status,
            event_status: proposal.event_status,
            attendance_count: proposal.attendance_count,
            objectives: proposal.objectives,
            budget: proposal.budget,
            volunteers_needed: proposal.volunteers_needed,
            report_description: proposal.report_description,
            admin_comments: proposal.admin_comments,
            submitted_at: proposal.submitted_at,
            approved_at: proposal.approved_at,
            created_at: proposal.created_at,
            updated_at: proposal.updated_at
        }));

        console.log('✅ User proposals retrieved:', proposals.length, 'proposals');

        res.json({
            success: true,
            data: {
                proposals
            }
        });

    } catch (error) {
        console.error('User proposals fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user proposals'
        });
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
            console.log(`❌ Proposal ${uuid} not found in database`);
            return res.status(404).json({
                success: false,
                error: 'Proposal not found',
                message: 'Proposal not found in database'
            });
        }

        const baseResult = await query('SELECT * FROM proposals WHERE uuid = $1', [uuid]);
        const proposal = baseResult.rows[0];

        // Check if already submitted
        console.log(`📊 Submit check - Proposal ${uuid} status: "${proposal.proposal_status}"`);
        if (proposal.proposal_status !== 'draft') {
            console.log(`⚠️ Proposal ${uuid} cannot be submitted - current status: "${proposal.proposal_status}"`);
            return res.status(409).json({
                success: false,
                error: 'Proposal already submitted',
                message: `Proposal is already in ${proposal.proposal_status} status`
            });
        }

        // Update proposal status
        await query(
            `UPDATE proposals SET 
                proposal_status = 'pending',
                submitted_at = CURRENT_TIMESTAMP,
                current_section = 'reporting',
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

        res.status(200).json({
            success: true,
            data: updatedProposalsResult.rows[0],
            message: 'Proposal submitted successfully'
        });
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

        // Ensure proposal exists; create a minimal placeholder if missing
        let proposalsResult = await query(
            'SELECT id FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            await query(
                `INSERT INTO proposals (
                    uuid, organization_name, organization_type, contact_person, contact_email,
                    event_name, event_venue, event_start_date, event_end_date, event_start_time, event_end_time,
                    event_mode, event_type, target_audience, sdp_credits, current_section, proposal_status, user_id,
                    created_at, updated_at
                ) VALUES (
                    $1, '', 'school-based', '', '',
                    '', '', NULL, NULL, NULL, NULL,
                    'offline', '', '[]', NULL, 'orgInfo', 'draft', $2,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )`,
                [uuid, req.user.id]
            );
            proposalsResult = await query('SELECT id FROM proposals WHERE uuid = $1', [uuid]);
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
 * GET /api/proposals/:uuid/status
 * Get proposal status for pending page
 */
router.get('/:uuid/status', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const userId = req.user.id;

        console.log('📋 Getting proposal status for UUID:', uuid);

        // Get proposal details with timeout
        const proposalResult = await query(
            `SELECT 
                id, uuid, proposal_status, report_status, event_status,
                reviewed_at, approved_at, submitted_at, admin_comments,
                organization_name, event_name, created_at, updated_at
            FROM proposals 
            WHERE uuid = $1 AND user_id = $2 AND is_deleted = false`,
            [uuid, userId],
            { timeout: 10000 } // 10 second timeout
        );

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found or access denied'
            });
        }

        const proposal = proposalResult.rows[0];

        // Format the response
        const statusResponse = {
            success: true,
            data: {
                uuid: proposal.uuid,
                proposal_status: proposal.proposal_status,
                report_status: proposal.report_status,
                event_status: proposal.event_status,
                organization_name: proposal.organization_name,
                event_name: proposal.event_name,
                submitted_at: proposal.submitted_at,
                reviewed_at: proposal.reviewed_at,
                approved_at: proposal.approved_at,
                admin_comments: proposal.admin_comments,
                created_at: proposal.created_at,
                updated_at: proposal.updated_at,
                // Status display mapping
                status_display: getStatusDisplay(proposal.proposal_status),
                can_proceed_to_reports: proposal.proposal_status === 'approved'
            }
        };

        console.log('✅ Proposal status retrieved:', statusResponse.data.proposal_status);
        res.json(statusResponse);

    } catch (error) {
        console.error('❌ Error getting proposal status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get proposal status'
        });
    }
});

/**
 * Helper function to map proposal status to display text
 */
function getStatusDisplay(status) {
    const statusMap = {
        'draft': 'Draft',
        'pending': 'Under Review',
        'approved': 'Approved',
        'denied': 'Not Approved',
        'revision_requested': 'Revision Requested'
    };
    return statusMap[status] || 'Unknown';
}

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

/**
 * POST /api/proposals/:uuid/files
 * Upload files for proposal (GPOA and Project Proposal)
 */
router.post('/:uuid/files', validateToken, upload.fields([
    { name: 'gpoa', maxCount: 1 },
    { name: 'projectProposal', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('📎 File upload request received:', {
            uuid: req.params.uuid,
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            hasFiles: !!req.files,
            files: req.files ? Object.keys(req.files) : 'none',
            bodyKeys: Object.keys(req.body || {}),
            rawBody: typeof req.body
        });

        const { uuid } = req.params;
        const files = req.files;

        // Validate files object
        if (!files) {
            console.log('❌ No files object in request');
            return res.status(400).json({
                error: 'No files provided',
                message: 'Files object is missing from request'
            });
        }

        console.log('📁 Files received:', Object.keys(files));
        if (files.gpoa && files.gpoa[0]) {
            console.log('📎 gpoa file meta:', {
                name: files.gpoa[0].originalname,
                mimetype: files.gpoa[0].mimetype,
                size: files.gpoa[0].size,
                bufferBytes: files.gpoa[0].buffer ? files.gpoa[0].buffer.length : 0
            });
        }
        if (files.projectProposal && files.projectProposal[0]) {
            console.log('📎 projectProposal file meta:', {
                name: files.projectProposal[0].originalname,
                mimetype: files.projectProposal[0].mimetype,
                size: files.projectProposal[0].size,
                bufferBytes: files.projectProposal[0].buffer ? files.projectProposal[0].buffer.length : 0
            });
        }

        // Check if at least one file is provided
        const hasGpoaFile = files.gpoa && files.gpoa[0];
        const hasProjectFile = files.projectProposal && files.projectProposal[0];

        if (!hasGpoaFile && !hasProjectFile) {
            console.log('❌ No valid files provided');
            return res.status(400).json({
                error: 'No valid files provided',
                message: 'At least one file (GPOA or Project Proposal) must be provided'
            });
        }

        // Check if proposal exists
        const proposalsResult = await query(
            'SELECT * FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            console.log('❌ Proposal not found for uuid:', uuid);
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const uploadedFiles = {};

        try {
            // Resolve proposal_id from uuid
            const pidRes = await query('SELECT id FROM proposals WHERE uuid = $1', [uuid]);
            if (pidRes.rows.length === 0) {
                return res.status(404).json({ error: 'Proposal not found' });
            }
            const proposalId = pidRes.rows[0].id;

            // Helper to insert into proposal_files
            const insertFile = async (pf, category) => {
                if (!pf || !pf.buffer || typeof pf.size !== 'number') {
                    console.error('❌ insertFile: invalid file payload', { category, hasBuffer: !!(pf && pf.buffer), size: pf && pf.size });
                    throw new Error('Invalid file payload received');
                }
                console.log('⬆️ Inserting file into proposal_files:', {
                    category,
                    name: pf.originalname,
                    mimetype: pf.mimetype,
                    size: pf.size,
                    bufferBytes: pf.buffer ? pf.buffer.length : 0
                });
                await query(
                    `INSERT INTO proposal_files (
                        proposal_id, file_name, file_type, file_size, file_category,
                        storage_backend, storage_key, file_data, created_at
                    ) VALUES ($1, $2, $3, $4, $5, 'db', NULL, $6, now())`,
                    [proposalId, pf.originalname, pf.mimetype, pf.size, category, pf.buffer]
                );
                console.log('✅ Inserted file record for category:', category);
            };

            // Process GPOA file (buffer-based)
            if (files.gpoa && files.gpoa[0]) {
                const gpoaFile = files.gpoa[0];
                uploadedFiles.gpoa = {
                    originalName: gpoaFile.originalname,
                    size: gpoaFile.size,
                    mimetype: gpoaFile.mimetype
                };
                await insertFile(gpoaFile, 'gpoa');
            }

            // Process Project Proposal file (buffer-based)
            if (files.projectProposal && files.projectProposal[0]) {
                const proposalFile = files.projectProposal[0];
                uploadedFiles.projectProposal = {
                    originalName: proposalFile.originalname,
                    size: proposalFile.size,
                    mimetype: proposalFile.mimetype
                };
                await insertFile(proposalFile, 'projectProposal');
            }

            await createAuditLog(uuid, 'files_uploaded', req.user.id, 'Files uploaded', uploadedFiles);

        } catch (fileProcessingError) {
            console.error('❌ Error processing files:', fileProcessingError);
            console.error('❌ Files object:', files);
            console.error('❌ Files keys:', files ? Object.keys(files) : 'files is null/undefined');

            return res.status(500).json({
                error: 'File processing error',
                message: fileProcessingError.message,
                details: 'Error occurred while processing uploaded files'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Error uploading files:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // Handle multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File size too large. Maximum 10MB allowed.',
                code: 'LIMIT_FILE_SIZE'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files. Maximum 2 files allowed.',
                code: 'LIMIT_FILE_COUNT'
            });
        }
        if (error.message.includes('Only PDF, DOC, and DOCX files are allowed')) {
            return res.status(400).json({
                error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
                code: 'INVALID_FILE_TYPE'
            });
        }

        // Handle database errors
        if (error.code && error.code.startsWith('23')) {
            console.error('Database constraint error:', error);
            return res.status(400).json({
                error: 'Database constraint violation',
                code: 'DB_CONSTRAINT_ERROR',
                details: error.message
            });
        }

        // Handle other errors
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /api/proposals/:uuid/files
 * Get file information for proposal
 */
router.get('/:uuid/files', validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        // Check if proposal exists
        const proposalsResult = await query(
            'SELECT id FROM proposals WHERE uuid = $1',
            [uuid]
        );

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const proposal = proposalsResult.rows[0];

        // Read from proposal_files (new canonical source)
        const pf = await query(
            `SELECT id, file_name, file_type, file_size, file_category, created_at
             FROM proposal_files
             WHERE proposal_id = $1
             ORDER BY created_at DESC, id DESC`,
            [proposal.id]
        );

        res.status(200).json({ success: true, files: pf.rows });

    } catch (error) {
        console.error('Error fetching file info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;