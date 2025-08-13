/**
 * =============================================
 * MYSQL-ONLY REPORTS ROUTES
 * =============================================
 * 
 * This module handles reporting operations using only MySQL database.
 * MongoDB is optional and used only when available.
 * MySQL is the primary data source and is independent.
 * 
 * @module routes/mongodb-unified/mysql-reports
 * @author CEDO Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// =============================================
// MYSQL-ONLY DATABASE CONNECTION & AUTH
// =============================================

/**
 * MySQL database connection pool (primary data source)
 * @type {Object}
 */
const { pool } = require('../../config/db');

/**
 * Authentication middleware for protected routes
 * @type {Function}
 */
const { validateToken } = require('../../middleware/auth-optimized');

// =============================================
// DEBUGGING MIDDLEWARE
// =============================================

// Log all requests to the reports router
router.use((req, res, next) => {
    console.log('📊 MYSQL REPORTS ROUTER: Request received:', {
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
    });
    next();
});

// =============================================
// SIMPLE TEST ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/mysql-test
 * @desc Test endpoint to verify MySQL-only backend connectivity
 * @access Public
 */
router.get('/mysql-test', (req, res) => {
    console.log('🧪 MYSQL TEST: Test endpoint called successfully!');
    res.json({
        success: true,
        message: 'MySQL-only reporting backend is working',
        timestamp: new Date().toISOString(),
        database: 'MySQL only (MongoDB optional)',
        routes_registered: 'YES',
        endpoints: {
            mysql_test: 'GET /api/mongodb-unified/mysql-test',
            mysql_health: 'GET /api/mongodb-unified/mysql-health',
            student_proposal: 'GET /api/mongodb-unified/student-proposal/:id',
            user_proposals: 'GET /api/mongodb-unified/user-proposals'
        }
    });
});

/**
 * @route GET /api/mongodb-unified/mysql-health
 * @desc Health check endpoint for MySQL-only reports service
 * @access Public
 */
