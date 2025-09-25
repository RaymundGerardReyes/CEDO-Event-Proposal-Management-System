const express = require('express');
const router = express.Router();
const { pool, query } = require('../../config/database-postgresql-only');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../../utils/logger');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { upload, handleErrors } = require('./middleware');

// Apply authentication middleware to all proposal routes
router.use(validateToken, validateAdmin);

// ===============================================
// PROPOSAL MANAGEMENT ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/proposals
 * @desc Get all proposals with pagination, filtering and search
 * @access Private (Admin)
 */
router.get("/", async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page) || 1
        const limit = Number.parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit
        const status = req.query.status
        const search = req.query.search

        // Build the base query
        let sqlQuery = "SELECT * FROM proposals"
        let countQuery = "SELECT COUNT(*) as total FROM proposals"
        const queryParams = []
        const countParams = []

        // Add filters
        if (status && status !== "all") {
            sqlQuery += " WHERE proposal_status = $1"
            countQuery += " WHERE proposal_status = $1"
            queryParams.push(status)
            countParams.push(status)
        }

        // Add search
        if (search) {
            const searchClause = status && status !== "all" ? " AND" : " WHERE"
            const searchPattern = `%${search}%`

            if (status && status !== "all") {
                sqlQuery += `${searchClause}(event_name LIKE $2 OR contact_person LIKE $3 OR event_venue LIKE $4)`
                countQuery += `${searchClause}(event_name LIKE $2 OR contact_person LIKE $3 OR event_venue LIKE $4)`
            } else {
                sqlQuery += `${searchClause}(event_name LIKE $1 OR contact_person LIKE $2 OR event_venue LIKE $3)`
                countQuery += `${searchClause}(event_name LIKE $1 OR contact_person LIKE $2 OR event_venue LIKE $3)`
            }

            queryParams.push(searchPattern, searchPattern, searchPattern)
            countParams.push(searchPattern, searchPattern, searchPattern)
        }

        // Add sorting (use correct column name)
        sqlQuery += " ORDER BY COALESCE(submitted_at, created_at) DESC"

        // Add pagination
        if (status && status !== "all" && search) {
            sqlQuery += " LIMIT $" + (queryParams.length + 1) + " OFFSET $" + (queryParams.length + 2)
        } else if (status && status !== "all" || search) {
            sqlQuery += " LIMIT $" + (queryParams.length + 1) + " OFFSET $" + (queryParams.length + 2)
        } else {
            sqlQuery += " LIMIT $1 OFFSET $2"
        }
        queryParams.push(limit, offset)

        // Execute queries with connection pooling
        const proposalsResult = await query(sqlQuery, queryParams)
        const countResult = await query(countQuery, countParams)
        const total = countResult.rows[0].total

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

        // Process proposals to include file information
        const processedProposals = proposalsResult.rows.map((proposal) => {
            // Map file columns from database to file object structure
            const files = {}

            if (proposal.school_gpoa_file_name) {
                files.school_gpoa = {
                    name: proposal.school_gpoa_file_name,
                    path: proposal.school_gpoa_file_path
                }
            }
            if (proposal.school_proposal_file_name) {
                files.school_proposal = {
                    name: proposal.school_proposal_file_name,
                    path: proposal.school_proposal_file_path
                }
            }
            if (proposal.community_gpoa_file_name) {
                files.community_gpoa = {
                    name: proposal.community_gpoa_file_name,
                    path: proposal.community_gpoa_file_path
                }
            }
            if (proposal.community_proposal_file_name) {
                files.community_proposal = {
                    name: proposal.community_proposal_file_name,
                    path: proposal.community_proposal_file_path
                }
            }
            if (proposal.accomplishment_report_file_name) {
                files.accomplishment_report = {
                    name: proposal.accomplishment_report_file_name,
                    path: proposal.accomplishment_report_file_path
                }
            }
            if (proposal.pre_registration_file_name) {
                files.pre_registration = {
                    name: proposal.pre_registration_file_name,
                    path: proposal.pre_registration_file_path
                }
            }
            if (proposal.final_attendance_file_name) {
                files.final_attendance = {
                    name: proposal.final_attendance_file_name,
                    path: proposal.final_attendance_file_path
                }
            }

            return {
                ...proposal,
                files
            }
        })

        res.json({
            success: true,
            proposals: processedProposals,
            pagination,
        })
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

        // Get proposal details
        const proposalsResult = await query("SELECT * FROM proposals WHERE id = $1", [id])

        if (proposalsResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = proposalsResult.rows[0]

        // Map file columns to file object structure (same as above)
        const files = {}

        if (proposal.school_gpoa_file_name) {
            files.school_gpoa = {
                name: proposal.school_gpoa_file_name,
                path: proposal.school_gpoa_file_path
            }
        }
        if (proposal.school_proposal_file_name) {
            files.school_proposal = {
                name: proposal.school_proposal_file_name,
                path: proposal.school_proposal_file_path
            }
        }
        if (proposal.community_gpoa_file_name) {
            files.community_gpoa = {
                name: proposal.community_gpoa_file_name,
                path: proposal.community_gpoa_file_path
            }
        }
        if (proposal.community_proposal_file_name) {
            files.community_proposal = {
                name: proposal.community_proposal_file_name,
                path: proposal.community_proposal_file_path
            }
        }
        if (proposal.accomplishment_report_file_name) {
            files.accomplishment_report = {
                name: proposal.accomplishment_report_file_name,
                path: proposal.accomplishment_report_file_path
            }
        }
        if (proposal.pre_registration_file_name) {
            files.pre_registration = {
                name: proposal.pre_registration_file_name,
                path: proposal.pre_registration_file_path
            }
        }
        if (proposal.final_attendance_file_name) {
            files.final_attendance = {
                name: proposal.final_attendance_file_name,
                path: proposal.final_attendance_file_path
            }
        }

        // Get approval history from audit_logs
        const historyResult = await query(
            "SELECT * FROM audit_logs WHERE table_name = 'proposals' AND record_id = $1 ORDER BY created_at DESC",
            [id]
        )

        res.json({
            success: true,
            proposal: {
                ...proposal,
                files,
                history: historyResult.rows,
            },
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
        const { id } = req.params
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

        // Update proposal status
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

        // If approved, update user credits if applicable
        if (normalizedStatus === "approved") {
            const proposalsResult = await query("SELECT user_id, event_type, sdp_credits FROM proposals WHERE id = $1", [id])

            if (proposalsResult.rows.length > 0 && proposalsResult.rows[0].user_id && proposalsResult.rows[0].sdp_credits) {
                // Note: This would need a credits table or user credits field to be implemented
                console.log(`Proposal approved for user ${proposalsResult.rows[0].user_id} with ${proposalsResult.rows[0].sdp_credits} credits`)
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
        const { id } = req.params
        const { comment } = req.body
        const adminId = req.user.id // From auth middleware

        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Comment cannot be empty",
            })
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
 * @route GET /api/admin/proposals/:id/download/:fileType
 * @desc Download a proposal file
 * @access Private (Admin)
 */
router.get("/:id/download/:fileType", async (req, res, next) => {
    try {
        const { id, fileType } = req.params

        // Get file information from proposals table
        const [files] = await pool.query(
            `SELECT 
                school_gpoa_file_name, school_gpoa_file_path,
                school_proposal_file_name, school_proposal_file_path,
                community_gpoa_file_name, community_gpoa_file_path,
                community_proposal_file_name, community_proposal_file_path,
                accomplishment_report_file_name, accomplishment_report_file_path,
                pre_registration_file_name, pre_registration_file_path,
                final_attendance_file_name, final_attendance_file_path
            FROM proposals WHERE id = ?`,
            [id],
        )

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = files[0]
        let fileName = null
        let filePath = null

        // Map fileType to the correct column names
        const fileTypeMap = {
            'school_gpoa': { name: proposal.school_gpoa_file_name, path: proposal.school_gpoa_file_path },
            'school_proposal': { name: proposal.school_proposal_file_name, path: proposal.school_proposal_file_path },
            'community_gpoa': { name: proposal.community_gpoa_file_name, path: proposal.community_gpoa_file_path },
            'community_proposal': { name: proposal.community_proposal_file_name, path: proposal.community_proposal_file_path },
            'accomplishment_report': { name: proposal.accomplishment_report_file_name, path: proposal.accomplishment_report_file_path },
            'pre_registration': { name: proposal.pre_registration_file_name, path: proposal.pre_registration_file_path },
            'final_attendance': { name: proposal.final_attendance_file_name, path: proposal.final_attendance_file_path }
        }

        const fileInfo = fileTypeMap[fileType]
        if (!fileInfo || !fileInfo.name || !fileInfo.path) {
            return res.status(404).json({
                success: false,
                error: "File not found",
            })
        }

        fileName = fileInfo.name
        filePath = fileInfo.path

        // Check if file exists
        try {
            await fs.access(filePath)
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: "File not found on server",
            })
        }

        // Log download
        await query(
            "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, additional_info) VALUES ($1, $2, $3, $4, $5)",
            [req.user.id, 'VIEW', 'proposals', id, JSON.stringify({ file_type: fileType, action: 'download' })]
        )

        // Send file
        res.download(filePath, fileName)
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

        if (!req.files || req.files.length === 0) {
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

        // Save file information to database
        const fileTypeMap = {
            'school_gpoa': { name: 'school_gpoa_file_name', path: 'school_gpoa_file_path' },
            'school_proposal': { name: 'school_proposal_file_name', path: 'school_proposal_file_path' },
            'community_gpoa': { name: 'community_gpoa_file_name', path: 'community_gpoa_file_path' },
            'community_proposal': { name: 'community_proposal_file_name', path: 'community_proposal_file_path' },
            'accomplishment_report': { name: 'accomplishment_report_file_name', path: 'accomplishment_report_file_path' },
            'pre_registration': { name: 'pre_registration_file_name', path: 'pre_registration_file_path' },
            'final_attendance': { name: 'final_attendance_file_name', path: 'final_attendance_file_path' }
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
        const [files] = await pool.query(
            `SELECT 
                school_gpoa_file_name, school_gpoa_file_path,
                school_proposal_file_name, school_proposal_file_path,
                community_gpoa_file_name, community_gpoa_file_path,
                community_proposal_file_name, community_proposal_file_path,
                accomplishment_report_file_name, accomplishment_report_file_path,
                pre_registration_file_name, pre_registration_file_path,
                final_attendance_file_name, final_attendance_file_path
            FROM proposals WHERE id = ?`,
            [id],
        )

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proposal not found",
            })
        }

        const proposal = files[0]
        const fileTypeMap = {
            'school_gpoa': { name: 'school_gpoa_file_name', path: 'school_gpoa_file_path' },
            'school_proposal': { name: 'school_proposal_file_name', path: 'school_proposal_file_path' },
            'community_gpoa': { name: 'community_gpoa_file_name', path: 'community_gpoa_file_path' },
            'community_proposal': { name: 'community_proposal_file_name', path: 'community_proposal_file_path' },
            'accomplishment_report': { name: 'accomplishment_report_file_name', path: 'accomplishment_report_file_path' },
            'pre_registration': { name: 'pre_registration_file_name', path: 'pre_registration_file_path' },
            'final_attendance': { name: 'final_attendance_file_name', path: 'final_attendance_file_path' }
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
        await pool.query(
            `UPDATE proposals SET \
                ${mapping.name} = NULL, \
                ${mapping.path} = NULL, \
                updated_at = NOW() \
             WHERE id = ?`,
            [id]
        )
        res.json({ success: true, message: "File deleted successfully" })
    } catch (error) {
        next(error)
    }
})

// Apply error handler to all routes
router.use(handleErrors);

module.exports = router; 