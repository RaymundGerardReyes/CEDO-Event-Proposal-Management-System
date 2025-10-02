const express = require('express');
const router = express.Router();
const { pool, query } = require('../../config/database-postgresql-only');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../../utils/logger');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { upload, handleErrors } = require('./middleware');
const notificationService = require('../../services/notification.service');

// Apply authentication middleware to all proposal routes
router.use(validateToken, validateAdmin);

// ===============================================
// PROPOSAL MANAGEMENT ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/proposals
 * @desc Get all proposals with enhanced filtering, sorting, and pagination
 * @access Private (Admin)
 */
router.get("/", async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page) || 1
        const limit = Number.parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit
        const status = req.query.status
        const search = req.query.search
        const sortField = req.query.sortField || 'submitted_at'
        const sortDirection = req.query.sortDirection || 'desc'
        const type = req.query.type
        const organizationType = req.query.organizationType
        const dateFrom = req.query.dateFrom
        const dateTo = req.query.dateTo
        // const priority = req.query.priority // Column doesn't exist in schema
        // const assignedTo = req.query.assignedTo // Column doesn't exist in schema
        const fileCount = req.query.fileCount
        const uuid = req.query.uuid

        // Build the base query with enhanced filtering
        let sqlQuery = `
                    SELECT p.*,
                           u.name as user_name,
                           u.email as user_email,
                           (SELECT COUNT(*) FROM proposal_files pf WHERE pf.proposal_id = p.id) as file_count
                    FROM proposals p
                    LEFT JOIN users u ON p.user_id = u.id
                `
        let countQuery = "SELECT COUNT(DISTINCT p.id) as total FROM proposals p"

        const queryParams = []
        const countParams = []
        let paramIndex = 1
        const whereConditions = []

        // Add filters
        if (status && status !== "all") {
            whereConditions.push(`p.proposal_status = $${paramIndex}`)
            queryParams.push(status)
            countParams.push(status)
            paramIndex++
        }

        // Add search across multiple fields
        if (search) {
            const searchPattern = `%${search}%`
            whereConditions.push(`(
                p.event_name ILIKE $${paramIndex} OR 
                p.contact_person ILIKE $${paramIndex + 1} OR 
                p.contact_email ILIKE $${paramIndex + 2} OR
                p.organization_name ILIKE $${paramIndex + 3} OR
                p.event_venue ILIKE $${paramIndex + 4}
            )`)
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
            paramIndex += 5
        }

        // Add event type filter
        if (type && type !== "all") {
            whereConditions.push(`p.event_type = $${paramIndex}`)
            queryParams.push(type)
            countParams.push(type)
            paramIndex++
        }

        // Add organization type filter
        if (organizationType && organizationType !== "all") {
            whereConditions.push(`p.organization_type = $${paramIndex}`)
            queryParams.push(organizationType)
            countParams.push(organizationType)
            paramIndex++
        }

        // Add date range filter
        if (dateFrom) {
            whereConditions.push(`p.event_start_date >= $${paramIndex}`)
            queryParams.push(dateFrom)
            countParams.push(dateFrom)
            paramIndex++
        }
        if (dateTo) {
            whereConditions.push(`p.event_start_date <= $${paramIndex}`)
            queryParams.push(dateTo)
            countParams.push(dateTo)
            paramIndex++
        }

        // Priority filter removed - column doesn't exist in schema

        // Assigned to filter removed - column doesn't exist in schema

        // Add UUID filter for focused proposal
        if (uuid) {
            whereConditions.push(`p.uuid = $${paramIndex}`)
            queryParams.push(uuid)
            countParams.push(uuid)
            paramIndex++
        }

        // Apply WHERE conditions
        if (whereConditions.length > 0) {
            const whereClause = " WHERE " + whereConditions.join(" AND ")
            sqlQuery += whereClause
            countQuery += whereClause
        }

        // No GROUP BY needed since we're using CASE for file count

        // Add file count filter
        if (fileCount && fileCount !== "all") {
            sqlQuery += ` AND ((SELECT COUNT(*) FROM proposal_files pf WHERE pf.proposal_id = p.id) = $${queryParams.length + 1})`
            countParams.push(fileCount)
            queryParams.push(fileCount)

            switch (fileCount) {
                case "none":
                    sqlQuery += " = 0"
                    countQuery += " = 0"
                    break
                case "1-3":
                    sqlQuery += " BETWEEN 1 AND 3"
                    countQuery += " BETWEEN 1 AND 3"
                    break
                case "4-6":
                    sqlQuery += " BETWEEN 4 AND 6"
                    countQuery += " BETWEEN 4 AND 6"
                    break
                case "7+":
                    sqlQuery += " >= 7"
                    countQuery += " >= 7"
                    break
            }
        }

        // Add sorting - Map frontend column names to database fields
        const validSortFields = {
            'eventName': 'p.event_name',
            'organization': 'p.organization_name',
            'contact.name': 'p.contact_person',
            'contact.email': 'p.contact_email',
            'status': 'p.proposal_status',
            'date': 'p.event_start_date',
            'type': 'p.organization_type', // Changed from event_type to organization_type as per schema
            'submitted_at': 'p.submitted_at',
            'created_at': 'p.created_at',
            // Legacy support for old field names
            'event_name': 'p.event_name',
            'contact.name': 'p.contact_person'
        }

        const sortColumn = validSortFields[sortField] || 'p.submitted_at'
        const direction = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        sqlQuery += ` ORDER BY ${sortColumn} ${direction}`

        // Add pagination
        sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        queryParams.push(limit, offset)

        // Execute queries
        const proposalsResult = await query(sqlQuery, queryParams)
        const countResult = await query(countQuery, countParams)
        const total = parseInt(countResult.rows[0].total)

        // Calculate pagination metadata
        const pages = Math.ceil(total / limit)
        const pagination = {
            page,
            limit,
            total,
            pages,
            hasPrev: page > 1,
            hasNext: page < pages,
        }

        // Get statistics
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE proposal_status = 'pending') as pending,
                COUNT(*) FILTER (WHERE proposal_status = 'approved') as approved,
                COUNT(*) FILTER (WHERE proposal_status = 'denied') as rejected,
                COUNT(*) FILTER (WHERE proposal_status = 'draft') as draft
            FROM proposals p
            ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
        `, countParams)

        const stats = statsResult.rows[0]

        // Process proposals to match your exact database schema
        const processedProposals = proposalsResult.rows.map((proposal) => {
            const files = []

            // Map file columns from your exact schema
            if (proposal.gpoa_file_name) {
                files.push({
                    id: `gpoa-${proposal.id}`,
                    name: proposal.gpoa_file_name,
                    size: proposal.gpoa_file_size ? `${(proposal.gpoa_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                    type: proposal.gpoa_file_type || 'application/pdf',
                    uploadedBy: proposal.contact_person,
                    uploadedAt: proposal.created_at,
                    fileType: 'gpoa'
                })
            }
            if (proposal.project_proposal_file_name) {
                files.push({
                    id: `project-${proposal.id}`,
                    name: proposal.project_proposal_file_name,
                    size: proposal.project_proposal_file_size ? `${(proposal.project_proposal_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                    type: proposal.project_proposal_file_type || 'application/pdf',
                    uploadedBy: proposal.contact_person,
                    uploadedAt: proposal.created_at,
                    fileType: 'projectProposal'
                })
            }

            // Map directly from your database schema with proper field mapping
            return {
                id: proposal.id,
                uuid: proposal.uuid,
                eventName: proposal.event_name,
                organization: proposal.organization_name,
                organizationType: proposal.organization_type,
                contact: {
                    name: proposal.contact_person,
                    email: proposal.contact_email,
                    phone: proposal.contact_phone
                },
                status: proposal.proposal_status,
                date: proposal.event_start_date,
                // Map type to organization_type as per your schema
                type: proposal.organization_type,
                eventType: proposal.event_type,
                description: proposal.organization_description || proposal.objectives || `Event22: ${proposal.event_name}`,
                location: proposal.event_venue,
                budget: proposal.budget,
                volunteersNeeded: proposal.volunteers_needed,
                attendanceCount: proposal.attendance_count,
                sdpCredits: proposal.sdp_credits,
                // Enhanced date/time information
                startDate: proposal.event_start_date,
                endDate: proposal.event_end_date,
                startTime: proposal.event_start_time,
                endTime: proposal.event_end_time,
                eventMode: proposal.event_mode,
                targetAudience: proposal.target_audience,
                files,
                comments: proposal.admin_comments ? [{
                    id: `comment-${proposal.id}`,
                    author: 'Admin',
                    content: proposal.admin_comments,
                    timestamp: proposal.reviewed_at || proposal.updated_at,
                    type: 'admin'
                }] : [],
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
                submittedAt: proposal.submitted_at,
                reviewedAt: proposal.reviewed_at,
                approvedAt: proposal.approved_at,
                reviewedBy: proposal.reviewed_by_admin_id,
                hasFiles: files.length > 0,
                fileCount: files.length
            }
        })

        res.json({
            success: true,
            proposals: processedProposals,
            pagination,
            stats: {
                total: parseInt(stats.total),
                pending: parseInt(stats.pending),
                approved: parseInt(stats.approved),
                rejected: parseInt(stats.rejected),
                draft: parseInt(stats.draft)
            }
        })
    } catch (error) {
        console.error("❌ Error fetching proposals:", error)
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/stats
 * @desc Get proposal statistics for dashboard
 * @access Private (Admin)
 */
router.get("/stats", async (req, res, next) => {
    try {
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE proposal_status = 'pending') as pending,
                COUNT(*) FILTER (WHERE proposal_status = 'approved') as approved,
                COUNT(*) FILTER (WHERE proposal_status = 'denied') as rejected,
                COUNT(*) FILTER (WHERE proposal_status = 'draft') as draft,
                COUNT(*) FILTER (WHERE reviewed_by_admin_id IS NOT NULL) as reviewed,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent
            FROM proposals
        `)

        const stats = statsResult.rows[0]

        res.json({
            success: true,
            stats: {
                total: parseInt(stats.total),
                pending: parseInt(stats.pending),
                approved: parseInt(stats.approved),
                rejected: parseInt(stats.rejected),
                draft: parseInt(stats.draft),
                reviewed: parseInt(stats.reviewed),
                recent: parseInt(stats.recent)
            }
        })
    } catch (error) {
        console.error("❌ Error fetching proposal stats:", error)
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/suggestions
 * @desc Get search suggestions for autocomplete
 * @access Private (Admin)
 */
router.get("/suggestions", async (req, res, next) => {
    try {
        const { q } = req.query

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                suggestions: []
            })
        }

        const searchPattern = `%${q}%`
        const suggestionsResult = await query(`
            SELECT DISTINCT 
                event_name,
                organization_name,
                contact_person,
                contact_email
            FROM proposals
            WHERE event_name ILIKE $1 
               OR organization_name ILIKE $1 
               OR contact_person ILIKE $1 
               OR contact_email ILIKE $1
            LIMIT 10
        `, [searchPattern])

        const suggestions = suggestionsResult.rows.flatMap(row => [
            row.event_name,
            row.organization_name,
            row.contact_person,
            row.contact_email
        ]).filter((value, index, self) =>
            value && self.indexOf(value) === index
        ).slice(0, 10)

        res.json({
            success: true,
            suggestions
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/export
 * @desc Export proposals in various formats
 * @access Private (Admin)
 */
router.get("/export", async (req, res, next) => {
    try {
        const { format = 'csv', ids } = req.query
        const adminId = req.user.id

        // Get proposals to export
        let sqlQuery = "SELECT * FROM proposals"
        let queryParams = []

        if (ids) {
            const idArray = ids.split(',').map(id => parseInt(id.trim()))
            sqlQuery += " WHERE id = ANY($1)"
            queryParams.push(idArray)
        }

        const proposalsResult = await query(sqlQuery, queryParams)
        const proposals = proposalsResult.rows

        // Generate export data based on format
        let exportData
        let filename
        let contentType

        switch (format.toLowerCase()) {
            case 'csv':
                exportData = generateCSV(proposals)
                filename = `proposals-export-${new Date().toISOString().split('T')[0]}.csv`
                contentType = 'text/csv'
                break
            case 'excel':
                // For Excel, we'll generate CSV for now (can be enhanced with xlsx library)
                exportData = generateCSV(proposals)
                filename = `proposals-export-${new Date().toISOString().split('T')[0]}.xlsx`
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                break
            case 'json':
                exportData = JSON.stringify(proposals, null, 2)
                filename = `proposals-export-${new Date().toISOString().split('T')[0]}.json`
                contentType = 'application/json'
                break
            default:
                return res.status(400).json({
                    success: false,
                    error: "Invalid export format. Supported formats: csv, excel, json",
                })
        }

        // Record export in audit logs
        await query(
            "INSERT INTO audit_logs (user_id, action_type, table_name, additional_info) VALUES ($1, $2, $3, $4)",
            [adminId, 'EXPORT', 'proposals', JSON.stringify({ format, count: proposals.length })]
        )

        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.send(exportData)
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/:id
 * @desc Get a single proposal by ID
 * @access Private (Admin)
 */
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params

        // Check if the parameter is a UUID (36 characters with dashes) or numeric ID
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const isUuid = uuidRegex.test(id);

        let proposalsResult;
        if (isUuid) {
            // Query by UUID
            proposalsResult = await query("SELECT * FROM proposals WHERE uuid = $1", [id])
        } else {
            // Query by numeric ID
            proposalsResult = await query("SELECT * FROM proposals WHERE id = $1", [id])
        }

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = proposalsResult.rows[0]

        // Map file columns from your exact database schema
        const files = []

        if (proposal.gpoa_file_name) {
            files.push({
                id: `gpoa-${proposal.id}`,
                name: proposal.gpoa_file_name,
                size: proposal.gpoa_file_size ? `${(proposal.gpoa_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                type: proposal.gpoa_file_type || 'application/pdf',
                uploadedBy: proposal.contact_person,
                uploadedAt: proposal.created_at,
                fileType: 'gpoa'
            })
        }
        if (proposal.project_proposal_file_name) {
            files.push({
                id: `project-${proposal.id}`,
                name: proposal.project_proposal_file_name,
                size: proposal.project_proposal_file_size ? `${(proposal.project_proposal_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                type: proposal.project_proposal_file_type || 'application/pdf',
                uploadedBy: proposal.contact_person,
                uploadedAt: proposal.created_at,
                fileType: 'projectProposal'
            })
        }

        // Get approval history from audit_logs
        // Use the proposal's numeric ID for audit_logs query (record_id is bigint)
        const historyResult = await query(
            "SELECT * FROM audit_logs WHERE table_name = 'proposals' AND record_id = $1 ORDER BY created_at DESC",
            [proposal.id]
        )

        // Map the proposal data to match frontend expectations
        const mappedProposal = {
            id: proposal.id,
            uuid: proposal.uuid,
            eventName: proposal.event_name,
            organization: proposal.organization_name,
            organizationType: proposal.organization_type,
            organizationDescription: proposal.organization_description,
            contact: {
                name: proposal.contact_person,
                phone: proposal.contact_phone,
                email: proposal.contact_email
            },
            status: proposal.proposal_status,
            type: proposal.organization_type,
            date: proposal.event_start_date,
            startDate: proposal.event_start_date,
            endDate: proposal.event_end_date,
            startTime: proposal.event_start_time,
            endTime: proposal.event_end_time,
            venue: proposal.event_venue,
            eventMode: proposal.event_mode,
            eventType: proposal.event_type,
            targetAudience: proposal.target_audience,
            sdpCredits: proposal.sdp_credits,
            objectives: proposal.objectives,
            budget: proposal.budget,
            volunteersNeeded: proposal.volunteers_needed,
            attendanceCount: proposal.attendance_count,
            adminComments: proposal.admin_comments,
            reviewedBy: proposal.reviewed_by_admin_id,
            reviewedAt: proposal.reviewed_at,
            submittedAt: proposal.submitted_at,
            approvedAt: proposal.approved_at,
            createdAt: proposal.created_at,
            updatedAt: proposal.updated_at,
            // File information
            gpoaFileName: proposal.gpoa_file_name,
            gpoaFileSize: proposal.gpoa_file_size,
            gpoaFileType: proposal.gpoa_file_type,
            gpoaFilePath: proposal.gpoa_file_path,
            projectProposalFileName: proposal.project_proposal_file_name,
            projectProposalFileSize: proposal.project_proposal_file_size,
            projectProposalFileType: proposal.project_proposal_file_type,
            projectProposalFilePath: proposal.project_proposal_file_path,
            files: files,
            history: historyResult.rows,
            fileCount: files.length
        };

        console.log('🔍 Backend file fields debug:', {
            gpoa_file_name: proposal.gpoa_file_name,
            project_proposal_file_name: proposal.project_proposal_file_name,
            gpoaFileName: mappedProposal.gpoaFileName,
            projectProposalFileName: mappedProposal.projectProposalFileName,
            files: mappedProposal.files
        });

        res.json({
            success: true,
            proposal: mappedProposal
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route PATCH /api/admin/proposals/:id/status
 * @desc Update proposal status (approve/deny)
 * @access Private (Admin)
 */
router.patch("/:id/status", async (req, res, next) => {
    try {
        let { id } = req.params
        const { status, adminComments } = req.body
        const adminId = req.user.id // From auth middleware

        // Normalize status (frontend sometimes sends "rejected" instead of "denied")
        const normalizedStatus = (status || '').toLowerCase() === 'rejected' ? 'denied' : (status || '').toLowerCase();

        // Validate status against database ENUM values
        const validStatuses = ["draft", "pending", "approved", "denied", "revision_requested"];
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status value. Must be one of: ${validStatuses.join(", ")}`,
            })
        }

        // If UUID provided, resolve to numeric ID first
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(id)) {
            const lookup = await query("SELECT id FROM proposals WHERE uuid = $1", [id])
            if (lookup.rows.length === 0) {
                return res.status(404).json({ success: false, error: "Proposal not found" })
            }
            id = String(lookup.rows[0].id)
        }

        // Update proposal status using numeric ID
        const updateResult = await query(
            "UPDATE proposals SET proposal_status = $1, admin_comments = $2, reviewed_by_admin_id = $3, reviewed_at = CURRENT_TIMESTAMP WHERE id = $4",
            [normalizedStatus, adminComments || null, adminId, id]
        )

        if (updateResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Record status change in history
        await query(
            "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values) VALUES ($1, $2, $3, $4, $5)",
            [adminId, 'UPDATE', 'proposals', id, JSON.stringify({ status: normalizedStatus, admin_comments: adminComments || null })]
        )

        // Get proposal details for notifications
        const proposalResult = await query(
            "SELECT user_id, event_name, contact_person, organization_type, uuid FROM proposals WHERE id = $1",
            [id]
        )

        if (proposalResult.rows.length > 0) {
            const proposal = proposalResult.rows[0];
            const proposalData = {
                event_name: proposal.event_name,
                contact_person: proposal.contact_person,
                organization_type: proposal.organization_type
            };

            // Create notification for the user
            try {
                if (normalizedStatus === "approved") {
                    await notificationService.createProposalApprovedNotification({
                        proposalId: id,
                        proposalUuid: proposal.uuid,
                        recipientId: proposal.user_id,
                        proposalData,
                        senderId: adminId
                    });
                    console.log(`✅ Created approval notification for user ${proposal.user_id}`);
                } else if (normalizedStatus === "denied") {
                    await notificationService.createProposalRejectedNotification({
                        proposalId: id,
                        proposalUuid: proposal.uuid,
                        recipientId: proposal.user_id,
                        proposalData,
                        adminComments,
                        senderId: adminId
                    });
                    console.log(`✅ Created rejection notification for user ${proposal.user_id}`);
                }
            } catch (notificationError) {
                console.warn('⚠️ Failed to create notification:', notificationError.message);
                // Don't fail the entire operation if notification creation fails
            }

            // If approved, update user credits if applicable
            if (normalizedStatus === "approved") {
                const proposalsResult = await query("SELECT user_id, event_type, sdp_credits FROM proposals WHERE id = $1", [id])

                if (proposalsResult.rows.length > 0 && proposalsResult.rows[0].user_id && proposalsResult.rows[0].sdp_credits) {
                    // Note: This would need a credits table or user credits field to be implemented
                    console.log(`Proposal approved for user ${proposalsResult.rows[0].user_id} with ${proposalsResult.rows[0].sdp_credits} credits`)
                }
            }
        }

        res.json({
            success: true,
            message: `Proposal ${normalizedStatus} successfully`,
            proposalId: id,
            status: normalizedStatus,
        })
    } catch (error) {
        console.error("❌ Error updating proposal status:", error)
        next(error)
    }
})

/**
 * @route POST /api/admin/proposals/:id/comment
 * @desc Add admin comment to a proposal
 * @access Private (Admin)
 */
router.post("/:id/comment", async (req, res, next) => {
    try {
        let { id } = req.params
        const { comment } = req.body
        const adminId = req.user.id // From auth middleware

        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Comment cannot be empty",
            })
        }

        // If UUID provided, resolve to numeric ID first
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        let proposalUuid = null;
        if (uuidRegex.test(id)) {
            const lookup = await query("SELECT id, uuid, user_id, event_name FROM proposals WHERE uuid = $1", [id])
            if (lookup.rows.length === 0) {
                return res.status(404).json({ success: false, error: "Proposal not found" })
            }
            proposalUuid = lookup.rows[0].uuid
            id = String(lookup.rows[0].id)
        } else {
            const lookup = await query("SELECT uuid, user_id, event_name FROM proposals WHERE id = $1", [id])
            if (lookup.rows.length > 0) {
                proposalUuid = lookup.rows[0].uuid
            }
        }

        // Add comment to proposal
        const updateResult = await query(
            'UPDATE proposals SET admin_comments = COALESCE(admin_comments, \'\') || $1 || E\'\\n\' WHERE id = $2',
            [`[${new Date().toISOString()}] ${comment} `, id]
        )

        if (updateResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Record comment in history
        await query(
            "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values) VALUES ($1, $2, $3, $4, $5)",
            [adminId, 'UPDATE', 'proposals', id, JSON.stringify({ admin_comments: comment })]
        )

        // Try to notify the proposal owner about the new admin comment
        try {
            const p = await query("SELECT user_id, event_name FROM proposals WHERE id = $1", [id])
            if (p.rows.length > 0) {
                const { user_id, event_name } = p.rows[0]
                await notificationService.createNotification({
                    targetType: 'user',
                    targetUserId: user_id,
                    title: 'New admin comment on your proposal',
                    message: `An administrator commented on "${event_name}"`,
                    notificationType: 'proposal_comment',
                    priority: 'normal',
                    relatedProposalId: parseInt(id, 10),
                    relatedUserId: user_id,
                    metadata: { proposalUuid: proposalUuid, adminComment: comment },
                    tags: ['proposal', 'comment'],
                    createdBy: adminId
                })
            }
        } catch (notifyErr) {
            console.warn('⚠️ Failed to create comment notification:', notifyErr.message)
        }

        res.json({
            success: true,
            message: "Comment added successfully",
            proposalId: id,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/:idOrUuid/download/:fileType
 * @desc Download a proposal file (supports numeric ID or UUID)
 * @access Private (Admin)
 */
router.get("/:id/download/:fileType", async (req, res, next) => {
    try {
        const { id, fileType } = req.params

        // Detect UUID vs numeric ID
        const isUuid = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)

        // Get proposal id using appropriate identifier (new schema has no legacy file columns)
        const files = await query(
            `SELECT id FROM proposals WHERE ${isUuid ? 'uuid = $1' : 'id = $1'}`,
            [id],
        )

        if (files.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = files.rows[0]
        let fileName = null
        let filePath = null

        let servedFrom = 'filesystem'

        // Try filesystem first when we have a path
        if (filePath && fileName) {
            try {
                await fs.access(filePath)
            } catch (error) {
                filePath = null
            }
        }

        // If no valid filesystem path, fallback to proposal_files (bytea)
        let dbFileRow = null
        if (!filePath) {
            // Map incoming fileType to file_category candidates
            const categoryCandidates = fileType === 'gpoa'
                ? ['gpoa', 'gpoa_file', 'general plans of action']
                : ['project', 'proposal', 'projectproposal', 'project_proposal', 'pp']

            // Try exact/ANY match first
            const result = await query(
                `SELECT id, file_name, file_type, file_size, file_category, file_data
                 FROM proposal_files
                 WHERE proposal_id = $1 AND (
                    file_category IS NULL OR LOWER(file_category) = ANY($2)
                 )
                 ORDER BY id DESC
                 LIMIT 1`,
                [proposal.id, categoryCandidates.map(c => c.toLowerCase())]
            )

            if (result.rows.length === 0) {
                // Try pattern match (ILIKE) to be more flexible
                const likePattern = fileType === 'gpoa' ? '%gpoa%' : '%project%'
                const likeRes = await query(
                    `SELECT id, file_name, file_type, file_size, file_category, file_data
                     FROM proposal_files
                     WHERE proposal_id = $1 AND (file_category ILIKE $2)
                     ORDER BY id DESC
                     LIMIT 1`,
                    [proposal.id, likePattern]
                )
                if (likeRes.rows.length > 0) {
                    dbFileRow = likeRes.rows[0]
                }
            } else {
                dbFileRow = result.rows[0]
            }

            if (!dbFileRow) {
                // As a last resort, get the latest file for this proposal regardless of category
                const anyResult = await query(
                    `SELECT id, file_name, file_type, file_size, file_category, file_data
                     FROM proposal_files
                     WHERE proposal_id = $1
                     ORDER BY id DESC
                     LIMIT 1`,
                    [proposal.id]
                )
                if (anyResult.rows.length > 0) {
                    dbFileRow = anyResult.rows[0]
                }
            }

            if (dbFileRow) {
                fileName = dbFileRow.file_name || fileName || `${fileType}.dat`
                servedFrom = 'database'
            }
        }

        if (!filePath && !dbFileRow) {
            // Return available categories to aid debugging
            const cats = await query(
                `SELECT file_category, COUNT(*) as count
                 FROM proposal_files
                 WHERE proposal_id = $1
                 GROUP BY file_category
                 ORDER BY count DESC`,
                [proposal.id]
            )
            return res.status(404).json({ success: false, error: "File not found on server", categories: cats.rows })
        }

        // Log download
        await query(
            "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, additional_info) VALUES ($1, $2, $3, $4, $5)",
            [req.user.id, 'VIEW', 'proposals', proposal.id, JSON.stringify({ file_type: fileType, action: 'download', source: servedFrom })]
        )

        // Send file from filesystem or database
        if (servedFrom === 'filesystem' && filePath) {
            return res.download(filePath, fileName)
        }

        // From database bytea
        const dataBuffer = dbFileRow.file_data
        const mimeType = dbFileRow.file_type || 'application/octet-stream'

        // Ensure filename has proper extension based on mime if missing
        const hasExt = typeof fileName === 'string' && /\.[a-zA-Z0-9]{2,6}$/.test(fileName)
        let finalName = fileName || `${fileType}`
        if (!hasExt) {
            const ext = (mime => {
                if (!mime) return 'dat'
                const m = mime.toLowerCase()
                if (m.includes('pdf')) return 'pdf'
                if (m.includes('wordprocessingml.document')) return 'docx'
                if (m.includes('msword')) return 'doc'
                if (m.includes('png')) return 'png'
                if (m.includes('jpeg')) return 'jpg'
                return 'dat'
            })(mimeType)
            // Avoid duplicate extension
            finalName = /\.[a-zA-Z0-9]{2,6}$/.test(finalName) ? finalName : `${finalName}.${ext}`
        }

        res.setHeader('Content-Type', mimeType)
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalName)}"`)
        return res.send(dataBuffer)
    } catch (error) {
        next(error)
    }
})

/**
 * @route GET /api/admin/proposals/:id/files
 * @desc Debug helper: list file records for a proposal (legacy + proposal_files)
 * @access Private (Admin)
 */
router.get("/:id/files", async (req, res, next) => {
    try {
        const { id } = req.params
        const isUuid = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)
        const base = await query(
            `SELECT id, uuid, gpoa_file_name, gpoa_file_path, project_proposal_file_name, project_proposal_file_path
             FROM proposals WHERE ${isUuid ? 'uuid = $1' : 'id = $1'}`,
            [id]
        )
        if (base.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Proposal not found' })
        }
        const proposal = base.rows[0]
        const pf = await query(
            `SELECT id, file_name, file_type, file_size, file_category
             FROM proposal_files WHERE proposal_id = $1 ORDER BY id DESC LIMIT 10`,
            [proposal.id]
        )
        res.json({ success: true, proposal, proposal_files: pf.rows })
    } catch (error) {
        next(error)
    }
})

/**
 * @route POST /api/admin/proposals/:id/files
 * @desc Upload files for a proposal
 * @access Private (Admin)
 */
router.post("/:id/files", upload.array("files", 5), async (req, res, next) => {
    try {
        const { id } = req.params
        const { fileTypes } = req.body

        if (!req.files || req.files.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded",
            })
        }

        if (!fileTypes || typeof fileTypes !== "string") {
            return res.status(400).json({
                success: false,
                error: "File types must be provided",
            })
        }

        const fileTypeArray = fileTypes.split(",")

        if (fileTypeArray.length !== req.files.length) {
            return res.status(400).json({
                success: false,
                error: "File types count must match uploaded files count",
            })
        }

        // Check if proposal exists
        const proposalsResult = await query("SELECT id FROM proposals WHERE id = $1", [id])

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        // Save file information to database using your exact schema
        const fileTypeMap = {
            'gpoa': { name: 'gpoa_file_name', path: 'gpoa_file_path', size: 'gpoa_file_size', type: 'gpoa_file_type' },
            'projectProposal': { name: 'project_proposal_file_name', path: 'project_proposal_file_path', size: 'project_proposal_file_size', type: 'project_proposal_file_type' }
        }

        const updatePromises = req.files.map((file, index) => {
            const type = fileTypeArray[index]
            const mapping = fileTypeMap[type]
            if (!mapping) return Promise.resolve()
            return query(
                `UPDATE proposals SET \
                    ${mapping.name} = $1, \
                    ${mapping.path} = $2 \
                 WHERE id = $3`,
                [file.originalname, file.path, id]
            )
        })

        await Promise.all(updatePromises)

        res.json({
            success: true,
            message: "Files uploaded successfully",
            files: req.files.map((file, index) => ({
                name: file.originalname,
                type: fileTypeArray[index],
                size: file.size,
            })),
        })
    } catch (error) {
        // Clean up uploaded files if there was an error
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path)
                } catch (unlinkError) {
                    logger.error(`Failed to delete file ${file.path}: `, unlinkError)
                }
            }
        }
        next(error)
    }
})

/**
 * @route DELETE /api/admin/proposals/:id/files/:fileType
 * @desc Delete a proposal file
 * @access Private (Admin)
 */
router.delete("/:id/files/:fileType", async (req, res, next) => {
    try {
        const { id, fileType } = req.params

        // Get file information from proposals table
        const files = await query(
            `SELECT 
                gpoa_file_name, gpoa_file_path,
                project_proposal_file_name, project_proposal_file_path
            FROM proposals WHERE id = $1`,
            [id],
        )

        if (files.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = files.rows[0]
        const fileTypeMap = {
            'gpoa': { name: 'gpoa_file_name', path: 'gpoa_file_path' },
            'projectProposal': { name: 'project_proposal_file_name', path: 'project_proposal_file_path' }
        }
        const mapping = fileTypeMap[fileType]
        if (!mapping) {
            return res.status(400).json({ success: false, error: "Invalid file type" })
        }
        const fileName = proposal[mapping.name]
        const filePath = proposal[mapping.path]
        if (!fileName || !filePath) {
            return res.status(404).json({ success: false, error: "File not found" })
        }
        // Delete file from storage
        try {
            await fs.unlink(filePath)
        } catch (error) {
            logger.error(`Failed to delete file ${filePath}: `, error)
        }
        // Remove file info from proposals table
        await query(
            `UPDATE proposals SET \
                ${mapping.name} = NULL, \
                ${mapping.path} = NULL, \
                updated_at = CURRENT_TIMESTAMP \
             WHERE id = $1`,
            [id]
        )
        res.json({ success: true, message: "File deleted successfully" })
    } catch (error) {
        next(error)
    }
})

/**
 * @route PATCH /api/admin/proposals/bulk-status
 * @desc Bulk update proposal statuses
 * @access Private (Admin)
 */
router.patch("/bulk-status", async (req, res, next) => {
    try {
        const { ids, status, adminComments } = req.body
        const adminId = req.user.id

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Proposal IDs are required",
            })
        }

        // Normalize status
        const normalizedStatus = (status || '').toLowerCase() === 'rejected' ? 'denied' : (status || '').toLowerCase();
        const validStatuses = ["draft", "pending", "approved", "denied", "revision_requested"];
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status value. Must be one of: ${validStatuses.join(", ")}`,
            })
        }

        // Update proposals
        const updateResult = await query(
            `UPDATE proposals 
             SET proposal_status = $1, 
                 admin_comments = $2, 
                 reviewed_by_admin_id = $3, 
                 reviewed_at = CURRENT_TIMESTAMP 
             WHERE id = ANY($4)`,
            [normalizedStatus, adminComments || null, adminId, ids]
        )

        // Record in audit logs
        for (const id of ids) {
            await query(
                "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values) VALUES ($1, $2, $3, $4, $5)",
                [adminId, 'UPDATE', 'proposals', id, JSON.stringify({ status: normalizedStatus, admin_comments: adminComments || null, bulk_operation: true })]
            )
        }

        // Get updated proposals for response
        const proposalsResult = await query(
            "SELECT * FROM proposals WHERE id = ANY($1)",
            [ids]
        )

        res.json({
            success: true,
            message: `Successfully updated ${updateResult.rowCount} proposals`,
            results: proposalsResult.rows,
            updatedCount: updateResult.rowCount
        })
    } catch (error) {
        console.error("❌ Error bulk updating proposals:", error)
        next(error)
    }
})


// Assignment route removed - assigned_to column doesn't exist in schema

// Priority route removed - priority column doesn't exist in schema


/**
 * Helper function to generate CSV data
 */
function generateCSV(proposals) {
    if (proposals.length === 0) return ''

    const headers = [
        'ID', 'Event Name', 'Organization', 'Contact Person', 'Contact Email',
        'Status', 'Event Date', 'Event Type', 'Created At'
    ]

    const rows = proposals.map(proposal => [
        proposal.id,
        proposal.event_name || '',
        proposal.organization_name || '',
        proposal.contact_person || '',
        proposal.contact_email || '',
        proposal.proposal_status || '',
        proposal.event_start_date || '',
        proposal.event_type || '',
        proposal.created_at || ''
    ])

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n')

    return csvContent
}

/**
 * @route GET /api/admin/proposals/:uuid
 * @desc Get single proposal by UUID (fetch only, no generation)
 * @access Private (Admin)
 */
router.get("/:uuid", async (req, res, next) => {
    try {
        const { uuid } = req.params;

        // Validate UUID format (36-char standard UUID)
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(uuid)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID format'
            });
        }

        // Query to get proposal by UUID
        const sqlQuery = `
            SELECT p.*, 
                   u.name as user_name,
                   u.email as user_email,
                   CASE 
                       WHEN p.gpoa_file_name IS NOT NULL AND p.project_proposal_file_name IS NOT NULL THEN 2
                       WHEN p.gpoa_file_name IS NOT NULL OR p.project_proposal_file_name IS NOT NULL THEN 1
                       ELSE 0
                   END as file_count
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.uuid = $1 AND p.is_deleted = false
        `;

        const result = await query(sqlQuery, [uuid]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        const proposal = result.rows[0];

        // Map directly from your database schema with proper field mapping
        const mappedProposal = {
            id: proposal.id,
            uuid: proposal.uuid,
            eventName: proposal.event_name,
            organization: proposal.organization_name,
            organizationType: proposal.organization_type,
            contact: {
                name: proposal.contact_person,
                email: proposal.contact_email,
                phone: proposal.contact_phone
            },
            status: proposal.proposal_status,
            date: proposal.event_start_date,
            startDate: proposal.event_start_date,
            endDate: proposal.event_end_date,
            startTime: proposal.event_start_time,
            endTime: proposal.event_end_time,
            type: proposal.organization_type,
            eventType: proposal.event_type,
            eventMode: proposal.event_mode,
            venue: proposal.event_venue,
            createdAt: proposal.created_at,
            updatedAt: proposal.updated_at,
            submittedAt: proposal.submitted_at,
            approvedAt: proposal.approved_at,
            reviewedAt: proposal.reviewed_at,
            description: proposal.objectives,
            budget: proposal.budget,
            volunteersNeeded: proposal.volunteers_needed,
            attendanceCount: proposal.attendance_count,
            sdpCredits: proposal.sdp_credits,
            targetAudience: proposal.target_audience,
            adminComments: proposal.admin_comments,
            user: {
                name: proposal.user_name,
                email: proposal.user_email
            },
            files: {
                gpoa: proposal.gpoa_file_name ? {
                    name: proposal.gpoa_file_name,
                    size: proposal.gpoa_file_size,
                    type: proposal.gpoa_file_type,
                    path: proposal.gpoa_file_path
                } : null,
                projectProposal: proposal.project_proposal_file_name ? {
                    name: proposal.project_proposal_file_name,
                    size: proposal.project_proposal_file_size,
                    type: proposal.project_proposal_file_type,
                    path: proposal.project_proposal_file_path
                } : null
            },
            fileCount: proposal.file_count
        };

        res.json({
            success: true,
            proposal: mappedProposal
        });

    } catch (error) {
        logger.error('Error fetching proposal by UUID:', error);
        next(error);
    }
});

// Apply error handler to all routes
router.use(handleErrors);

module.exports = router; 