router.get('/mysql-health', async (req, res) => {
    console.log('🏥 MYSQL HEALTH: Health check called successfully!');

    try {
        // Test MySQL connection only
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        res.json({
            success: true,
            message: 'MySQL reports service is healthy',
            timestamp: new Date().toISOString(),
            services: {
                mysql: 'connected',
                mongodb: 'optional (not required)'
            }
        });
    } catch (error) {
        console.error('❌ MYSQL HEALTH: Health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'MySQL reports service is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================
// DRAFT ID LOOKUP ENDPOINT (MYSQL ONLY)
// =============================================

/**
 * @route GET /api/mongodb-unified/find-proposal-by-draftid/:draftId
 * @desc Find proposal by MongoDB draftId for a specific user
 * @access Public (Student)
 * 
 * @param {string} draftId - MongoDB draftId to search for
 * @returns {Object} Proposal status if found, or suggestions if not found
 */
router.get('/find-proposal-by-draftid/:draftId', validateToken, async (req, res) => {
    const draftId = req.params.draftId;
    const user = req.user;

    console.log('🔍 DRAFT ID LOOKUP: Searching for draftId:', draftId, 'for user:', user?.id);

    let connection;
    try {
        connection = await pool.getConnection();

        // STEP 1: Try to find any proposal that might match this draftId
        // Since MongoDB draftId doesn't directly map to MySQL, we'll search user's proposals
        const [userProposals] = await connection.query(
            'SELECT * FROM proposals WHERE user_id = ? ORDER BY created_at DESC',
            [user.id]
        );

        console.log('🔍 DRAFT ID LOOKUP: Found', userProposals.length, 'proposals for user', user.id);

        if (userProposals.length === 0) {
            return res.json({
                success: false,
                error: 'No proposals found for current user',
                draftId: draftId,
                suggestions: {
                    message: 'No proposals exist for your account. Please submit a proposal first.',
                    action: 'redirect_to_submit'
                }
            });
        }

        // STEP 2: If only one proposal exists, assume it's the one they want
        if (userProposals.length === 1) {
            const proposal = userProposals[0];
            console.log('🔍 DRAFT ID LOOKUP: Single proposal found, returning it:', proposal.uuid);

            return res.json({
                success: true,
                proposal: {
                    id: proposal.id,
                    uuid: proposal.uuid,
                    mysql_id: proposal.id,
                    proposal_status: proposal.proposal_status,
                    status: proposal.proposal_status,
                    report_status: proposal.report_status,
                    admin_comments: proposal.admin_comments,
                    adminComments: proposal.admin_comments,
                    event_name: proposal.event_name,
                    organization_name: proposal.organization_name,
                    created_at: proposal.created_at,
                    updated_at: proposal.updated_at
                },
                meta: {
                    searched_draftid: draftId,
                    found_by: 'single_user_proposal',
                    mysql_id: proposal.id,
                    message: 'Returned the only proposal for this user'
                }
            });
        }

        // STEP 3: Multiple proposals - return the most recent one or let user choose
        const latestProposal = userProposals[0]; // Already ordered by created_at DESC

        return res.json({
            success: true,
            proposal: {
                id: latestProposal.id,
                uuid: latestProposal.uuid,
                mysql_id: latestProposal.id,
                proposal_status: latestProposal.proposal_status,
                status: latestProposal.proposal_status,
                report_status: latestProposal.report_status,
                admin_comments: latestProposal.admin_comments,
                adminComments: latestProposal.admin_comments,
                event_name: latestProposal.event_name,
                organization_name: latestProposal.organization_name,
                created_at: latestProposal.created_at,
                updated_at: latestProposal.updated_at
            },
            meta: {
                searched_draftid: draftId,
                found_by: 'latest_user_proposal',
                mysql_id: latestProposal.id,
                total_proposals: userProposals.length,
                message: 'Returned the most recent proposal for this user'
            },
            alternatives: userProposals.slice(1, 4).map(p => ({
                id: p.id,
                uuid: p.uuid,
                event_name: p.event_name,
                proposal_status: p.proposal_status,
                created_at: p.created_at
            }))
        });

    } catch (error) {
        console.error('❌ DRAFT ID LOOKUP: Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            draftId: draftId,
            message: 'Failed to lookup proposal by draftId'
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// STUDENT PROPOSAL STATUS ENDPOINT (MYSQL ONLY)
// =============================================

/**
 * @route GET /api/mongodb-unified/student-proposal/:id
 * @desc Get proposal status for student using only MySQL database
 * @access Public (Student)
 * 
 * @param {string} id - Proposal ID (MySQL integer or draftId)
 * @returns {Object} Proposal status and metadata from MySQL
 */
router.get('/student-proposal/:id', async (req, res) => {
    const proposalId = req.params.id;
    // console.log('📋 MYSQL STUDENT PROPOSAL: Fetching proposal status for ID:', proposalId);

    let connection;
    try {
        // STEP 1: Determine ID type and prepare query
        let isNumericId = !isNaN(parseInt(proposalId)) && isFinite(proposalId);
        // console.log('📋 MYSQL STUDENT PROPOSAL: ID type:', isNumericId ? 'MySQL Integer' : 'DraftId/UUID');

        // STEP 2: Get MySQL proposal data
        connection = await pool.getConnection();
        let proposalQuery;
        let queryParams;

        if (isNumericId) {
            // If it's a numeric ID, query directly by ID
            proposalQuery = 'SELECT * FROM proposals WHERE id = ?';
            queryParams = [parseInt(proposalId)];
        } else {
            // If it's not numeric, try to find by UUID (draftId maps to uuid in MySQL)
            proposalQuery = `
                SELECT * FROM proposals 
                WHERE uuid = ? OR id = ?
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            queryParams = [proposalId, proposalId];
        }

        // console.log('📋 MYSQL STUDENT PROPOSAL: Executing query:', {
        //     query: proposalQuery.replace(/\s+/g, ' ').trim(),
        //     params: queryParams
        // });

        const [rows] = await connection.query(proposalQuery, queryParams);

        if (rows.length === 0) {
            // console.log('📋 MYSQL STUDENT PROPOSAL: No proposal found for ID:', proposalId);

            // DEBUGGING: Show available proposals
            try {
                const [allProposals] = await connection.query(
                    'SELECT id, uuid, organization_name, proposal_status FROM proposals ORDER BY created_at DESC LIMIT 10'
                );
                // console.log('📋 MYSQL STUDENT PROPOSAL: Available proposals (last 10):', allProposals);
            } catch (debugError) {
                // console.log('📋 MYSQL STUDENT PROPOSAL: Could not fetch debug proposals:', debugError.message);
            }

            return res.status(404).json({
                success: false,
                error: 'Proposal not found in MySQL database',
                searchedId: proposalId,
                searchType: isNumericId ? 'mysql_integer' : 'uuid_draftid',
                debug: {
                    query: proposalQuery.replace(/\s+/g, ' ').trim(),
                    params: queryParams,
                    message: 'Check console logs for available proposals',
                    note: 'This service uses MySQL only. MongoDB is optional.'
                }
            });
        }

        const proposal = rows[0];
        console.log('✅ MYSQL STUDENT PROPOSAL: Found proposal:', {
            id: proposal.id,
            uuid: proposal.uuid,
            organization_name: proposal.organization_name,
            proposal_status: proposal.proposal_status,
            report_status: proposal.report_status
        });

        // STEP 3: Return formatted response (MySQL data only)
        const responseData = {
            success: true,
            proposal: {
                // Primary identifiers
                id: proposal.id,
                uuid: proposal.uuid,
                mysql_id: proposal.id,

                // Status fields (normalized)
                proposal_status: proposal.proposal_status,
                status: proposal.proposal_status, // Normalized field
                report_status: proposal.report_status,

                // Comments (normalized)
                admin_comments: proposal.admin_comments,
                adminComments: proposal.admin_comments, // Normalized field

                // Event details
                event_name: proposal.event_name,
                organization_name: proposal.organization_name,
                event_status: proposal.event_status,

                // Timestamps
                created_at: proposal.created_at,
                updated_at: proposal.updated_at,
                submitted_at: proposal.submitted_at,

                // Additional fields
                contact_email: proposal.contact_email,
                contact_person: proposal.contact_person,
                event_start_date: proposal.event_start_date,
                event_end_date: proposal.event_end_date
            },
            meta: {
                searched_id: proposalId,
                found_by: isNumericId ? 'mysql_id' : 'uuid_draftid_lookup',
                mysql_id: proposal.id,
                data_source: 'MySQL only',
                mongodb_status: 'optional (not used)'
            }
        };

        console.log('✅ MYSQL STUDENT PROPOSAL: Returning proposal data from MySQL');
        res.json(responseData);

    } catch (error) {
        console.error('❌ MYSQL STUDENT PROPOSAL: Error fetching proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal status from MySQL database',
            searched_id: proposalId,
            data_source: 'MySQL only'
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// USER PROPOSALS ENDPOINT (MYSQL ONLY)
// =============================================

/**
 * @route GET /api/mongodb-unified/user-proposals
 * @desc Get all proposals for the current authenticated user from MySQL
 * @access Private (Authenticated users)
 */
router.get('/user-proposals', validateToken, async (req, res) => {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;

        // ✅ DEBUGGING: Check if auth middleware is working
        // console.log('📋 MYSQL USER PROPOSALS: Auth check:', {
        //     hasUser: !!user,
        //     userId: user?.id,
        //     userEmail: user?.email,
        //     userRole: user?.role,
        //     headers: {
        //         authorization: req.headers.authorization ? 'Present' : 'Missing',
        //         'x-api-key': req.headers['x-api-key'] ? 'Present' : 'Missing'
        //     }
        // });

        if (!user || !user.id) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
                debug: {
                    hasUser: !!user,
                    hasUserId: !!(user?.id),
                    authHeader: req.headers.authorization ? 'Present' : 'Missing'
                }
            });
        }

        // console.log('📋 MYSQL USER PROPOSALS: Fetching proposals for user:', user.id);

        // Get MySQL connection
        const connection = await pool.getConnection();

        try {
            // Fetch proposals from MySQL for the current user
            const [proposals] = await connection.execute(
                `SELECT 
                    id as mysql_id,
                    uuid,
                    event_name,
                    organization_name,
                    organization_type,
                    contact_email,
                    proposal_status,
                    report_status,
                    event_status,
                    created_at,
                    updated_at,
                    submitted_at,
                    admin_comments,
                    objectives,
                    budget,
                    attendance_count
                FROM proposals 
                WHERE user_id = ? 
                ORDER BY created_at DESC`,
                [user.id]
            );

            console.log('✅ MYSQL USER PROPOSALS: Successfully fetched proposals:', {
                userId: user.id,
                proposalCount: proposals.length
            });

            res.json({
                success: true,
                proposals: proposals,
                userId: user.id,
                totalCount: proposals.length,
                data_source: 'MySQL only',
                mongodb_status: 'optional (not used)'
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('❌ MYSQL USER PROPOSALS: Error fetching user proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch user proposals from MySQL database'
        });
    }
});

module.exports = router;
